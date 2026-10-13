// Edge Function: `product-access` — the Marketplace product engine API.
// POST { action, ... }:
//   catalog                         public: marketplace listing (+ owned flags when signed in)
//   product   { productKey }        public outline (+ owned/progress when signed in & entitled)
//   lesson    { lessonId }          lesson body + its resources. Preview lessons are public;
//                                    everything else REQUIRES a paid entitlement.
//   progress  { lessonId, status }  "started" | "completed" — entitled users only
//   dashboard { productKey }        entitled: modules, progress, current lesson, vault, OS status
//   resources { productKey }        entitled: the product's resource vault (definitions)
//   resource  { key }               entitled: one resource definition + the user's saved entry
//   saveEntry { key, data }         entitled: save the user's answers for one resource
//   os        { productKey }        entitled: the final OS builder + every pulled saved entry
//   library                         signed-in: owned products with progress + locked products
// Lesson bodies, resources and entries sit in tables with no RLS select policy;
// this function (service role) is the only reader and checks entitlement first.
// No AI calls anywhere in this function.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdminClient, getCallerUid } from "../_shared/supabaseAdmin.ts";
import { hasEntitlement, ownedProductKeys } from "../_shared/entitlements.ts";

const KEY = /^[a-z0-9-]{2,40}$/;
const RES_KEY = /^[a-z0-9-]{2,60}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ENTRY_BYTES = 100_000;
const PRODUCT_COLS =
  "key, kind, title, tagline, description, category, status, price_cents, list_price_cents, currency, who_for, outcomes, includes, sort, whop_product_id";

// deno-lint-ignore no-explicit-any
type Any = any;
type Lesson = { id: string; position: number; title: string; summary: string | null; est_minutes: number | null; is_preview: boolean };
type Module = { id: string; position: number; title: string; summary: string | null; outcome: string | null; lessons: Lesson[] };

/** Public view of a product: never leaks the Whop id, adds `purchasable`. */
function publicProduct(p: Any) {
  const { whop_product_id, ...rest } = p;
  return { ...rest, purchasable: p.status === "live" && Boolean(whop_product_id) };
}

async function outline(admin: SupabaseClient, productKey: string): Promise<Module[]> {
  const { data } = await admin.from("catalog_modules")
    .select("id, position, title, summary, outcome, catalog_lessons(id, position, title, summary, est_minutes, is_preview, status)")
    .eq("product_key", productKey).eq("status", "published").order("position");
  return (data ?? []).map((m: Any) => ({
    id: m.id, position: m.position, title: m.title, summary: m.summary, outcome: m.outcome,
    lessons: (m.catalog_lessons ?? [])
      .filter((l: Any) => l.status === "published")
      .sort((a: Any, b: Any) => a.position - b.position)
      .map(({ status: _s, ...l }: Any) => l),
  }));
}

const lessonIds = (mods: Module[]) => mods.flatMap((m) => m.lessons.map((l) => l.id));

async function progressFor(admin: SupabaseClient, uid: string, ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data } = await admin.from("user_progress").select("lesson_id, status").eq("user_id", uid).in("lesson_id", ids);
  return Object.fromEntries((data ?? []).map((r: Any) => [r.lesson_id, r.status]));
}

function summarize(mods: Module[], progress: Record<string, string>) {
  const ids = lessonIds(mods);
  const done = ids.filter((id) => progress[id] === "completed").length;
  const modulesDone = mods.filter((m) => m.lessons.length > 0 && m.lessons.every((l) => progress[l.id] === "completed")).length;
  const next = ids.find((id) => progress[id] !== "completed") ?? null;
  const currentModule = next ? mods.find((m) => m.lessons.some((l) => l.id === next)) ?? null : null;
  return {
    lessons: ids.length, completed: done, percent: ids.length ? Math.round((done / ids.length) * 100) : 0,
    modules: mods.length, modulesCompleted: modulesDone,
    nextLessonId: next,
    currentModule: currentModule ? { position: currentModule.position, title: currentModule.title } : null,
  };
}

/** Builder resource of a product (the final OS), if any. */
async function builderOf(admin: SupabaseClient, productKey: string) {
  const { data } = await admin.from("catalog_resources").select("id, key, title, content")
    .eq("product_key", productKey).eq("status", "published").eq("content->>type", "builder").limit(1).maybeSingle();
  return data as Any;
}

function entryHasContent(data: Any): boolean {
  if (!data || typeof data !== "object") return false;
  return Object.values(data).some((v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return true;
  });
}

