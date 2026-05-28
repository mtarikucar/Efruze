"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import Decimal from "decimal.js";
import { z } from "zod";
import { CART_COOKIE, LAST_ORDER_COOKIE } from "@/lib/constants";
import { OrderService } from "@/server/services/order.service";
import { EmailService } from "@/server/services/email.service";
import { CartService } from "@/server/services/cart.service";
import { CouponService } from "@/server/services/coupon.service";
import { checkoutInput, type CheckoutInput } from "@/server/types/order";
import { prisma } from "@/server/db/client";
import { auth } from "@/auth";
import { rateLimit, MINUTE, HOUR } from "@/lib/rate-limit";
import type { AppLocale } from "@/i18n/routing";

async function getClientIp(): Promise<string | undefined> {
  const h = await headers();
  // Vercel / most reverse proxies set x-forwarded-for; some set x-real-ip.
  return h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined;
}

type ActionResult = { ok: false; error: string; details?: Record<string, string[]> };

export async function placeOrderAction(raw: unknown): Promise<ActionResult> {
  const parsed = checkoutInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "INVALID_INPUT",
      details: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const input: CheckoutInput = parsed.data;
  const locale = (await getLocale()) as AppLocale;

  // Order-spam guard: 10 order attempts/minute per IP.
  const rlIp = (await getClientIp()) ?? "unknown";
  const rl = rateLimit(`placeorder:${rlIp}`, 10, MINUTE);
  if (!rl.ok) return { ok: false, error: "TOO_MANY_REQUESTS" };

  const cookieStore = await cookies();
  const cartToken = cookieStore.get(CART_COOKIE)?.value;
  if (!cartToken) return { ok: false, error: "CART_EMPTY" };

  // Bind the order to the signed-in user when available so it appears in /account/orders.
  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;
  const userIp = await getClientIp();

  let orderNumber: string;
  let redirectTarget: string;
  try {
    const { order, bankInstructions, redirect: providerRedirect, paymentReference } =
      await OrderService.createFromCart({
        cartToken,
        locale,
        input,
        userId,
        userIp,
      });
    orderNumber = order.orderNumber;

    // Send confirmation emails (parallel; never block redirect on send failure).
    const dto = await OrderService.getByOrderNumber(orderNumber, locale);
    if (dto) {
      await Promise.allSettled([
        EmailService.orderPlaced(dto),
        EmailService.adminNewOrder(dto),
        bankInstructions
          ? EmailService.bankTransferInstructions({
              to: dto.email,
              orderNumber: dto.orderNumber,
              instructions: bankInstructions,
            })
          : Promise.resolve(),
      ]);
    }

    // Route to PayTR iframe when the provider returned an iframe-token;
    // bank transfer (and any future URL-redirect providers) just go to thanks.
    if (providerRedirect?.type === "iframe-token") {
      redirectTarget = `/checkout/paytr/${paymentReference}`;
    } else {
      redirectTarget = `/orders/${orderNumber}/thanks`;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    return { ok: false, error: msg };
  }

  // For bank transfer the cart can be cleared immediately (admin confirms later).
  // For PayTR we keep the cart cookie until the webhook confirms; if the user
  // bounces from the iframe we want them to retry from the same cart.
  // But the order is already created and cart items were deleted in the tx,
  // so the cookie now points to an empty cart — that's fine either way.
  cookieStore.delete(CART_COOKIE);

  // Authorize this browser to view the success page (PII protection). The
  // /orders/[n]/thanks page rejects without either this cookie OR a signed-in
  // user whose email matches the order — knowing the order number alone is
  // not enough.
  cookieStore.set(LAST_ORDER_COOKIE, orderNumber, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h — long enough to revisit the thanks page from email
  });

  redirect(redirectTarget);
}

/**
 * Validate a coupon code against the current cart's subtotal. Pure read —
 * doesn't persist anything; the form holds the preview, and OrderService
 * re-validates and applies the discount atomically on submit.
 */
export async function applyCouponAction(raw: unknown): Promise<
  | { ok: true; code: string; type: "PERCENT" | "FIXED"; value: string; discount: string }
  | { ok: false; error: string }
> {
  const parsed = z.object({ code: z.string().min(2).max(40) }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_CODE" };
  const locale = (await getLocale()) as AppLocale;
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE)?.value ?? null;
  let cart;
  try {
    cart = await CartService.getDTO(token, locale);
  } catch {
    return { ok: false, error: "CART_UNAVAILABLE" };
  }
  if (cart.items.length === 0) return { ok: false, error: "CART_EMPTY" };

  const subtotal = new Decimal(cart.subtotal);
  const result = await CouponService.validate(parsed.data.code, subtotal);
  if (!result.ok) return { ok: false, error: result.reason };
  return {
    ok: true,
    code: result.coupon.code,
    type: result.coupon.type,
    value: result.coupon.value.toString(),
    discount: result.discount.toFixed(2),
  };
}

/**
 * Inquiry from the static Contact page. Server action so any TypeScript-shaped
 * call from the client is still untrusted at runtime — validate with Zod.
 */
const contactInquirySchema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(5000),
});

export async function contactInquiryAction(
  raw: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = contactInquirySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  // Spam guard: 5 inquiries/hour per IP.
  const rlIp = (await getClientIp()) ?? "unknown";
  const rl = rateLimit(`contact:${rlIp}`, 5, HOUR);
  if (!rl.ok) {
    return { ok: false, error: "TOO_MANY_REQUESTS" };
  }

  try {
    // Persist the inquiry so the atelier keeps a durable queue (admin UI lands
    // in a separate task). Fire the atelier notification email best-effort —
    // a send failure must never lose the saved message.
    await prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
      },
    });
    void EmailService.contactInquiry(parsed.data).catch((err) =>
      console.error("[contact] notify error", err),
    );
    return { ok: true };
  } catch (err) {
    // Fail-soft: never block the visitor on a DB hiccup — log and acknowledge.
    console.error("[contact] error", err);
    return { ok: true };
  }
}
