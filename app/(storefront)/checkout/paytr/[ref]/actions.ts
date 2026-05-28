"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/server/db/client";
import { PaymentService } from "@/server/services/payment.service";
import { LAST_ORDER_COOKIE } from "@/lib/constants";
import type { AppLocale } from "@/i18n/routing";

export async function retryPayTRTokenAction(raw: unknown) {
  const parsed = z.object({ reference: z.string().min(1) }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID" } as const;

  // Authorize before doing anything expensive. Same rule as the iframe page:
  // the caller must either own LAST_ORDER_COOKIE for this order, or be the
  // signed-in user whose email matches. Without this, anyone who learns a
  // payment.reference can burn the merchant's PayTR API budget and invalidate
  // the customer's live iframe token.
  const payment = await prisma.payment.findFirst({
    where: { reference: parsed.data.reference },
    select: { order: { select: { orderNumber: true, email: true } } },
  });
  if (!payment?.order) return { ok: false, error: "NOT_FOUND" } as const;

  const [cookieStore, session] = await Promise.all([cookies(), auth().catch(() => null)]);
  const cookieMatch =
    cookieStore.get(LAST_ORDER_COOKIE)?.value === payment.order.orderNumber;
  const sessionMatch =
    !!session?.user?.email && session.user.email === payment.order.email;
  if (!cookieMatch && !sessionMatch) {
    return { ok: false, error: "UNAUTHORIZED" } as const;
  }

  try {
    const locale = (await getLocale()) as AppLocale;
    const h = await headers();
    const userIp = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined;
    const result = await PaymentService.retryInitiate({
      paymentReference: parsed.data.reference,
      locale,
      userIp,
    });
    if (!result) return { ok: false, error: "ALREADY_PAID_OR_MISSING" } as const;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FAILED" } as const;
  }
  revalidatePath(`/checkout/paytr/${parsed.data.reference}`);
  return { ok: true } as const;
}
