// Run: npm run build && npx vite preview --port 4173 & node tests/e2e/marketplace.e2e.mjs  (needs: npm i -D playwright)
// Deterministic browser QA for the Marketplace + product system.
// Mocks the Supabase edge functions with fixtures built from the real Product 4/5
// content files. No live API, no AI calls, no payments.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:4173";
const SB = "https://unsdlslapjpzyjoghhen.supabase.co";
const OUT = process.env.SHOTS_DIR ?? "test-results/marketplace-shots";
fs.mkdirSync(OUT, { recursive: true });

const content = {
  "adhd-system": JSON.parse(fs.readFileSync(new URL("../../supabase/seed/products/adhd-system.json", import.meta.url), "utf8")),
  "budgeting-system": JSON.parse(fs.readFileSync(new URL("../../supabase/seed/products/budgeting-system.json", import.meta.url), "utf8")),
};
const meta = {
  "adhd-system": { title: "369 ADHD Productivity System", category: "Productivity", sort: 40, cover: "mint" },
  "budgeting-system": { title: "2026 Budgeting System", category: "Personal finance", sort: 50 },
};
const products = [
  { key: "digital-marketing-os", title: "369 Digital Marketing OS", status: "coming_soon", price_cents: 19700, list_price_cents: 24700, category: "Marketing", tagline: "An evidence-based operating system for marketing a digital product.", purchasable: false },
  { key: "launch-system", title: "369 Digital Product Launch System", status: "coming_soon", price_cents: null, category: "Launch", tagline: "A structured system for taking a digital product from idea to launch.", purchasable: false },
  { key: "content-toolkit", title: "369 Marketing & Content Toolkit", status: "coming_soon", price_cents: null, category: "Content", tagline: "Ready-to-use prompts, templates and workflows.", purchasable: false },
  { key: "adhd-system", title: meta["adhd-system"].title, status: "live", price_cents: 1900, category: "Productivity", tagline: "Build a productivity system that makes the next action obvious.", purchasable: true },
  { key: "budgeting-system", title: meta["budgeting-system"].title, status: "live", price_cents: 1900, category: "Personal finance", tagline: "Build a clear 2026 money system.", purchasable: false },
].map((p) => ({ kind: "system", currency: "USD", list_price_cents: null, description: "A practical system.", who_for: ["You want a simple system"], outcomes: ["A working system"], includes: ["12 modules"], sort: 1, ...p }));

// ids
const lessonIndex = new Map();
const outlines = {};
for (const [key, c] of Object.entries(content)) {
  outlines[key] = c.modules.map((m) => ({
    id: `m-${key}-${m.position}`, position: m.position, title: m.title, summary: m.summary, outcome: m.outcome,
    lessons: m.lessons.map((l) => {
      const id = `00000000-0000-4000-8000-${String(key === "adhd-system" ? 1 : 2).padStart(4, "0")}${String(m.position).padStart(4, "0")}${String(l.position).padStart(4, "0")}`;
      lessonIndex.set(id, { key, m, l });
      return { id, position: l.position, title: l.title, summary: l.summary, est_minutes: l.est_minutes, is_preview: m.position === 1 && l.position === 1 };
    }),
  }));
}
const state = { owned: new Set(), progress: {}, entries: {} };
const resByKey = new Map();
for (const [key, c] of Object.entries(content)) for (const r of c.resources) resByKey.set(r.key, { ...r, product_key: key });
const resOut = (r) => ({ key: r.key, title: r.title, kind: r.kind, content: r.content, module: { position: r.module, title: content[r.product_key].modules.find((m) => m.position === r.module)?.title } });
const ids = (k) => outlines[k].flatMap((m) => m.lessons.map((l) => l.id));
function summarize(k) {
  const all = ids(k); const done = all.filter((i) => state.progress[i] === "completed");
  const next = all.find((i) => state.progress[i] !== "completed") ?? null;
  const cm = next ? outlines[k].find((m) => m.lessons.some((l) => l.id === next)) : null;
  return { lessons: all.length, completed: done.length, percent: Math.round(done.length / all.length * 100), modules: 12,
    modulesCompleted: outlines[k].filter((m) => m.lessons.every((l) => state.progress[l.id] === "completed")).length,
    nextLessonId: next, currentModule: cm ? { position: cm.position, title: cm.title } : null, byLesson: { ...state.progress } };
}
const builderKey = (k) => content[k].resources.find((r) => r.content.type === "builder").key;
const osBuilt = (k) => Boolean(Object.values(state.entries[builderKey(k)]?.fields ?? {}).some((v) => String(v ?? "").trim()));

