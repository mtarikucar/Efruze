"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";
import { OrderService } from "@/server/services/order.service";
import { rateLimit, HOUR } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import type { OrderDTO } from "@/server/types/order";
import type { AppLocale } from "@/i18n/routing";

const lookupSchema = z.object({
  // Order numbers look like "EFR-2026-ABC123". Keep validation loose (length
  // bounds) so a typo surfaces as "not found", not a confusing field error.
  orderNumber: z.string().trim().min(4).max(40),
  email: z.string().trim().email("Geçerli bir e-posta girin").max(200),
});

export type LookupResult =
  | { ok: true; order: OrderDTO }
  | { ok: false; error: string };

/**
 * Guest order lookup. Validates input, rate-limits per IP (brute-force guard),
 * then asks OrderService to match orderNumber + email server-side. A wrong
 * email and a non-existent order both return the same generic NOT_FOUND so the
 * endpoint can't be used to enumerate which order numbers exist.
 */
export async function lookupOrderAction(raw: unknown): Promise<LookupResult> {
  const parsed = lookupSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "INVALID_INPUT" };
  }

  // Brute-force guard: 10 lookups/hour per IP. Stops scripted enumeration of
  // order numbers against a known/guessed email.
  const ip = await getClientIp();
  const rl = rateLimit(`order-lookup:${ip}`, 10, HOUR);
  if (!rl.ok) return { ok: false, error: "TOO_MANY_REQUESTS" };

  // Normalise: order numbers are stored uppercase; email match is already
  // case-insensitive server-side but trim/lowercase keeps the key tidy.
  const orderNumber = parsed.data.orderNumber.toUpperCase();
  const email = parsed.data.email.toLowerCase();
  const locale = (await getLocale()) as AppLocale;

  try {
    const order = await OrderService.lookupForGuest(orderNumber, email, locale);
    if (!order) return { ok: false, error: "NOT_FOUND" };
    return { ok: true, order };
  } catch (err) {
    console.error("[order-lookup] failed", err);
    return { ok: false, error: "UNKNOWN" };
  }
}
