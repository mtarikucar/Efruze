import { Prisma, type PaymentMethod } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { getPaymentProvider } from "@/server/payments/registry";
import type { PaymentInitiateResult } from "@/server/payments/provider";
import type { AppLocale } from "@/i18n/routing";
import { env } from "@/lib/env";

export const PaymentService = {
  /**
   * Initiate payment for an existing order. Returns the provider result and
   * persists the reference + status snapshot on the Payment row.
   */
  async initiate(args: {
    orderId: string;
    method: PaymentMethod;
    locale: AppLocale;
    userIp?: string;
  }): Promise<PaymentInitiateResult> {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: args.orderId },
    });

    const provider = getPaymentProvider(args.method);
    const result = await provider.initiate({
      order,
      locale: args.locale,
      returnUrl: `${env.NEXT_PUBLIC_SITE_URL}/orders/${order.orderNumber}/thanks`,
      userIp: args.userIp,
    });

    // Persist the redirect payload (iframe token for PayTR) so the iframe page
    // can render without re-calling get-token. retryInitiate() refreshes on demand.
    const providerPayload: Prisma.InputJsonValue | undefined = result.redirect
      ? ({ redirect: result.redirect, issuedAt: new Date().toISOString() } as Prisma.InputJsonValue)
      : undefined;

    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        reference: result.reference,
        status: result.status,
        ...(providerPayload ? { providerPayload } : {}),
      },
    });

    return result;
  },

  /**
   * Re-issue a fresh provider redirect (e.g., a new PayTR iframe token) for an
   * existing Payment row. Used when the saved token expires and the customer
   * clicks "Retry payment" on the iframe page.
   */
  async retryInitiate(args: {
    paymentReference: string;
    locale: AppLocale;
    userIp?: string;
  }): Promise<PaymentInitiateResult | null> {
    const payment = await prisma.payment.findFirst({
      where: { reference: args.paymentReference },
      include: { order: true },
    });
    if (!payment || !payment.order) return null;
    if (payment.status === "SUCCEEDED") return null;

    return this.initiate({
      orderId: payment.order.id,
      method: payment.method,
      locale: args.locale,
      userIp: args.userIp,
    });
  },
};
