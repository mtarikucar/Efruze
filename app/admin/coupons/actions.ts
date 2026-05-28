"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";

const couponInputSchema = z
  .object({
    code: z.string().min(2).max(40).regex(/^[A-Z0-9_-]+$/, "Use A-Z, 0-9, dash, underscore"),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Must be > 0"),
    minSubtotal: z.string().optional().or(z.literal("")),
    startsAt: z.string().optional().or(z.literal("")),
    endsAt: z.string().optional().or(z.literal("")),
    usageLimit: z.coerce.number().int().min(1).optional().or(z.literal("").transform(() => undefined)),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    // PERCENT discount must be ≤ 100. The CouponService later caps the discount
    // at subtotal (Decimal.min), so > 100 silently behaves like 100 — but the
    // admin sees a confusing "1500% off" preview without this guard.
    if (data.type === "PERCENT" && Number(data.value) > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "PERCENT value must be ≤ 100",
      });
    }
    // Date sanity. Without this an off-by-typing endsAt < startsAt creates a
    // coupon that's always expired AND not-yet-started, so validate() always
    // refuses it with no obvious cause.
    if (data.startsAt && data.endsAt) {
      const s = new Date(data.startsAt);
      const e = new Date(data.endsAt);
      if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && s >= e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endsAt"],
          message: "Ends-at must be after starts-at",
        });
      }
    }
  });

export type CouponInput = z.infer<typeof couponInputSchema>;
type Result = { ok: false; error: string };

function toDate(v: string | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createCouponAction(raw: unknown): Promise<Result | void> {
  await requireAdmin();
  const parsed = couponInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  const i = parsed.data;
  let createdId: string;
  try {
    const created = await prisma.coupon.create({
      data: {
        code: i.code.toUpperCase(),
        type: i.type,
        value: new Prisma.Decimal(i.value),
        minSubtotal: i.minSubtotal ? new Prisma.Decimal(i.minSubtotal) : null,
        startsAt: toDate(i.startsAt),
        endsAt: toDate(i.endsAt),
        usageLimit: i.usageLimit ?? null,
        isActive: i.isActive,
      },
    });
    createdId = created.id;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "CREATE_FAILED" };
  }
  revalidatePath("/admin/coupons");
  redirect(`/admin/coupons/${createdId}`);
}

export async function updateCouponAction(raw: unknown & { id: string }): Promise<Result | void> {
  await requireAdmin();
  if (!raw || typeof raw !== "object" || !("id" in raw)) return { ok: false, error: "MISSING_ID" };
  const id = (raw as { id: string }).id;
  const parsed = couponInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  const i = parsed.data;
  try {
    await prisma.coupon.update({
      where: { id },
      data: {
        code: i.code.toUpperCase(),
        type: i.type,
        value: new Prisma.Decimal(i.value),
        minSubtotal: i.minSubtotal ? new Prisma.Decimal(i.minSubtotal) : null,
        startsAt: toDate(i.startsAt),
        endsAt: toDate(i.endsAt),
        usageLimit: i.usageLimit ?? null,
        isActive: i.isActive,
      },
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "UPDATE_FAILED" };
  }
  revalidatePath("/admin/coupons");
  revalidatePath(`/admin/coupons/${id}`);
}

export async function deleteCouponAction(raw: unknown): Promise<Result | void> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  try {
    await prisma.coupon.delete({ where: { id: parsed.data.id } });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "DELETE_FAILED" };
  }
  revalidatePath("/admin/coupons");
}
