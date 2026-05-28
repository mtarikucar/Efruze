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
