import {
  findFeaturedProducts,
  findManyProducts,
  countProducts,
  findProductBySlug,
  type ProductRow,
} from "@/server/db/products";
import type { ProductDTO, ProductDetailDTO, ProductListParams, VariantDTO } from "@/server/types/product";
import type { AppLocale } from "@/i18n/routing";

function pickTranslation<T extends { locale: string }>(
  rows: T[],
  locale: AppLocale,
  fallback: AppLocale = "tr",
): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === fallback) ?? rows[0];
}

function toVariantDTO(row: ProductRow["variants"][number], basePrice: string): VariantDTO {
  const price = row.priceOverride ? row.priceOverride.toString() : basePrice;
  return {
    id: row.id,
    sku: row.sku,
    price,
    stock: row.stock,
    attributes: (row.attributes as Record<string, unknown>) ?? {},
    isDefault: row.isDefault,
  };
}

function toProductDTO(row: ProductRow, locale: AppLocale): ProductDTO {
  const translation = pickTranslation(row.translations, locale);
  const catTranslation = pickTranslation(row.category.translations, locale);
  const primary = row.images[0];

  const basePrice = row.basePrice.toString();

  // Editorial badge — derived from edition data
  let badge: string | null = null;
  if (row.editionTotal != null && row.editionNumber != null) {
    badge = `1 of ${row.editionTotal}`;
  } else if (row.editionTotal != null) {
    badge = `Edition / ${row.editionTotal}`;
  }

  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    basePrice,
    currency: row.currency,
    editionTotal: row.editionTotal,
    editionNumber: row.editionNumber,
    isFeatured: row.isFeatured,
    name: translation?.name ?? row.slug,
    tagline: translation?.tagline ?? null,
    description: translation?.description ?? null,
    materials: translation?.materials ?? null,
    imageUrl: primary?.url ?? "/ebru-detail.png",
    imageAlt: primary?.alt ?? translation?.name ?? "",
    badge,
    category: {
      slug: row.category.slug,
      name: catTranslation?.name ?? row.category.slug,
    },
    variants: row.variants.map((v) => toVariantDTO(v, basePrice)),
    hasModel3D: row.models3d.length > 0,
  };
}

function toProductDetailDTO(row: ProductRow, locale: AppLocale): ProductDetailDTO {
  const base = toProductDTO(row, locale);
  const m3d = row.models3d[0];
  return {
    ...base,
    images: row.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? null })),
    model3d: m3d ? { glbUrl: m3d.glbUrl, usdzUrl: m3d.usdzUrl, posterUrl: m3d.posterUrl } : null,
  };
}

export const ProductService = {
  async getFeatured(locale: AppLocale, take = 6): Promise<ProductDTO[]> {
    const rows = await findFeaturedProducts(take);
    return rows.map((r) => toProductDTO(r, locale));
  },

  async list(params: ProductListParams): Promise<{
    items: ProductDTO[];
    total: number;
    page: number;
    perPage: number;
  }> {
    type W = NonNullable<Parameters<typeof findManyProducts>[0]["where"]>;
    const where: W = {};

    if (params.category) where.category = { slug: params.category };

    if (params.q && params.q.trim().length >= 2) {
      const q = params.q.trim();
      // Locale-scoped ILIKE on name + description. Postgres mode: 'insensitive'
      // gives us case-insensitive contains; Turkish/diacritic-insensitivity is
      // M8 polish via a tsvector + unaccent extension.
      where.translations = {
        some: {
          locale: params.locale,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
      };
    }

    if (params.priceMin != null || params.priceMax != null) {
      where.basePrice = {};
      if (params.priceMin != null) where.basePrice.gte = params.priceMin;
      if (params.priceMax != null) where.basePrice.lte = params.priceMax;
    }

    if (params.inStock) {
      where.variants = { some: { stock: { gt: 0 } } };
    }

    const orderBy = (() => {
      switch (params.sort) {
        case "priceAsc":
          return [{ basePrice: "asc" as const }];
        case "priceDesc":
          return [{ basePrice: "desc" as const }];
        case "newest":
        default:
          return [{ sortOrder: "asc" as const }, { createdAt: "desc" as const }];
      }
    })();

    const [rows, total] = await Promise.all([
      findManyProducts({
        where,
        orderBy,
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
      }),
      countProducts(where),
    ]);
    return {
      items: rows.map((r) => toProductDTO(r, params.locale)),
      total,
      page: params.page,
      perPage: params.perPage,
    };
  },

  async getBySlug(slug: string, locale: AppLocale): Promise<ProductDetailDTO | null> {
    const row = await findProductBySlug(slug);
    if (!row) return null;
    return toProductDetailDTO(row, locale);
  },
};
