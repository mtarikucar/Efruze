import { prisma } from "./client";
import type { Prisma } from "@prisma/client";

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          basePrice: true,
          translations: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, alt: true },
          },
        },
      },
      variant: { select: { id: true, attributes: true, stock: true, sku: true } },
    },
  },
  coupon: true,
} satisfies Prisma.CartInclude;

export type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export async function findCartByToken(token: string): Promise<CartRow | null> {
  return prisma.cart.findUnique({ where: { token }, include: cartInclude });
}

export async function createCart(token: string, userId: string | null = null): Promise<CartRow> {
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  return prisma.cart.create({
    data: { token, userId, currency: "TRY", expiresAt },
    include: cartInclude,
  });
}

export async function upsertCartItem(args: {
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: Prisma.Decimal | string;
}): Promise<void> {
  const { cartId, productId, variantId, quantity, unitPrice } = args;
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, productId, variantId, quantity, unitPrice: unitPrice as Prisma.Decimal },
    update: { quantity: { increment: quantity } },
  });
}

export async function updateCartItemQty(itemId: string, quantity: number): Promise<void> {
  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return;
  }
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
}

export async function deleteCartItem(itemId: string): Promise<void> {
  await prisma.cartItem.delete({ where: { id: itemId } });
}
