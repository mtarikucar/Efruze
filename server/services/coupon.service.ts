import Decimal from "decimal.js";
import { prisma } from "@/server/db/client";
import type { Coupon } from "@prisma/client";

export type CouponValidation =
  | { ok: true; coupon: Coupon; discount: Decimal }
  | { ok: false; reason: "NOT_FOUND" | "INACTIVE" | "EXPIRED" | "NOT_STARTED" | "MIN_SUBTOTAL" | "USAGE_EXHAUSTED" };

export const CouponService = {
  /**
   * Validate a coupon code against the cart subtotal. Returns the coupon row
   * and the computed discount amount (capped at subtotal). Pure read — does
   * not mutate the coupon's usedCount.
   */
  async validate(code: string, subtotal: Decimal): Promise<CouponValidation> {
    const c = await prisma.coupon.findUnique({ where: { code: code.trim() } });
    if (!c) return { ok: false, reason: "NOT_FOUND" };
    if (!c.isActive) return { ok: false, reason: "INACTIVE" };

    const now = new Date();
    if (c.startsAt && c.startsAt > now) return { ok: false, reason: "NOT_STARTED" };
    if (c.endsAt && c.endsAt < now) return { ok: false, reason: "EXPIRED" };
    if (c.usageLimit != null && c.usedCount >= c.usageLimit) {
      return { ok: false, reason: "USAGE_EXHAUSTED" };
    }
    if (c.minSubtotal != null && subtotal.lt(c.minSubtotal.toString())) {
      return { ok: false, reason: "MIN_SUBTOTAL" };
    }

    const discount =
      c.type === "PERCENT"
        ? subtotal.times(new Decimal(c.value.toString())).dividedBy(100)
        : new Decimal(c.value.toString());

    return {
      ok: true,
      coupon: c,
      discount: Decimal.min(discount, subtotal),
    };
  },

  /** Increment usedCount atomically. Called from OrderService.createFromCart on commit. */
  async markUsed(couponId: string, tx?: typeof prisma): Promise<void> {
    const client = tx ?? prisma;
    await client.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  },
};
