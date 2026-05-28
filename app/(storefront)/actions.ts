"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { CartService } from "@/server/services/cart.service";
import { prisma } from "@/server/db/client";
import {
  addToCartInput,
  updateQtyInput,
  removeItemInput,
  newsletterInput,
  type AddToCartInput,
  type UpdateQtyInput,
  type RemoveItemInput,
  type NewsletterInput,
} from "@/server/types/cart";
import type { AppLocale } from "@/i18n/routing";
import { CART_COOKIE } from "@/lib/constants";

type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function ensureCartToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_COOKIE)?.value;
  if (existing) return existing;
  const next = CartService.newToken();
  cookieStore.set(CART_COOKIE, next, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });
  return next;
}

export async function addToCartAction(raw: AddToCartInput): Promise<ActionResult> {
  const parsed = addToCartInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  try {
    const token = await ensureCartToken();
    await CartService.addItem(token, parsed.data.productId, parsed.data.variantId, parsed.data.quantity);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    return { ok: false, error: msg };
  }
}

export async function updateCartItemQtyAction(raw: UpdateQtyInput): Promise<ActionResult> {
  const parsed = updateQtyInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE)?.value;
  if (!token) return { ok: false, error: "NO_CART" };
  try {
    await CartService.updateQty(token, parsed.data.itemId, parsed.data.quantity);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    return { ok: false, error: msg };
  }
}

export async function removeCartItemAction(raw: RemoveItemInput): Promise<ActionResult> {
  const parsed = removeItemInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE)?.value;
  if (!token) return { ok: false, error: "NO_CART" };
  try {
    await CartService.removeItem(token, parsed.data.itemId);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    return { ok: false, error: msg };
  }
}

export async function subscribeNewsletterAction(raw: NewsletterInput): Promise<ActionResult> {
  const parsed = newsletterInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_EMAIL" };
  try {
    // Race-safe via upsert: the previous findUnique + create flow let two
    // concurrent submissions for the same email hit a P2002 unique violation.
    // upsert is a single atomic statement and idempotent for repeat signups —
    // re-submitting the same email just re-asserts newsletter=true.
    const user = await prisma.user.upsert({
      where: { email: parsed.data.email },
      update: {}, // leave role/name/passwordHash etc. untouched for existing users
      create: { email: parsed.data.email, role: "CUSTOMER" },
    });
    await prisma.customer.upsert({
      where: { userId: user.id },
      create: { userId: user.id, newsletter: true },
      update: { newsletter: true },
    });
    return { ok: true };
  } catch (err) {
    // Newsletter subscription should never block — log and succeed visibly.
    console.error("[newsletter]", err);
    return { ok: true };
  }
}

// Re-export the locale helper for actions that need it
export async function getActionLocale(): Promise<AppLocale> {
  return (await getLocale()) as AppLocale;
}
