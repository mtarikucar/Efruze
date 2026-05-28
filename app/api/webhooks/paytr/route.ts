import { NextResponse } from "next/server";
import Decimal from "decimal.js";
import { prisma } from "@/server/db/client";
import { getPaymentProvider } from "@/server/payments/registry";
import { EmailService } from "@/server/services/email.service";
import { OrderService } from "@/server/services/order.service";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PayTR posts form-encoded data on payment status change. We verify HMAC,
 * idempotently update Payment + Order, send the confirmation email on
 * success, and respond with literal "OK" (PayTR retries for ~24h otherwise).
 */
export async function POST(req: Request) {
  const rawBody = await req.text();

  const provider = getPaymentProvider("PAYTR");
  let verified;
  try {
    verified = await provider.verifyWebhook(rawBody, req.headers);
  } catch (err) {
    console.error("[paytr-webhook] verifyWebhook threw", err);
    return new NextResponse("OK", { status: 200 }); // still 200 — don't tell PayTR to retry
  }

  if (!verified.ok) {
    console.warn("[paytr-webhook] rejected:", verified.reason);
    // PayTR docs say to return "PAYTR notification failed: <reason>" on rejection.
    // We respond non-OK so a security-relevant retry surfaces in logs.
    return new NextResponse(`PAYTR notification failed: ${verified.reason}`, {
      status: 200,
    });
  }

  const payment = await prisma.payment.findFirst({
    where: { reference: verified.reference },
    include: { order: true },
  });

  if (!payment || !payment.order) {
    console.warn("[paytr-webhook] no Payment for reference", verified.reference);
    // Return OK so PayTR doesn't keep retrying for an order we don't recognise.
    return new NextResponse("OK", { status: 200 });
  }

  // Idempotency — already settled? Just acknowledge.
  if (payment.status === "SUCCEEDED" || payment.status === "FAILED") {
    return new NextResponse("OK", { status: 200 });
  }

  // Reconciliation guard: PayTR's HMAC proves *they* sent total_amount, but it
  // doesn't prove total_amount matches what we charged. If they disagree (bug,
  // tampering upstream of HMAC, replay aimed at a different order), refuse to
  // mark PAID and flag for manual reconciliation — the human can settle it
  // from the admin orders view.
  if (
    verified.status === "SUCCEEDED" &&
    verified.amount !== undefined &&
    !new Decimal(payment.amount.toString()).equals(verified.amount)
  ) {
    console.error("[paytr-webhook] amount mismatch — refusing to mark PAID", {
      orderNumber: payment.order.orderNumber,
      expected: payment.amount.toString(),
      received: verified.amount.toString(),
    });
    // Respond non-OK so the mismatch surfaces in PayTR's retry log and ours.
    return new NextResponse("PAYTR notification failed: amount mismatch", {
      status: 200,
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (verified.status === "SUCCEEDED") {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCEEDED", paidAt: new Date() },
        });
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "PAID" },
        });
      } else {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
        // Restore variant stock that was decremented at order-creation time.
        // Gated by stockRestored so duplicate webhook deliveries are safe.
        const orderRow = await tx.order.findUniqueOrThrow({
          where: { id: payment.orderId },
          include: { items: { select: { variantId: true, quantity: true } } },
        });
        if (!orderRow.stockRestored) {
          for (const item of orderRow.items) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: "CANCELLED", stockRestored: true },
          });
        } else {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: "CANCELLED" },
          });
        }
      }
    });
  } catch (err) {
    console.error("[paytr-webhook] update failed", err);
    // Return OK so PayTR doesn't loop on our DB issue — alert via logs instead.
    return new NextResponse("OK", { status: 200 });
  }

  // On success, fire the confirmation email (fail-soft).
  if (verified.status === "SUCCEEDED") {
    try {
      const dto = await OrderService.getByOrderNumber(
        payment.order.orderNumber,
        "tr" as AppLocale,
      );
      if (dto) await EmailService.orderConfirmed(dto);
    } catch (err) {
      console.error("[paytr-webhook] email failed (non-fatal)", err);
    }
  }

  // PayTR requires the literal string "OK" with no whitespace.
  return new NextResponse("OK", { status: 200 });
}
