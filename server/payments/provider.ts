import type { Decimal } from "decimal.js";
import type { Order, PaymentMethod, PaymentStatus } from "@prisma/client";
import type { BankTransferInstructionsDTO } from "@/server/types/order";

export type PaymentInitiateInput = {
  order: Order;
  locale: "tr" | "en";
  returnUrl: string;
  /** Real client IP (from x-forwarded-for / x-real-ip). PayTR requires this. */
  userIp?: string;
};

export type PaymentInitiateResult = {
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  /** Set for online providers (Stripe URL, PayTR iframe token). */
  redirect?: { type: "url"; value: string } | { type: "iframe-token"; value: string };
  /** Set for offline (bank-transfer) providers. */
  instructions?: BankTransferInstructionsDTO;
};

export type WebhookVerifyResult =
  | { ok: true; reference: string; status: PaymentStatus; amount?: Decimal }
  | { ok: false; reason: string };

export type RefundResult =
  | { ok: true; refundedAmount: string }
  | { ok: false; reason: string };

export interface PaymentProvider {
  readonly method: PaymentMethod;

  initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult>;

  /** Throws if the provider doesn't support webhooks (bank transfer). */
  verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookVerifyResult>;

  /** Throws if not implemented. M2 ships without refunds; M6 adds them. */
  refund(paymentId: string, amount?: Decimal): Promise<RefundResult>;
}
