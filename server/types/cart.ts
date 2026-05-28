import { z } from "zod";

export const addToCartInput = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(), // omit = default variant
  quantity: z.coerce.number().int().min(1).max(20).default(1),
});

export const updateQtyInput = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(20),
});

export const removeItemInput = z.object({
  itemId: z.string().min(1),
});

export const newsletterInput = z.object({
  email: z.string().email(),
});

export type AddToCartInput = z.infer<typeof addToCartInput>;
export type UpdateQtyInput = z.infer<typeof updateQtyInput>;
export type RemoveItemInput = z.infer<typeof removeItemInput>;
export type NewsletterInput = z.infer<typeof newsletterInput>;

export type CartLineDTO = {
  id: string;
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  imageUrl: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  variantLabel: string | null;
};

export type CartDTO = {
  token: string;
  items: CartLineDTO[];
  itemCount: number;
  subtotal: string;
  shippingCost: string;
  total: string;
  currency: string;
};
