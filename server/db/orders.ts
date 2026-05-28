import { prisma } from "./client";
import type { Prisma } from "@prisma/client";

const orderInclude = {
  items: true,
  payment: true,
  shippingAddress: true,
  billingAddress: true,
} satisfies Prisma.OrderInclude;

export type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export async function findOrderByNumber(orderNumber: string): Promise<OrderRow | null> {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: orderInclude,
  });
}

/**
 * Guest lookup: orderNumber AND email must both match. Email compared
 * case-insensitively so "Ali@X.com" matches a stored "ali@x.com". Returns
 * null when either field is off — the caller surfaces a single generic
 * "not found / email mismatch" message so this can't be used to probe which
 * order numbers exist.
 */
export async function findOrderByNumberAndEmail(
  orderNumber: string,
  email: string,
): Promise<OrderRow | null> {
  return prisma.order.findFirst({
    where: {
      orderNumber,
      email: { equals: email, mode: "insensitive" },
    },
    include: orderInclude,
  });
}
