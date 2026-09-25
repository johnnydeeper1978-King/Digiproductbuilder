// Whop boundary (Deno, SERVER ONLY). API key and webhook secret come from
// Deno.env and never reach the browser. IDs below are public identifiers.
const API = "https://api.whop.com/api/v1";

export class WhopNotConfiguredError extends Error {
  constructor(message: string) { super(message); this.name = "WhopNotConfiguredError"; }
}

export function whopIds() {
  return {
    companyId: Deno.env.get("WHOP_COMPANY_ID") ?? "biz_5LxzQhYQsk1Wbw",
    builderProductId: Deno.env.get("WHOP_BUILDER_PRODUCT_ID") ?? "prod_UywgvuejgK9Nx",
  };
}

function apiKey(): string {
  const key = Deno.env.get("WHOP_API_KEY");
  if (!key) throw new WhopNotConfiguredError("WHOP_API_KEY is not configured.");
  return key;
}

async function whopFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({})) as { error?: { message?: string; type?: string } };
  if (!res.ok) {
    throw new Error(`whop ${res.status} ${body.error?.type ?? ""}: ${body.error?.message ?? "request failed"}`);
  }
  return body;
}

type Plan = {
  id: string; product?: { id?: string }; visibility?: string;
  release_method?: string; plan_type?: string; created_at?: string | number;
};

let cachedPlanId: string | null = null;

/** The Builder's buy-now plan, looked up from the product so price changes need no redeploy. */
export async function resolveBuilderPlanId(): Promise<string> {
  const override = Deno.env.get("WHOP_BUILDER_PLAN_ID");
  if (override) return override;
  if (cachedPlanId) return cachedPlanId;

  const { companyId, builderProductId } = whopIds();
  const qs = new URLSearchParams({ company_id: companyId, first: "50" });
  qs.append("product_ids[]", builderProductId);
  const res = await whopFetch(`/plans?${qs}`) as { data?: Plan[] };
  const plans = (res.data ?? []).filter((p) => p.product?.id === builderProductId);
  const buyable = plans.filter((p) => (p.release_method ?? "buy_now") === "buy_now" && p.visibility !== "archived");
  const pick = buyable.find((p) => p.visibility === "visible" && p.plan_type === "one_time")
    ?? buyable.find((p) => p.visibility === "visible")
    ?? buyable[0];
  if (!pick) throw new Error(`No buy-now plan found for Whop product ${builderProductId}.`);
  cachedPlanId = pick.id;
  return pick.id;
}

/** A checkout carrying our user/purchase ids in metadata; the payment inherits it. */
export async function createBuilderCheckout(opts: {
  userId: string; purchaseId: string; redirectUrl?: string;
}): Promise<{ id: string; url: string }> {
  const planId = await resolveBuilderPlanId();
  const res = await whopFetch("/checkout_configurations", {
    method: "POST",
    body: JSON.stringify({
      mode: "payment",
      plan_id: planId,
      metadata: { user_id: opts.userId, purchase_id: opts.purchaseId, product_key: "builder" },
      ...(opts.redirectUrl ? { redirect_url: opts.redirectUrl } : {}),
    }),
  }) as { id: string; purchase_url: string };
  return { id: res.id, url: new URL(res.purchase_url, "https://whop.com").toString() };
}

// ---- Webhook signature (Standard Webhooks) ----

const enc = new TextEncoder();

function toB64(buf: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Whop's docs say the HMAC key is "your ws_ secret" but don't pin down the
// byte derivation, and the Standard Webhooks spec base64-decodes the part after
// the prefix. Accept any of the derivations of OUR secret; all are secret-bound.
function candidateKeys(secret: string): Uint8Array<ArrayBuffer>[] {
  const keys: Uint8Array<ArrayBuffer>[] = [enc.encode(secret)];
  const m = secret.match(/^(ws_|whsec_)(.+)$/);
  if (m) {
    keys.push(enc.encode(m[2]));
    try { keys.push(Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>); } catch { /* not base64 */ }
  }
  return keys;
}

export async function verifyWhopSignature(rawBody: string, headers: Headers, secret: string): Promise<boolean> {
  const id = headers.get("webhook-id");
  const ts = headers.get("webhook-timestamp");
  const sigHeader = headers.get("webhook-signature");
  if (!id || !ts || !sigHeader) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > 300) return false; // replay window

  const provided = sigHeader.split(" ")
    .map((part) => part.split(","))
    .filter(([v]) => v === "v1")
    .map(([, sig]) => sig ?? "");
  if (provided.length === 0) return false;

  const payload = enc.encode(`${id}.${ts}.${rawBody}`);
  for (const keyBytes of candidateKeys(secret)) {
    const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const expected = toB64(await crypto.subtle.sign("HMAC", key, payload));
    if (provided.some((p) => safeEqual(p, expected))) return true;
  }
  return false;
}
