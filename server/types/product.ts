import { z } from "zod";

/**
 * Product DTO — what the UI sees. Prisma Decimals serialized to string,
 * translations pre-resolved to a single locale, dates as ISO strings.
 */
export type ProductDTO = {
  id: string;
  slug: string;
  sku: string;
  basePrice: string; // Decimal.toString() — formatted at render time
  currency: string;
  editionTotal: number | null;
  editionNumber: number | null;
  isFeatured: boolean;
  // resolved from ProductTranslation
  name: string;
  tagline: string | null;
  description: string | null;
  materials: string | null;
  // resolved from primary ProductImage
  imageUrl: string;
  imageAlt: string;
  // optional badge text for cards ("New · 1 of 12", "Pair", "Atelier"…)
  badge: string | null;
  // category info for the eyebrow line
  category: {
    slug: string;
    name: string;
  };
  variants: VariantDTO[];
  hasModel3D: boolean;
};

export type VariantDTO = {
  id: string;
  sku: string;
  price: string; // override OR base, resolved
  stock: number;
  attributes: Record<string, unknown>;
  isDefault: boolean;
};

export type ProductDetailDTO = ProductDTO & {
  images: Array<{ id: string; url: string; alt: string | null }>;
  model3d: { glbUrl: string; usdzUrl: string | null; posterUrl: string | null } | null;
};

export const productListParams = z.object({
  category: z.string().optional(),
  q: z.string().max(120).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "priceAsc", "priceDesc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(60).default(24),
  locale: z.enum(["tr"]).default("tr"),
});

export type ProductListParams = z.infer<typeof productListParams>;
