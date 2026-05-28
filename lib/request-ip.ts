import { headers } from "next/headers";

/**
 * Best-effort client IP for rate-limiting keys. Behind nginx, the real client
 * is the first hop in x-forwarded-for. Falls back to a constant so a missing
 * header degrades to a shared bucket rather than throwing.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip") ?? "unknown";
}
