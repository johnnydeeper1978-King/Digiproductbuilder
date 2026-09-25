import { verifyWhopSignature } from "../supabase/functions/_shared/whop.ts";
import { extractJson } from "../supabase/functions/_shared/ai/anthropic.ts";

const enc = new TextEncoder();
async function sign(keyBytes: Uint8Array<ArrayBuffer>, id: string, ts: string, body: string) {
  const k = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(`${id}.${ts}.${body}`));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
const secretB64 = btoa("super-secret-bytes-0123456789");
const secret = `ws_${secretB64}`;
const body = JSON.stringify({ type: "payment.succeeded", data: { id: "pay_1" } });
const now = String(Math.floor(Date.now() / 1000));

Deno.test("accepts spec (base64-decoded) key", async () => {
  const s = await sign(Uint8Array.from(atob(secretB64), c => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>, "msg_1", now, body);
  const h = new Headers({ "webhook-id": "msg_1", "webhook-timestamp": now, "webhook-signature": `v1,${s}` });
  assert(await verifyWhopSignature(body, h, secret), "should verify");
});
Deno.test("accepts raw full-string key", async () => {
  const s = await sign(enc.encode(secret), "msg_2", now, body);
  const h = new Headers({ "webhook-id": "msg_2", "webhook-timestamp": now, "webhook-signature": `v1,bogus v1,${s}` });
  assert(await verifyWhopSignature(body, h, secret), "should verify with multiple sigs");
});
Deno.test("rejects tampered body, wrong secret, stale timestamp", async () => {
  const s = await sign(enc.encode(secret), "msg_3", now, body);
  const h = new Headers({ "webhook-id": "msg_3", "webhook-timestamp": now, "webhook-signature": `v1,${s}` });
  assert(!(await verifyWhopSignature(body + " ", h, secret)), "tamper");
  assert(!(await verifyWhopSignature(body, h, "ws_other")), "wrong secret");
  const old = String(Math.floor(Date.now() / 1000) - 600);
  const s2 = await sign(enc.encode(secret), "msg_4", old, body);
  const h2 = new Headers({ "webhook-id": "msg_4", "webhook-timestamp": old, "webhook-signature": `v1,${s2}` });
  assert(!(await verifyWhopSignature(body, h2, secret)), "stale");
});
Deno.test("extractJson handles fences and prose", () => {
  assert((extractJson('```json\n{"a":1}\n```') as any).a === 1, "fence");
  assert((extractJson('Here you go: {"a":{"b":2}} thanks') as any).a.b === 2, "prose");
  assert(extractJson("no json here") === undefined, "none");
});
