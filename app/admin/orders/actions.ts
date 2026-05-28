"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getLocale } from "next-intl/server";
import { requireAdmin } from "@/server/auth/guards";
import { OrderService } from "@/server/services/order.service";
import { EmailService } from "@/server/services/email.service";
import type { AppLocale } from "@/i18n/routing";

const idSchema = z.object({ orderId: z.string().min(1) });

const transitionSchema = z.object({
  orderId: z.string().min(1),
  next: z.enum(["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  trackingCarrier: z.string().max(80).optional().or(z.literal("")),
  trackingNumber: z.string().max(120).optional().or(z.literal("")),
});

const noteSchema = z.object({
  orderId: z.string().min(1),
  note: z.string().max(2000),
});

export async function confirmBankTransferAction(raw: unknown) {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" } as const;
  try {
    const locale = (await getLocale()) as AppLocale;
    const dto = await OrderService.confirmBankTransfer({
      orderId: parsed.data.orderId,
      adminId: session.user.id,
      locale,
    });
    if (dto) {
      await EmailService.orderConfirmed(dto).catch(() => undefined);
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FAILED" } as const;
  }
  revalidatePath("/admin/orders");
  revalidatePath("/admin/bank-transfers");
  revalidatePath("/admin");
  return { ok: true } as const;
}

export async function transitionOrderStatusAction(raw: unknown) {
  await requireAdmin();
  const parsed = transitionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" } as const;
  try {
    const locale = (await getLocale()) as AppLocale;
    const dto = await OrderService.transitionStatus({
      orderId: parsed.data.orderId,
      next: parsed.data.next,
      trackingCarrier: parsed.data.trackingCarrier || undefined,
      trackingNumber: parsed.data.trackingNumber || undefined,
      locale,
    });
    if (dto && parsed.data.next === "SHIPPED") {
      await EmailService.orderShipped({
        order: dto,
        trackingCarrier: parsed.data.trackingCarrier || undefined,
        trackingNumber: parsed.data.trackingNumber || undefined,
      }).catch(() => undefined);
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FAILED" } as const;
  }
  revalidatePath("/admin/orders");
  return { ok: true } as const;
}

export async function refundOrderAction(raw: unknown) {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" } as const;
  try {
    const locale = (await getLocale()) as AppLocale;
    const dto = await OrderService.refundOrder({
      orderId: parsed.data.orderId,
      adminId: session.user.id,
      locale,
    });
    if (dto) {
      await EmailService.orderRefunded(dto).catch(() => undefined);
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FAILED" } as const;
  }
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true } as const;
}

export async function setAdminNoteAction(raw: unknown) {
  await requireAdmin();
  const parsed = noteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" } as const;
  try {
    await OrderService.setAdminNote(parsed.data.orderId, parsed.data.note);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "FAILED" } as const;
  }
  revalidatePath("/admin/orders");
  return { ok: true } as const;
}