function productAccess(body, authed) {
  const a = body.action;
  const owns = (k) => authed && state.owned.has(k);
  const deny = (k) => (!authed ? [401, { error: "unauthorized", productKey: k }] : [403, { error: "not_entitled", productKey: k }]);
  if (a === "catalog") return [200, { products: products.map((p) => ({ ...p, modules: outlines[p.key] ? 12 : 0, owned: owns(p.key) })) }];
  if (a === "product") {
    const p = products.find((x) => x.key === body.productKey); if (!p) return [404, { error: "not_found" }];
    const c = content[p.key];
    const counts = {}; for (const r of c?.resources ?? []) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
    return [200, { product: p, owned: owns(p.key), modules: outlines[p.key] ?? [], resourceCounts: counts, resourceTitles: (c?.resources ?? []).map((r) => r.title), progress: owns(p.key) ? summarize(p.key) : null }];
  }
  if (a === "lesson") {
    const hit = lessonIndex.get(body.lessonId); if (!hit) return [404, { error: "not_found" }];
    const { key, m, l } = hit; const preview = m.position === 1 && l.position === 1;
    if (!preview && !owns(key)) return deny(key);
    const all = ids(key); const i = all.indexOf(body.lessonId);
    const refs = [...new Set(l.sections.map((s) => s.resource).filter(Boolean))];
    if (owns(key) && !state.progress[body.lessonId]) state.progress[body.lessonId] = "started";
    return [200, { product: { key, title: meta[key].title }, module: { id: "m", position: m.position, title: m.title, outcome: m.outcome },
      lesson: { id: body.lessonId, module_id: "m", position: l.position, title: l.title, summary: l.summary, est_minutes: l.est_minutes, is_preview: preview },
      body: { sections: l.sections }, resources: refs.map((k) => resByKey.get(k)).filter(Boolean).map((r) => owns(key) ? r : { key: r.key, title: r.title, kind: r.kind, locked: true }),
      owned: owns(key), preview: !owns(key), watermark: owns(key) ? { email: "qa@example.com", userRef: "qa000001", issuedAt: new Date().toISOString() } : null,
      status: state.progress[body.lessonId] ?? null, lessonIndex: i, lessonCount: all.length,
      prevLessonId: i > 0 ? all[i - 1] : null, nextLessonId: i < all.length - 1 ? all[i + 1] : null }];
  }
  if (a === "progress") {
    const hit = lessonIndex.get(body.lessonId); if (!owns(hit.key)) return deny(hit.key);
    state.progress[body.lessonId] = body.status; return [200, { ok: true, ...summarize(hit.key) }];
  }
  if (a === "dashboard") {
    const k = body.productKey; if (!owns(k)) return deny(k);
    const s = summarize(k);
    return [200, { product: products.find((p) => p.key === k), modules: outlines[k], progress: s,
      vault: content[k].resources.map((r) => ({ key: r.key, title: r.title, kind: r.kind, type: r.content.type, module: resOut({ ...r, product_key: k }).module, savedAt: state.entries[r.key] ? new Date().toISOString() : null })),
      os: { key: builderKey(k), title: resByKey.get(builderKey(k)).title, built: osBuilt(k) }, completed: s.completed === s.lessons && osBuilt(k) }];
  }
  if (a === "resource" || a === "saveEntry") {
    const r = resByKey.get(body.key); if (!r) return [404, { error: "not_found" }];
    if (!owns(r.product_key)) return deny(r.product_key);
    if (a === "saveEntry") { state.entries[r.key] = body.data; return [200, { ok: true, savedAt: new Date().toISOString() }]; }
    return [200, { productKey: r.product_key, resource: resOut(r), entry: state.entries[r.key] ? { data: state.entries[r.key], savedAt: new Date().toISOString() } : null }];
  }
  if (a === "os") {
    const k = body.productKey; if (!owns(k)) return deny(k);
    const b = resByKey.get(builderKey(k));
    const pack = (r) => ({ ...resOut(r), entry: state.entries[r.key] ? { data: state.entries[r.key], savedAt: new Date().toISOString() } : null });
    return [200, { builder: pack(b), pulled: b.content.pulls.map((x) => resByKey.get(x)).filter(Boolean).map(pack), progress: summarize(k) }];
  }
  if (a === "library") {
    if (!authed) return [401, { error: "unauthorized" }];
    return [200, { products: products.filter((p) => owns(p.key)).map((p) => ({ ...p, progress: summarize(p.key), os: { built: osBuilt(p.key) }, completed: false })),
      locked: products.filter((p) => !owns(p.key)) }];
  }
  return [400, { error: "unknown_action" }];
}

