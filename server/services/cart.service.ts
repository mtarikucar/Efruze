import Decimal from "decimal.js";
import { randomBytes } from "crypto";
import {
  findCartByToken,
  createCart,
  upsertCartItem,
  updateCartItemQty as dbUpdateQty,
  deleteCartItem,
  type CartRow,
} from "@/server/db/carts";
import { prisma } from "@/server/db/client";
import type { CartDTO, CartLineDTO } from "@/server/types/cart";
import type { AppLocale } from "@/i18n/routing";

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

function pickName<T extends { locale: string; name: string }>(rows: T[], locale: AppLocale): string {
  return (
    rows.find((r) => r.locale === locale)?.name ??
    rows.find((r) => r.locale === "tr")?.name ??
    rows[0]?.name ??
    "—"
  );
}

function toCartDTO(row: CartRow, locale: AppLocale, shippingCost = new Decimal(0)): CartDTO {
  const lines: CartLineDTO[] = row.items.map((it) => {
    const unit = new Decimal(it.unitPrice.toString());
    const lineTotal = unit.times(it.quantity);
    return {
      id: it.id,
      productId: it.productId,
      variantId: it.variantId,
      slug: it.product.slug,
      name: pickName(it.product.translations, locale),
      imageUrl: it.product.images[0]?.url ?? "/ebru-detail.png",
      quantity: it.quantity,
      unitPrice: unit.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
      variantLabel: null,
    };
  });

  const subtotal = lines.reduce((acc, l) => acc.plus(new Decimal(l.lineTotal)), new Decimal(0));
  const total = subtotal.plus(shippingCost);

  return {
    token: row.token,
    items: lines,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: subtotal.toFixed(2),
    shippingCost: shippingCost.toFixed(2),
    total: total.toFixed(2),
    currency: row.currency,
  };
}

function emptyDTO(): CartDTO {
  return {
    token: "",
    items: [],
    itemCount: 0,
    subtotal: "0.00",
    shippingCost: "0.00",
    total: "0.00",
    currency: "TRY",
  };
}

async function mergeAnonymousIntoUser(anonToken: string, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const anon = await tx.cart.findUnique({
      where: { token: anonToken },
      include: { items: true },
    });
    if (!anon || anon.items.length === 0) {
      // Nothing to merge — but if the anon row exists with no items, just bind it.
      if (anon && !anon.userId) {
        await tx.cart.update({ where: { id: anon.id }, data: { userId } });
      }
      return;
    }

    // Find or create the user's "primary" cart (most recently updated).
    let userCart = await tx.cart.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    if (!userCart) {
      // Reassign the anonymous cart to the user — simplest path.
      await tx.cart.update({ where: { id: anon.id }, data: { userId } });
      return;
    }
    if (userCart.id === anon.id) return; // same cart already

    for (const it of anon.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: it.variantId },
      });
      const cap = variant?.stock ?? it.quantity;
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: userCart.id, variantId: it.variantId } },
      });
      if (existing) {
        const next = Math.min(existing.quantity + it.quantity, cap);
        if (next > existing.quantity) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: next },
          });
        }
      } else {
        const qty = Math.min(it.quantity, cap);
        if (qty > 0) {
          await tx.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: it.productId,
              variantId: it.variantId,
              quantity: qty,
              unitPrice: it.unitPrice,
            },
          });
        }
      }
    }

    // Drop the anonymous cart row + its items.
    await tx.cartItem.deleteMany({ where: { cartId: anon.id } });
    await tx.cart.delete({ where: { id: anon.id } });
  });
}

export const CartService = {
  newToken,
  emptyDTO,
  merge: mergeAnonymousIntoUser,

  /**
   * Read-only fetch. Returns the cart for a known token without ever creating
   * a row. Use this in layouts/RSC paths; use getOrCreate from server actions
   * that intend to mutate the cart.
   */
  async getDTO(token: string | null, locale: AppLocale): Promise<CartDTO> {
    if (!token) return emptyDTO();
    const row = await findCartByToken(token);
    if (!row) return emptyDTO();
    return toCartDTO(row, locale);
  },

  async getOrCreate(token: string | null): Promise<{ row: CartRow; created: boolean }> {
    if (token) {
      const existing = await findCartByToken(token);
      if (existing) return { row: existing, created: false };
    }
    const nt = token ?? newToken();
    const created = await createCart(nt);
    return { row: created, created: true };
  },

  toDTO(row: CartRow, locale: AppLocale, shippingCost = new Decimal(0)): CartDTO {
    return toCartDTO(row, locale, shippingCost);
  },

  async addItem(token: string, productId: string, variantId: string | undefined, quantity: number) {
    const { row } = await this.getOrCreate(token);

    // Resolve variant — fall back to product's default variant.
    const variant = variantId
      ? await prisma.productVariant.findUnique({ where: { id: variantId } })
      : await prisma.productVariant.findFirst({
          where: { productId, isDefault: true },
        });
    if (!variant) throw new Error("Variant not found");
    if (variant.productId !== productId) throw new Error("Variant/product mismatch");

    const product = await prisma.product.findFirst({
      where: { id: productId, isPublished: true },
      select: { basePrice: true },
    });
    if (!product) throw new Error("Product not found");

    // Stock check (read-time)
    const existing = row.items.find((i) => i.variantId === variant.id);
    const inCart = existing?.quantity ?? 0;
    if (inCart + quantity > variant.stock) {
      throw new Error(`STOCK_EXCEEDED:${variant.stock - inCart}`);
    }

    const unitPrice = variant.priceOverride ?? product.basePrice;
    await upsertCartItem({
      cartId: row.id,
      productId,
      variantId: variant.id,
      quantity,
      unitPrice: unitPrice as unknown as string,
    });
  },

  /**
   * Mutate or remove a cart line only when the caller's cart_token matches the
   * cart that owns it. Without this guard, knowing a CartItem.id (visible in
   * client logs or DOM data-* attributes) would let an attacker change or delete
   * line items in someone else's session — classic IDOR.
   */
  async updateQty(token: string, itemId: string, quantity: number) {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      select: { variantId: true, cart: { select: { token: true } } },
    });
    if (!item || item.cart.token !== token) {
      throw new Error("Cart item not found");
    }

    // Stock guard — mirror addItem: a manual qty bump must not exceed available
    // stock. Skip for quantity <= 0 (that path deletes the line in dbUpdateQty).
    if (quantity > 0) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stock: true },
      });
      if (!variant) throw new Error("Variant not found");
      if (quantity > variant.stock) {
        throw new Error(`STOCK_EXCEEDED:${variant.stock}`);
      }
    }

    await dbUpdateQty(itemId, quantity);
  },

  async removeItem(token: string, itemId: string) {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      select: { cart: { select: { token: true } } },
    });
    if (!item || item.cart.token !== token) {
      throw new Error("Cart item not found");
    }
    await deleteCartItem(itemId);
  },
};
