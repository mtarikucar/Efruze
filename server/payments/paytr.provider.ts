import { createHmac, timingSafeEqual } from "crypto";
import { Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { prisma } from "@/server/db/client";
import { env } from "@/lib/env";
import type {
  PaymentInitiateInput,
  PaymentInitiateResult,
  PaymentProvider,
  RefundResult,
  WebhookVerifyResult,
} from "./provider";

const PAYTR_GET_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

/**
 * PayTR's `merchant_oid` must be alphanumeric only — no dashes. Our order
 * numbers look like `EFR-2026-XXXXXX`, so strip the hyphens for PayTR while
 * keeping the human-readable form on emails / the success page.
 */
function toMerchantOid(orderNumber: string): string {
  return orderNumber.replace(/-/g, "");
}

/** Convert a Prisma Decimal/string amount in TRY to the PayTR integer kuruş form. */
function toKurus(amount: Prisma.Decimal | string | number): number {
  const d = new Decimal(typeof amount === "object" ? amount.toString() : amount);
  return d.times(100).round().toNumber();
}

/**
 * Build the base64-encoded user_basket field. PayTR expects an array of
 * [name, unit_price (string in TL), quantity] tuples.
 */
async function buildUserBasket(orderId: string): Promise<string> {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const basket = items.map((it) => [
    it.nameSnapshot.slice(0, 60),
    new Decimal(it.unitPrice.toString()).toFixed(2),
    it.quantity,
  ]);
  return Buffer.from(JSON.stringify(basket)).toString("base64");
}

/**
 * Resolve the client IP from PaymentInitiateInput.userIp; fall back to loopback.
 * The action layer reads x-forwarded-for and passes through.
 */
function resolveIp(userIp: string | undefined): string {
  if (!userIp) return "127.0.0.1";
  // x-forwarded-for can be a comma-separated chain; take the first (client) hop.
  const first = userIp.split(",")[0]?.trim();
  return first || "127.0.0.1";
}

type PayTRTokenResponse = {
  status: "success" | "failed";
  token?: string;
  reason?: string;
};

export class PayTRProvider implements PaymentProvider {
  readonly method = "PAYTR" as const;

  private requireConfig() {
    if (!env.PAYTR_MERCHANT_ID || !env.PAYTR_MERCHANT_KEY || !env.PAYTR_MERCHANT_SALT) {
      throw new Error("PayTR is not configured — set PAYTR_MERCHANT_ID/KEY/SALT");
    }
    return {
      merchant_id: env.PAYTR_MERCHANT_ID,
      merchant_key: env.PAYTR_MERCHANT_KEY,
      merchant_salt: env.PAYTR_MERCHANT_SALT,
      // Default to sandbox unless explicitly set to "0" — safer footgun behavior.
      test_mode: env.PAYTR_TEST_MODE === "0" ? "0" : "1",
    };
  }

  async initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult> {
    const cfg = this.requireConfig();
    const merchant_oid = toMerchantOid(input.order.orderNumber);
    const payment_amount = toKurus(input.order.total);
    const user_basket = await buildUserBasket(input.order.id);
    const user_ip = resolveIp(input.userIp);
    const email = input.order.email;
    const no_installment = "0";
    const max_installment = "0";
    const currency = "TL"; // PayTR uses "TL" not "TRY"

    // Hash string: ORDER MATTERS exactly.
    const hashStr =
      cfg.merchant_id +
      user_ip +
      merchant_oid +
      email +
      payment_amount +
      user_basket +
      no_installment +
      max_installment +
      currency +
      cfg.test_mode;

    const paytr_token = createHmac("sha256", cfg.merchant_key)
      .update(hashStr + cfg.merchant_salt)
      .digest("base64");

    // Pull shipping address for name/phone (best-effort).
    const shipping = input.order.shippingAddressId
      ? await prisma.address.findUnique({ where: { id: input.order.shippingAddressId } })
      : null;

    const body = new URLSearchParams({
      merchant_id: cfg.merchant_id,
      user_ip,
      merchant_oid,
      email,
      payment_amount: String(payment_amount),
      paytr_token,
      user_basket,
      debug_on: cfg.test_mode === "1" ? "1" : "0",
      no_installment,
      max_installment,
      user_name: shipping?.fullName ?? email,
      user_address: shipping
        ? `${shipping.line1} ${shipping.city}`
        : "—",
      user_phone: shipping?.phone ?? "—",
      merchant_ok_url: `${input.returnUrl}?paytr=ok`,
      merchant_fail_url: `${input.returnUrl}?paytr=fail`,
      timeout_limit: "30",
      currency,
      test_mode: cfg.test_mode,
      lang: input.locale === "tr" ? "tr" : "en",
    });

    const res = await fetch(PAYTR_GET_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    let payload: PayTRTokenResponse;
    try {
      payload = (await res.json()) as PayTRTokenResponse;
    } catch {
      throw new Error("PayTR returned a non-JSON response");
    }

    if (payload.status !== "success" || !payload.token) {
      throw new Error(`PayTR token request failed: ${payload.reason ?? "unknown"}`);
    }

    return {
      method: this.method,
      status: "VERIFYING",
      reference: merchant_oid,
      redirect: { type: "iframe-token", value: payload.token },
    };
  }

  async verifyWebhook(rawBody: string): Promise<WebhookVerifyResult> {
    const cfg = this.requireConfig();
    const params = new URLSearchParams(rawBody);
    const merchant_oid = params.get("merchant_oid") ?? "";
    const status = params.get("status") ?? "";
    const total_amount = params.get("total_amount") ?? "";
    const receivedHash = params.get("hash") ?? "";

    if (!merchant_oid || !status || !total_amount || !receivedHash) {
      return { ok: false, reason: "Missing required webhook fields" };
    }

    const hashStr = merchant_oid + cfg.merchant_salt + status + total_amount;
    const expected = createHmac("sha256", cfg.merchant_key)
      .update(hashStr)
      .digest("base64");

    let valid = false;
    try {
      const a = Buffer.from(expected);
      const b = Buffer.from(receivedHash);
      valid = a.length === b.length && timingSafeEqual(a, b);
    } catch {
      valid = false;
    }
    if (!valid) return { ok: false, reason: "HMAC mismatch" };

    return {
      ok: true,
      reference: merchant_oid,
      status: status === "success" ? "SUCCEEDED" : "FAILED",
      amount: new Decimal(Number(total_amount) / 100),
    };
  }

  async refund(): Promise<RefundResult> {
    return { ok: false, reason: "PayTR refunds ship in M8" };
  }
}
