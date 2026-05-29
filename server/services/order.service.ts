import Decimal from "decimal.js";
import { randomBytes } from "crypto";
import { OrderStatus, Prisma, type PaymentMethod, type PaymentStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { findOrderByNumber, findOrderByNumberAndEmail, type OrderRow } from "@/server/db/orders";
import { PaymentService } from "./payment.service";
import { CouponService } from "./coupon.service";
import type { AddressInput, CheckoutInput, OrderDTO, OrderLineDTO } from "@/server/types/order";
import type { AppLocale } from "@/i18n/routing";
import type { BankTransferInstructionsDTO } from "@/server/types/order";

// EFR-2026-NNNNNN — random base32 suffix avoids race conditions vs a counter.
const ORDER_BASE32 = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const bytes = randomBytes(6);
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += ORDER_BASE32[bytes[i] % ORDER_BASE32.length];
  return `EFR-${year}-${suffix}`;
}

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  email: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
  total: number;
  itemCount: number;
  placedAt: string;
};

function pickName<T extends { locale: string; name: string }>(rows: T[], locale: AppLocale): string {
  return (
    rows.find((r) => r.locale === locale)?.name ??
    rows.find((r) => r.locale === "tr")?.name ??
    rows[0]?.name ??
    "—"
  );
}

