import { randomBytes } from "crypto";
import { prisma } from "@/server/db/client";
import type {
  PaymentInitiateInput,
  PaymentInitiateResult,
  PaymentProvider,
  RefundResult,
  WebhookVerifyResult,
} from "./provider";

// Crockford base32: removes I, L, O, U to avoid ambiguity.
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function generateReference(orderNumber: string): string {
  // 4 distinct random bytes → one bytes-per-char. Previously this used 3 bytes
  // with `i % bytes.length`, so the 4th char was a deterministic function of
  // the 1st (entropy 32^3 ≈ 32k, plus a visible repeating pattern).
  const bytes = randomBytes(4);
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += CROCKFORD[bytes[i] % CROCKFORD.length];
  }
  return `${orderNumber}-${suffix}`;
}

export class BankTransferProvider implements PaymentProvider {
  readonly method = "BANK_TRANSFER" as const;
  readonly deadlineHours = 72;

  async initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult> {
    const reference = generateReference(input.order.orderNumber);

    const accounts = await prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return {
      method: this.method,
      status: "AWAITING_TRANSFER",
      reference,
      instructions: {
        reference,
        amount: input.order.total.toString(),
        currency: input.order.currency,
        deadlineHours: this.deadlineHours,
        accounts: accounts.map((a) => ({
          bankName: a.bankName,
          accountHolder: a.accountHolder,
          iban: a.iban,
          swift: a.swift,
        })),
      },
    };
  }

  async verifyWebhook(): Promise<WebhookVerifyResult> {
    throw new Error("BANK_TRANSFER has no webhook — admin confirms manually");
  }

  async refund(): Promise<RefundResult> {
    return { ok: false, reason: "Bank transfer refunds are handled out-of-band" };
  }
}