async function osStatus(admin: SupabaseClient, uid: string, productKey: string) {
  const b = await builderOf(admin, productKey);
  if (!b) return { key: null, built: false };
  const { data: e } = await admin.from("user_resource_entries").select("data").eq("user_id", uid).eq("resource_id", b.id).maybeSingle();
  return { key: b.key as string, title: b.title as string, built: entryHasContent(e?.data?.fields ?? e?.data) };
}

/** Lesson + its module + product, only when all are visible. */
async function loadLesson(admin: SupabaseClient, lessonId: string) {
  const { data } = await admin.from("catalog_lessons")
    .select("id, module_id, position, title, summary, est_minutes, is_preview, status, catalog_modules!inner(id, product_key, position, title, outcome, status, catalog_products!inner(key, title, status))")
    .eq("id", lessonId).maybeSingle();
  const l = data as Any;
  if (!l || l.status !== "published") return null;
  const m = l.catalog_modules;
  if (!m || m.status !== "published" || !m.catalog_products || m.catalog_products.status === "draft") return null;
  return { lesson: l, module: m, product: m.catalog_products };
}

async function loadResource(admin: SupabaseClient, key: string) {
  const { data } = await admin.from("catalog_resources")
    .select("id, key, title, kind, content, product_key, module_id, status, catalog_modules(position, title)")
    .eq("key", key).eq("status", "published").maybeSingle();
  return data as Any;
}