export const OrderService = {
  /**
   * Create an order from a cart token. Transactional: stock decrement, order
   * creation, items, payment row, and cart-item clear all succeed or roll back.
   * Returns the created order plus provider initiate result (bank instructions
   * for BANK_TRANSFER, redirect for online methods).
   */
  async createFromCart(args: {
    cartToken: string;
    locale: AppLocale;
    input: CheckoutInput;
    userId?: string | null;
    userIp?: string;
  }): Promise<{
    order: OrderRow;
    bankInstructions: BankTransferInstructionsDTO | null;
    redirect: { type: "url"; value: string } | { type: "iframe-token"; value: string } | null;
    paymentReference: string;
  }> {
    const cart = await prisma.cart.findUnique({
      where: { token: args.cartToken },
      include: {
        items: { include: { product: { include: { translations: true } }, variant: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("CART_EMPTY");
    }

    const settings = await prisma.storeSettings.findUnique({
      where: { id: "singleton" },
    });

    const subtotal = cart.items.reduce(
      (acc, it) => acc.plus(new Decimal(it.unitPrice.toString()).times(it.quantity)),
      new Decimal(0),
    );

    const flatRate = settings ? new Decimal(settings.shippingFlatRate.toString()) : new Decimal("80");
    const threshold = settings?.freeShippingThreshold
      ? new Decimal(settings.freeShippingThreshold.toString())
      : null;
    const shippingCost = threshold && subtotal.gte(threshold) ? new Decimal(0) : flatRate;

    // Re-validate the coupon at order time — UI eager-preview can drift if a
    // coupon was deactivated between apply and submit.
    let discountTotal = new Decimal(0);
    let couponRow: { id: string; code: string } | null = null;
    if (args.input.couponCode) {
      const v = await CouponService.validate(args.input.couponCode, subtotal);
      if (v.ok) {
        discountTotal = v.discount;
        couponRow = { id: v.coupon.id, code: v.coupon.code };
      }
    }

    const total = subtotal.plus(shippingCost).minus(discountTotal);

    const order = await prisma.$transaction(async (tx) => {
      // Stock check + decrement — atomic via conditional updateMany so two
      // concurrent checkouts can never both pass a stock=5/qty=3 race. If the
      // WHERE doesn't match (stock < qty or variant gone), `count` is 0 and we
      // abort the whole transaction.
      for (const it of cart.items) {
        const result = await tx.productVariant.updateMany({
          where: { id: it.variantId, stock: { gte: it.quantity } },
          data: { stock: { decrement: it.quantity } },
        });
        if (result.count === 0) {
          throw new Error(`STOCK_EXCEEDED:${it.product.slug}`);
        }
      }

      // Addresses — bound to the user when signed in so they appear in /account/addresses.
      const shipping = await tx.address.create({
        data: { ...toAddressData(args.input.shipping), type: "SHIPPING", userId: args.userId ?? null },
      });
      const billing = await tx.address.create({
        data: { ...toAddressData(args.input.billing), type: "BILLING", userId: args.userId ?? null },
      });

      // Order number — collision-free retry. Previously this generated once,
      // probed, then on collision generated a SECOND candidate without
      // re-probing — so two collisions in a row hit Order.create's unique
      // constraint and rolled back the entire checkout transaction (loss of
      // stock decrements, payment row, cart-clear, all redone).
      let orderNumber = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateOrderNumber();
        const existing = await tx.order.findUnique({ where: { orderNumber: candidate } });
        if (!existing) {
          orderNumber = candidate;
          break;
        }
      }
      if (!orderNumber) {
        // 5 collisions on a 30^6 = 729M space is astronomically unlikely;
        // if it happens, surface a real error rather than fall through to
        // Order.create with an empty string.
        throw new Error("ORDER_NUMBER_GENERATION_FAILED");
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: args.userId ?? null,
          email: args.input.email,
          status: args.input.paymentMethod === "BANK_TRANSFER" ? "AWAITING_PAYMENT" : "PENDING",
          currency: cart.currency,
          subtotal: subtotal.toFixed(2),
          shippingCost: shippingCost.toFixed(2),
          discountTotal: discountTotal.toFixed(2),
          total: total.toFixed(2),
          couponCode: couponRow?.code ?? null,
          shippingAddressId: shipping.id,
          billingAddressId: billing.id,
          customerNote: args.input.customerNote || null,
          items: {
            create: cart.items.map((it) => ({
              productId: it.productId,
              variantId: it.variantId,
              nameSnapshot: pickName(it.product.translations, args.locale),
              skuSnapshot: it.variant.sku,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              lineTotal: new Decimal(it.unitPrice.toString()).times(it.quantity).toFixed(2),
            })),
          },
          payment: {
            create: {
              method: args.input.paymentMethod,
              status: "PENDING",
              amount: total.toFixed(2),
              currency: cart.currency,
            },
          },
        },
        include: {
          items: true,
          payment: true,
          shippingAddress: true,
          billingAddress: true,
        },
      });

      // Bump the coupon's usedCount inside the same transaction so a
      // limited-use coupon respects its quota atomically. The conditional
      // WHERE makes the increment race-free vs concurrent checkouts: Prisma
      // can't express `usedCount < usageLimit` (field-to-field) through its
      // typed API, so use raw SQL — single UPDATE statement, race-free.
      if (couponRow) {
        const affected: number = await tx.$executeRaw`
          UPDATE "Coupon"
          SET "usedCount" = "usedCount" + 1
          WHERE id = ${couponRow.id}
            AND "isActive" = true
            AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
        `;
        if (affected === 0) {
          throw new Error("COUPON_USAGE_EXHAUSTED");
        }
      }

      // Clear cart items — keep the cart row + token so the user can shop again
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    // Initiate payment (outside the transaction — provider may make network calls)
    const initiateResult = await PaymentService.initiate({
      orderId: order.id,
      method: args.input.paymentMethod,
      locale: args.locale,
      userIp: args.userIp,
    });

    return {
      order,
      bankInstructions: initiateResult.instructions ?? null,
      redirect: initiateResult.redirect ?? null,
      paymentReference: initiateResult.reference,
    };
  },

  async getByOrderNumber(orderNumber: string, locale: AppLocale): Promise<OrderDTO | null> {
    const row = await findOrderByNumber(orderNumber);
    if (!row) return null;
    return toOrderDTO(row, locale);
  },

  /**
   * List orders for a customer. Matches by `userId` and additionally by
   * `email` so guest orders placed before signup surface in the account area.
   */
  async listForUser(args: {
    userId: string;
    email: string;
    locale: AppLocale;
  }): Promise<OrderDTO[]> {
    // Defensive: if caller passes an empty/missing email, drop the guest-order
    // branch entirely. Otherwise Prisma resolves `email: ""` (or undefined) as
    // "no constraint", which would match every guest order in the system.
    const whereOr: Prisma.OrderWhereInput[] = [{ userId: args.userId }];
    if (args.email) whereOr.push({ userId: null, email: args.email });

    const rows = await prisma.order.findMany({
      where: { OR: whereOr },
      orderBy: { placedAt: "desc" },
      include: {
        items: true,
        payment: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });
    return rows.map((r) => toOrderDTO(r, args.locale));
  },

  /**
   * Confirm a bank transfer payment — admin action. Atomically flips Payment
   * to SUCCEEDED and Order to PAID.
   */
  async confirmBankTransfer(args: {
    orderId: string;
    adminId: string;
    locale: AppLocale;
  }): Promise<OrderDTO | null> {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: args.orderId },
        include: { payment: true },
      });
      if (!order.payment) throw new Error("PAYMENT_MISSING");
      if (order.payment.method !== "BANK_TRANSFER") throw new Error("NOT_BANK_TRANSFER");
      if (order.payment.status === "SUCCEEDED") return; // idempotent
      await tx.payment.update({
        where: { id: order.payment.id },
        data: { status: "SUCCEEDED", paidAt: new Date() },
      });
      await tx.order.update({ where: { id: args.orderId }, data: { status: "PAID" } });
    });
    const refreshed = await prisma.order.findUnique({ where: { id: args.orderId } });
    if (!refreshed) return null;
    return this.getByOrderNumber(refreshed.orderNumber, args.locale);
  },

  /**
   * Manually mark an order PAID — admin escape hatch for orders stuck in
   * PENDING (e.g. an online payment whose provider callback never arrived but
   * the funds did land). Method-agnostic; idempotent if already PAID.
   */
  async markPaid(args: { orderId: string; locale: AppLocale }): Promise<OrderDTO | null> {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: args.orderId },
        include: { payment: true },
      });
      if (order.status === "PAID") return; // idempotent
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "SUCCEEDED", paidAt: new Date() },
        });
      }
      await tx.order.update({ where: { id: args.orderId }, data: { status: "PAID" } });
    });
    const refreshed = await prisma.order.findUnique({ where: { id: args.orderId } });
    if (!refreshed) return null;
    return this.getByOrderNumber(refreshed.orderNumber, args.locale);
  },

  /**
   * Admin status transition: PAID → PROCESSING → SHIPPED → DELIVERED, or
   * CANCELLED at any point. Pass tracking info when transitioning to SHIPPED.
   * On CANCELLED, atomically restores variant stock (gated by stockRestored
   * so retries are idempotent).
   */
  async transitionStatus(args: {
    orderId: string;
    next: "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    trackingCarrier?: string;
    trackingNumber?: string;
    locale: AppLocale;
  }): Promise<OrderDTO | null> {
    await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUniqueOrThrow({
        where: { id: args.orderId },
        include: { items: { select: { variantId: true, quantity: true } } },
      });

      await tx.order.update({
        where: { id: args.orderId },
        data: {
          status: args.next,
          trackingCarrier: args.trackingCarrier ?? undefined,
          trackingNumber: args.trackingNumber ?? undefined,
        },
      });

      // Stock restoration on cancel — only once per order.
      if (args.next === "CANCELLED" && !current.stockRestored) {
        for (const item of current.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.update({
          where: { id: args.orderId },
          data: { stockRestored: true },
        });
      }
    });

    const row = await prisma.order.findUnique({
      where: { id: args.orderId },
      include: { items: true, payment: true, shippingAddress: true, billingAddress: true },
    });
    return row ? toOrderDTO(row, args.locale) : null;
  },

  /**
   * Admin order listing with optional status filter, free-text search, and
   * pagination. `q` matches on orderNumber OR email (contains, case-insensitive).
   * Returns the page slice plus the total matching count so the UI can render
   * previous/next controls. Replaces the old hard-coded `take: 200` list.
   */
  async listForAdmin(args: {
    status?: string;
    q?: string;
    page?: number;
    perPage?: number;
  }): Promise<{ items: AdminOrderListItem[]; total: number; page: number; perPage: number }> {
    const perPage = args.perPage && args.perPage > 0 ? args.perPage : 30;
    const page = args.page && args.page > 0 ? args.page : 1;

    const where: Prisma.OrderWhereInput = {};
    if (args.status && args.status in OrderStatus) {
      where.status = args.status as OrderStatus;
    }
    const q = args.q?.trim();
    if (q) {
      where.OR = [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, rows] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { placedAt: "desc" },
        include: {
          items: { select: { quantity: true } },
          payment: { select: { method: true, status: true } },
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const items: AdminOrderListItem[] = rows.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      email: o.email,
      status: o.status,
      paymentMethod: o.payment?.method ?? null,
      paymentStatus: o.payment?.status ?? null,
      total: Number(o.total),
      itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
      placedAt: o.placedAt.toLocaleDateString("en-GB"),
    }));

    return { items, total, page, perPage };
  },

  /**
   * Refund an order — admin action. Transactional: flips Payment to REFUNDED,
   * Order to REFUNDED, and restores variant stock (gated by stockRestored so a
   * refund after a cancel — or a retried refund — never double-increments).
   * Idempotent: a no-op if the order is already REFUNDED.
   *
   * NOTE: the actual money movement (PayTR / bank reversal) is performed
   * manually via the provider's own panel — this record exists for accounting
   * and customer-facing status only. PayTR programmatic refunds are stubbed
   * (paytr.provider.ts refund() returns a not-implemented result).
   */
  async refundOrder(args: {
    orderId: string;
    adminId: string;
    locale: AppLocale;
  }): Promise<OrderDTO | null> {
    await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUniqueOrThrow({
        where: { id: args.orderId },
        include: {
          payment: true,
          items: { select: { variantId: true, quantity: true } },
        },
      });

      if (current.status === "REFUNDED") return; // idempotent

      if (current.payment) {
        await tx.payment.update({
          where: { id: current.payment.id },
          data: { status: "REFUNDED" },
        });
      }

      await tx.order.update({
        where: { id: args.orderId },
        data: { status: "REFUNDED" },
      });

      // Restore stock once — guard against a prior cancel having already done it.
      if (!current.stockRestored) {
        for (const item of current.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.update({
          where: { id: args.orderId },
          data: { stockRestored: true },
        });
      }
    });

    const row = await prisma.order.findUnique({
      where: { id: args.orderId },
      include: { items: true, payment: true, shippingAddress: true, billingAddress: true },
    });
    return row ? toOrderDTO(row, args.locale) : null;
  },

  async setAdminNote(orderId: string, note: string): Promise<void> {
    await prisma.order.update({ where: { id: orderId }, data: { adminNote: note } });
  },

  /**
   * Like getByOrderNumber, but eagerly populates bankInstructions when the
   * order's payment method is BANK_TRANSFER. Used by the order success page
   * and by the bank-transfer instruction email.
   */
  async getOrderForThanks(
    orderNumber: string,
    locale: AppLocale,
  ): Promise<OrderDTO | null> {
    const row = await findOrderByNumber(orderNumber);
    if (!row) return null;
    return withBankInstructions(toOrderDTO(row, locale), row);
  },

  /**
   * Guest order lookup by orderNumber + email. BOTH must match (email
   * case-insensitive) — knowing an order number alone is never enough, since
   * the order exposes PII (name, address, phone, basket). Returns null on any
   * mismatch so the caller can show one generic message and an attacker can't
   * tell a wrong email from a non-existent order number. Bank-transfer orders
   * get their instructions populated, matching the success page.
   */
  async lookupForGuest(
    orderNumber: string,
    email: string,
    locale: AppLocale,
  ): Promise<OrderDTO | null> {
    const row = await findOrderByNumberAndEmail(orderNumber, email);
    if (!row) return null;
    return withBankInstructions(toOrderDTO(row, locale), row);
  },
};

