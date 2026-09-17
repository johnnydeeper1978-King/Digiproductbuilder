/** Anonymous Discovery token persistence (per-browser). Not a secret. */
const KEY = "369d.discovery.anonToken";

export function getStoredAnonToken(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function setStoredAnonToken(token: string): void {
  try { localStorage.setItem(KEY, token); } catch { /* storage unavailable */ }
}
export function clearStoredAnonToken(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
