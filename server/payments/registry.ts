import type { PaymentMethod } from "@prisma/client";
import type { PaymentProvider } from "./provider";
import { BankTransferProvider } from "./bank-transfer.provider";
import { PayTRProvider } from "./paytr.provider";
import { env } from "@/lib/env";

const providers: Record<PaymentMethod, () => PaymentProvider> = {
  BANK_TRANSFER: () => new BankTransferProvider(),
  PAYTR: () => new PayTRProvider(),
};

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  const factory = providers[method];
  if (!factory) throw new Error(`Unknown payment method: ${method}`);
  return factory();
}

/**
 * Payment methods that are actually enabled in this environment. Bank transfer
 * is always on; PayTR only when the three required env vars are set.
 */
export function enabledPaymentMethods(): PaymentMethod[] {
  const methods: PaymentMethod[] = ["BANK_TRANSFER"];
  if (env.PAYTR_MERCHANT_ID && env.PAYTR_MERCHANT_KEY && env.PAYTR_MERCHANT_SALT) {
    methods.push("PAYTR");
  }
  return methods;
}

/** True when PayTR can be used right now (all env vars present). */
export function isPayTREnabled(): boolean {
  return enabledPaymentMethods().includes("PAYTR");
}