/**
 * Populate a DTO's bankInstructions from active BankAccount rows when the
 * order paid (or will pay) by bank transfer. Shared by the success page and
 * the guest lookup so both render the same panel.
 */
async function withBankInstructions(dto: OrderDTO, row: OrderRow): Promise<OrderDTO> {
  if (row.payment?.method === "BANK_TRANSFER" && row.payment.reference) {
    const accounts = await prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    dto.bankInstructions = {
      reference: row.payment.reference,
      amount: row.total.toString(),
      currency: row.currency,
      deadlineHours: 72,
      accounts: accounts.map((a) => ({
        bankName: a.bankName,
        accountHolder: a.accountHolder,
        iban: a.iban,
        swift: a.swift,
      })),
    };
  }
  return dto;
}

function toAddressData(a: AddressInput) {
  return {
    fullName: a.fullName,
    line1: a.line1,
    line2: a.line2 || null,
    city: a.city,
    district: a.district || null,
    postalCode: a.postalCode,
    country: a.country || "TR",
    phone: a.phone || null,
  };
}

function toAddressInput(
  a: { fullName: string; line1: string; line2: string | null; city: string; district: string | null; postalCode: string; country: string; phone: string | null } | null,
): AddressInput | null {
  if (!a) return null;
  return {
    fullName: a.fullName,
    line1: a.line1,
    line2: a.line2 ?? "",
    city: a.city,
    district: a.district ?? "",
    postalCode: a.postalCode,
    country: a.country,
    phone: a.phone ?? "",
  };
}

function toOrderDTO(row: OrderRow, _locale: AppLocale): OrderDTO {
  void _locale;
  const items: OrderLineDTO[] = row.items.map((it) => ({
    id: it.id,
    nameSnapshot: it.nameSnapshot,
    skuSnapshot: it.skuSnapshot,
    quantity: it.quantity,
    unitPrice: it.unitPrice.toString(),
    lineTotal: it.lineTotal.toString(),
  }));

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    email: row.email,
    subtotal: row.subtotal.toString(),
    shippingCost: row.shippingCost.toString(),
    discountTotal: row.discountTotal.toString(),
    total: row.total.toString(),
    currency: row.currency,
    items,
    shipping: toAddressInput(row.shippingAddress),
    billing: toAddressInput(row.billingAddress),
    paymentMethod: row.payment?.method ?? "BANK_TRANSFER",
    paymentStatus: row.payment?.status ?? "PENDING",
    paymentReference: row.payment?.reference ?? null,
    customerNote: row.customerNote ?? null,
    bankInstructions: null, // populated on the success page from BankAccount + reference
    placedAt: row.placedAt.toISOString(),
  };
}