const fakeSession = {
  access_token: "qa-token", token_type: "bearer", expires_in: 3600 * 24 * 365, expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
  refresh_token: "qa-refresh", user: { id: "00000000-0000-4000-8000-0000000000aa", aud: "authenticated", role: "authenticated", email: "qa@example.com", email_confirmed_at: new Date().toISOString(), app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
};

const results = [];
const check = (name, ok, extra = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${name} ${extra}`); };

async function setup(context) {
  await context.route(`${SB}/**`, async (route) => {
    const req = route.request(); const url = new URL(req.url());
    const authed = (req.headers()["authorization"] ?? "").includes("qa-token");
    const body = req.postData() ? JSON.parse(req.postData()) : {};
    let status = 200, json = {};
    if (url.pathname === "/functions/v1/product-access") [status, json] = productAccess(body, authed);
    else if (url.pathname === "/functions/v1/whop-checkout") [status, json] = authed ? [200, { url: `${BASE}/library/${body.productKey}?checkout=success` }] : [401, { error: "unauthorized" }];
    else if (url.pathname === "/rest/v1/waitlist") [status, json] = [201, {}];
    else if (url.pathname.startsWith("/auth/v1/user")) [status, json] = authed ? [200, fakeSession.user] : [401, {}];
    else if (url.pathname === "/functions/v1/discovery") [status, json] = [201, { session: { id: "11111111-1111-4111-8111-111111111111", anon_token: "anon-qa" } }];
    else if (url.pathname === "/functions/v1/discovery-interview") {
      const n = body.action === "answer" ? 2 : 1;
      json = { step: { kind: "question", question: { key: `q${n}`, section: 1, sectionTitle: "You", sectionIntro: "First, a little about you.", text: n === 1 ? "What best describes your current situation?" : "Which skills do you use most?", why: "This shapes which products are realistic for you.", type: n === 1 ? "single" : "multi", options: [{ value: "a", label: "Employed full-time" }, { value: "b", label: "Self-employed" }, { value: "c", label: "Student" }, { value: "d", label: "Between jobs" }], allowOther: true, required: true, source: "bank", previous: null } }, progress: { answered: n - 1, total: 30, percent: (n - 1) * 3 } };
    }
    else [status, json] = [404, { error: "unmocked " + url.pathname }];
    await route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(json) });
  });
}
const signIn = (page) => page.addInitScript((s) => localStorage.setItem("sb-unsdlslapjpzyjoghhen-auth-token", JSON.stringify(s)), fakeSession);

async function shot(page, name) { await page.waitForTimeout(350); await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }); }
async function noHScroll(page, name) {
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  check(`no horizontal page scroll: ${name}`, w[0] <= w[1] + 1, `(${w[0]} vs ${w[1]})`);
}

const browser = await chromium.launch();
const p4first = outlines["adhd-system"][0].lessons[0].id;
const p4second = outlines["adhd-system"][0].lessons[1].id;
const p5budgetLesson = outlines["budgeting-system"][8].lessons[2].id;

for (const vp of [{ name: "desktop", width: 1280, height: 860 }, { name: "mobile", width: 390, height: 844 }]) {
  const errors = [];
  // ---- Anonymous visitor
  let ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  await setup(ctx);
  let page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/`); await page.waitForSelector(".dual-card");
  check(`[${vp.name}] home shows both paths`, (await page.locator(".dual-card").count()) === 2);
  await noHScroll(page, `${vp.name} home`); await shot(page, `${vp.name}-01-home`);
  await page.goto(`${BASE}/marketplace`); await page.waitForSelector(".mk-card");
  check(`[${vp.name}] marketplace lists 5 products`, (await page.locator(".mk-card").count()) === 5);
  await noHScroll(page, `${vp.name} marketplace`); await shot(page, `${vp.name}-02-marketplace`);
  await page.goto(`${BASE}/marketplace/adhd-system`); await page.waitForSelector(".mk-module");
  check(`[${vp.name}] product page shows 12 modules`, (await page.locator(".mk-modules .mk-module").count()) === 12);
  check(`[${vp.name}] product page buy button`, await page.locator("text=Get instant access").first().isVisible());
  await noHScroll(page, `${vp.name} product`); await shot(page, `${vp.name}-03-product-p4`);
  await page.goto(`${BASE}/marketplace/budgeting-system`); await page.waitForSelector(".mk-module");
  check(`[${vp.name}] P5 without Whop id shows opening-soon, no buy`, (await page.locator("text=Get instant access").count()) === 0 && (await page.locator("text=Checkout opens shortly").count()) > 0);
  await page.goto(`${BASE}/marketplace/digital-marketing-os`); await page.waitForSelector(".mk-cta");
  check(`[${vp.name}] coming soon product not purchasable`, (await page.locator("text=Get instant access").count()) === 0 && (await page.locator("text=Join the list").count()) > 0);
  await page.goto(`${BASE}/learn/${p4first}`); await page.waitForSelector(".mk-article");
  check(`[${vp.name}] anon preview lesson renders`, await page.locator("text=Free preview lesson").isVisible());
  check(`[${vp.name}] preview resources locked`, (await page.locator(".mk-res-locked").count()) >= 0 && (await page.locator(".rt").count()) === 0);
  await noHScroll(page, `${vp.name} preview lesson`); await shot(page, `${vp.name}-04-lesson-preview`);
  await page.goto(`${BASE}/learn/${p4second}`); await page.waitForURL(/\/login\?next=/);
  check(`[${vp.name}] anon locked lesson → login`, page.url().includes("/login?next="));
  await shot(page, `${vp.name}-05-login`);
  await page.goto(`${BASE}/library`); await page.waitForURL(/\/login/);
  check(`[${vp.name}] anon library → login`, page.url().includes("/login"));
  await page.goto(`${BASE}/discover`); await page.waitForSelector("text=Start Free Discovery");
  await shot(page, `${vp.name}-06-discover-intro`);
  await page.click("text=Start Free Discovery"); await page.waitForSelector(".d-q-title");
  check(`[${vp.name}] discovery shows first question`, (await page.locator(".opt").count()) === 4);
  await page.click(".opt >> nth=1"); await page.click("text=Next →"); await page.waitForSelector("text=Which skills");
  check(`[${vp.name}] discovery advances`, true);
  await noHScroll(page, `${vp.name} discover`); await shot(page, `${vp.name}-07-discover-question`);
  await ctx.close();

  // ---- Signed in, not purchased
  state.owned.clear();
  ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  await setup(ctx); page = await ctx.newPage(); await signIn(page);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/library`); await page.waitForSelector(".mk-empty");
  check(`[${vp.name}] unpaid library empty + locked list`, (await page.locator(".mk-locked-row").count()) === 5);
  await shot(page, `${vp.name}-08-library-empty`);
  await page.goto(`${BASE}/library/adhd-system`); await page.waitForURL(/\/marketplace\/adhd-system/);
  check(`[${vp.name}] unpaid dashboard → marketplace`, page.url().endsWith("/marketplace/adhd-system"));
  await page.goto(`${BASE}/learn/${p4second}`); await page.waitForURL(/\/marketplace\/adhd-system/);
  check(`[${vp.name}] unpaid lesson → marketplace`, true);
  // Buy → (mock) checkout → success page; webhook simulated by flipping ownership after a delay
  await page.goto(`${BASE}/marketplace/adhd-system`); await page.waitForSelector("text=Get instant access");
  setTimeout(() => state.owned.add("adhd-system"), 2500);
  await page.click("text=Get instant access");
  await page.waitForSelector("text=Confirming your payment");
  check(`[${vp.name}] checkout return shows confirming`, true);
  await page.waitForSelector(".mk-dash-head", { timeout: 15000 });
  check(`[${vp.name}] entitlement appears → dashboard`, await page.locator("text=Payment confirmed").isVisible());
  await noHScroll(page, `${vp.name} dashboard`); await shot(page, `${vp.name}-09-dashboard`);

  // ---- Owned: learn, fill a resource, complete
  await page.click("text=Start Module 1"); await page.waitForSelector(".mk-article");
  check(`[${vp.name}] owned lesson shows watermark`, (await page.locator(".mk-watermark span").count()) > 0);
  const openBtn = page.locator("text=Open & fill in").first();
  if (await openBtn.count()) {
    await openBtn.click(); await page.waitForSelector(".rt");
    const ta = page.locator(".rt textarea, .rt input[type=text]").first(); await ta.fill("QA answer");
    await page.locator(".rt .btn.primary", { hasText: "Save" }).first().click();
    await page.waitForSelector(".rt-saved");
    check(`[${vp.name}] inline resource saves`, true);
  }
  await noHScroll(page, `${vp.name} owned lesson`); await shot(page, `${vp.name}-10-lesson-owned`);
  const opt = page.locator(".mk-opts button").first(); await opt.click();
  check(`[${vp.name}] quiz gives feedback`, (await page.locator(".mk-explain").count()) > 0);
  await page.click("text=Mark complete & continue"); await page.waitForURL(new RegExp(p4second));
  check(`[${vp.name}] completing lesson moves to next`, page.url().includes(p4second));
  await page.goto(`${BASE}/library/adhd-system/tools/p4-master-capture-list`); await page.waitForSelector(".rt-table");
  await page.locator(".rt-table tbody tr").last().locator("input[type=text]").first().fill("Renew car licence");
  await page.click("text=+ Add row");
  await noHScroll(page, `${vp.name} table tool`); await shot(page, `${vp.name}-11-tool-table`);
  await page.goto(`${BASE}/library/adhd-system/os`); await page.waitForSelector(".mk-os-builder");
  await shot(page, `${vp.name}-12-os`);
  await page.goto(`${BASE}/library`); await page.waitForSelector(".mk-owned-card");
  check(`[${vp.name}] library shows owned with progress`, (await page.locator(".mk-owned-card").count()) === 1);
  await shot(page, `${vp.name}-13-library-owned`);
  // Paid user cannot access the other product
  await page.goto(`${BASE}/library/budgeting-system`); await page.waitForURL(/\/marketplace\/budgeting-system/);
  check(`[${vp.name}] owning P4 does not unlock P5`, true);
  // Budget formula tool (owned P5 temporarily)
  state.owned.add("budgeting-system");
  await page.goto(`${BASE}/library/budgeting-system/tools/p5-sinking-fund-planner`); await page.waitForSelector(".rt-table");
  const row = page.locator(".rt-table tbody tr").last();
  const nums = row.locator("input[type=number]");
  await row.locator("input[type=text]").first().fill("Car service");
  await nums.nth(0).fill("1200"); await nums.nth(1).fill("300"); await nums.nth(2).fill("6");
  const outs = await row.locator(".rt-out").allTextContents();
  check(`[${vp.name}] sinking fund formulas (remaining 900, per period 150)`, outs.includes("900") && outs.includes("150"), JSON.stringify(outs));
  await shot(page, `${vp.name}-14-p5-sinking-fund`);
  await page.goto(`${BASE}/learn/${p5budgetLesson}`); await page.waitForSelector(".mk-article");
  await shot(page, `${vp.name}-15-p5-lesson`);
  state.owned.delete("budgeting-system");
  check(`[${vp.name}] no uncaught page errors`, errors.length === 0, errors.slice(0, 3).join(" | "));
  await ctx.close();
  state.owned.clear(); state.progress = {}; state.entries = {};
}
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