const resourceOut = (r: Any) => ({
  key: r.key, title: r.title, kind: r.kind, content: r.content,
  module: r.catalog_modules ? { position: r.catalog_modules.position, title: r.catalog_modules.title } : null,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const action = String(body.action ?? "");

  let admin: SupabaseClient;
  try { admin = getAdminClient(); }
  catch (e) { return json({ error: "not_configured", message: String((e as Error).message) }, 501); }
  const uid = await getCallerUid(req.headers.get("Authorization"));

  /** Entitlement gate for actions keyed by product. Returns a Response on failure. */
  const gate = async (productKey: string): Promise<Response | null> => {
    if (!uid) return json({ error: "unauthorized", productKey }, 401);
    if (!(await hasEntitlement(admin, uid, productKey))) return json({ error: "not_entitled", productKey }, 403);
    return null;
  };

  if (action === "catalog") {
    const { data } = await admin.from("catalog_products").select(PRODUCT_COLS)
      .eq("kind", "system").in("status", ["coming_soon", "live"]).order("sort");
    const owned = uid ? await ownedProductKeys(admin, uid) : [];
    const { data: counts } = await admin.from("catalog_modules").select("product_key").eq("status", "published");
    const modCount: Record<string, number> = {};
    for (const c of counts ?? []) modCount[c.product_key] = (modCount[c.product_key] ?? 0) + 1;
    return json({
      products: (data ?? []).map((p) => ({ ...publicProduct(p), modules: modCount[p.key] ?? 0, owned: owned.includes(p.key) })),
    });
  }

  if (action === "product") {
    const productKey = String(body.productKey ?? "");
    if (!KEY.test(productKey)) return json({ error: "invalid_product" }, 400);
    const { data: product } = await admin.from("catalog_products").select(PRODUCT_COLS)
      .eq("key", productKey).neq("status", "draft").maybeSingle();
    if (!product) return json({ error: "not_found" }, 404);
    const mods = await outline(admin, productKey);
    const owned = uid ? await hasEntitlement(admin, uid, productKey) : false;
    if (!owned && product.status === "retired") return json({ error: "not_found" }, 404);
    const progress = owned && uid ? await progressFor(admin, uid, lessonIds(mods)) : {};
    const { data: res } = await admin.from("catalog_resources").select("kind, title")
      .eq("product_key", productKey).eq("status", "published").order("position");
    const resourceCounts: Record<string, number> = {};
    for (const r of res ?? []) resourceCounts[r.kind] = (resourceCounts[r.kind] ?? 0) + 1;
    return json({
      product: publicProduct(product), owned, modules: mods, resourceCounts,
      resourceTitles: (res ?? []).map((r) => r.title),   // titles only — no content
      progress: owned ? { byLesson: progress, ...summarize(mods, progress) } : null,
    });
  }

  if (action === "lesson") {
    const lessonId = String(body.lessonId ?? "");
    if (!UUID.test(lessonId)) return json({ error: "invalid_lesson" }, 400);
    const found = await loadLesson(admin, lessonId);
    if (!found) return json({ error: "not_found" }, 404);
    const { lesson, module, product } = found;

    const owned = uid ? await hasEntitlement(admin, uid, product.key) : false;
    if (!lesson.is_preview) {
      if (!uid) return json({ error: "unauthorized", productKey: product.key }, 401);
      if (!owned) return json({ error: "not_entitled", productKey: product.key }, 403);
    }

    const { data: content } = await admin.from("catalog_lesson_content").select("body").eq("lesson_id", lessonId).maybeSingle();
    const body0 = (content?.body ?? {}) as Any;
    const sections: Any[] = Array.isArray(body0.sections) ? body0.sections : [];

    // Resources referenced by this lesson's sections. Preview viewers get titles
    // only (locked); owners get full definitions.
    const refKeys = [...new Set(sections.map((s) => s?.resource).filter((k) => typeof k === "string" && RES_KEY.test(k)))] as string[];
    let resources: Any[] = [];
    if (refKeys.length) {
      const { data: rs } = await admin.from("catalog_resources").select("key, title, kind, content")
        .eq("product_key", product.key).eq("status", "published").in("key", refKeys);
      resources = (rs ?? []).map((r) => owned ? r : { key: r.key, title: r.title, kind: r.kind, locked: true });
    }

    const mods = await outline(admin, product.key);
    const order = lessonIds(mods);
    const i = order.indexOf(lessonId);

    let watermark = null;
    let status: string | null = null;
    if (owned && uid) {
      const { data: u } = await admin.auth.admin.getUserById(uid);
      watermark = { email: u?.user?.email ?? null, userRef: uid.slice(0, 8), issuedAt: new Date().toISOString() };
      await admin.from("user_progress").upsert(
        { user_id: uid, lesson_id: lessonId, status: "started", updated_at: new Date().toISOString() },
        { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
      );
      const { data: p } = await admin.from("user_progress").select("status").eq("user_id", uid).eq("lesson_id", lessonId).maybeSingle();
      status = p?.status ?? null;
    }

    const { status: _s, catalog_modules: _m, ...lessonOut } = lesson;
    return json({
      product: { key: product.key, title: product.title },
      module: { id: module.id, position: module.position, title: module.title, outcome: module.outcome },
      lesson: lessonOut, body: { sections }, resources,
      owned, preview: !owned, watermark, status,
      lessonIndex: i, lessonCount: order.length,
      prevLessonId: i > 0 ? order[i - 1] : null, nextLessonId: i >= 0 && i < order.length - 1 ? order[i + 1] : null,
    });
  }

  if (action === "progress") {
    if (!uid) return json({ error: "unauthorized" }, 401);
    const lessonId = String(body.lessonId ?? "");
    const status = String(body.status ?? "");
    if (!UUID.test(lessonId) || !["started", "completed"].includes(status)) return json({ error: "invalid_request" }, 400);
    const found = await loadLesson(admin, lessonId);
    if (!found) return json({ error: "not_found" }, 404);
    const denied = await gate(found.product.key);
    if (denied) return denied;
    const now = new Date().toISOString();
    const { error } = await admin.from("user_progress").upsert({
      user_id: uid, lesson_id: lessonId, status, updated_at: now, completed_at: status === "completed" ? now : null,
    }, { onConflict: "user_id,lesson_id" });
    if (error) return json({ error: "db_error" }, 500);
    const mods = await outline(admin, found.product.key);
    const progress = await progressFor(admin, uid, lessonIds(mods));
    return json({ ok: true, ...summarize(mods, progress) });
  }

  if (action === "dashboard") {
    const productKey = String(body.productKey ?? "");
    if (!KEY.test(productKey)) return json({ error: "invalid_product" }, 400);
    const denied = await gate(productKey);
    if (denied) return denied;
    const { data: product } = await admin.from("catalog_products").select(PRODUCT_COLS).eq("key", productKey).maybeSingle();
    if (!product) return json({ error: "not_found" }, 404);
    const mods = await outline(admin, productKey);
    const progress = await progressFor(admin, uid!, lessonIds(mods));
    const { data: res } = await admin.from("catalog_resources")
      .select("id, key, title, kind, content->>type, catalog_modules(position, title)")
      .eq("product_key", productKey).eq("status", "published").order("position");
    const ids = (res ?? []).map((r: Any) => r.id);
    const { data: entries } = ids.length
      ? await admin.from("user_resource_entries").select("resource_id, updated_at").eq("user_id", uid!).in("resource_id", ids)
      : { data: [] };
    const saved = new Map((entries ?? []).map((e: Any) => [e.resource_id, e.updated_at]));
    const summary = summarize(mods, progress);
    const os = await osStatus(admin, uid!, productKey);
    return json({
      product: publicProduct(product), modules: mods, progress: { byLesson: progress, ...summary },
      vault: (res ?? []).map((r: Any) => ({
        key: r.key, title: r.title, kind: r.kind, type: r.type,
        module: r.catalog_modules ? { position: r.catalog_modules.position, title: r.catalog_modules.title } : null,
        savedAt: saved.get(r.id) ?? null,
      })),
      os, completed: summary.completed === summary.lessons && summary.lessons > 0 && os.built,
    });
  }

  if (action === "resources") {
    const productKey = String(body.productKey ?? "");
    if (!KEY.test(productKey)) return json({ error: "invalid_product" }, 400);
    const denied = await gate(productKey);
    if (denied) return denied;
    const { data } = await admin.from("catalog_resources")
      .select("key, title, kind, content, position, catalog_modules(position, title)")
      .eq("product_key", productKey).eq("status", "published").order("position");
    return json({ resources: (data ?? []).map(resourceOut) });
  }

  if (action === "resource" || action === "saveEntry") {
    const key = String(body.key ?? "");
    if (!RES_KEY.test(key)) return json({ error: "invalid_resource" }, 400);
    const r = await loadResource(admin, key);
    if (!r) return json({ error: "not_found" }, 404);
    const denied = await gate(r.product_key);
    if (denied) return denied;

    if (action === "saveEntry") {
      const data = body.data;
      if (!data || typeof data !== "object" || Array.isArray(data)) return json({ error: "invalid_data" }, 400);
      if (new TextEncoder().encode(JSON.stringify(data)).length > MAX_ENTRY_BYTES) return json({ error: "too_large" }, 413);
      const now = new Date().toISOString();
      const { error } = await admin.from("user_resource_entries").upsert(
        { user_id: uid, resource_id: r.id, data, updated_at: now }, { onConflict: "user_id,resource_id" });
      if (error) return json({ error: "db_error" }, 500);
      return json({ ok: true, savedAt: now });
    }

    const { data: e } = await admin.from("user_resource_entries").select("data, updated_at")
      .eq("user_id", uid!).eq("resource_id", r.id).maybeSingle();
    return json({ productKey: r.product_key, resource: resourceOut(r), entry: e ? { data: e.data, savedAt: e.updated_at } : null });
  }

  if (action === "os") {
    const productKey = String(body.productKey ?? "");
    if (!KEY.test(productKey)) return json({ error: "invalid_product" }, 400);
    const denied = await gate(productKey);
    if (denied) return denied;
    const b = await builderOf(admin, productKey);
    if (!b) return json({ error: "not_found" }, 404);
    const pulls: string[] = Array.isArray(b.content?.pulls) ? b.content.pulls.filter((k: unknown) => typeof k === "string") : [];
    const { data: defs } = await admin.from("catalog_resources")
      .select("id, key, title, kind, content, catalog_modules(position, title)")
      .eq("product_key", productKey).eq("status", "published").in("key", [b.key, ...pulls]);
    const ids = (defs ?? []).map((d: Any) => d.id);
    const { data: entries } = ids.length
      ? await admin.from("user_resource_entries").select("resource_id, data, updated_at").eq("user_id", uid!).in("resource_id", ids)
      : { data: [] };
    const byId = new Map((entries ?? []).map((e: Any) => [e.resource_id, e]));
    const pack = (d: Any) => ({ ...resourceOut(d), entry: byId.has(d.id) ? { data: byId.get(d.id).data, savedAt: byId.get(d.id).updated_at } : null });
    const builder = (defs ?? []).find((d: Any) => d.key === b.key);
    const pulled = pulls.map((k) => (defs ?? []).find((d: Any) => d.key === k)).filter(Boolean).map(pack);
    const mods = await outline(admin, productKey);
    const progress = await progressFor(admin, uid!, lessonIds(mods));
    return json({ builder: pack(builder), pulled, progress: summarize(mods, progress) });
  }

  if (action === "library") {
    if (!uid) return json({ error: "unauthorized" }, 401);
    const keys = await ownedProductKeys(admin, uid);
    const { data: all } = await admin.from("catalog_products").select(PRODUCT_COLS)
      .eq("kind", "system").neq("status", "draft").order("sort");
    const owned = [];
    const locked = [];
    for (const p of all ?? []) {
      if (keys.includes(p.key)) {
        const mods = await outline(admin, p.key);
        const progress = await progressFor(admin, uid, lessonIds(mods));
        const summary = summarize(mods, progress);
        const os = await osStatus(admin, uid, p.key);
        owned.push({ ...publicProduct(p), progress: summary, os, completed: summary.completed === summary.lessons && summary.lessons > 0 && os.built });
      } else if (p.status !== "retired") {
        locked.push(publicProduct(p));
      }
    }
    return json({ products: owned, locked });
  }

  return json({ error: "unknown_action" }, 400);
});
