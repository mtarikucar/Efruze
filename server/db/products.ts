import { prisma } from "./client";
import type { Prisma } from "@prisma/client";

const productSelect = {
  id: true,
  slug: true,
  sku: true,
  basePrice: true,
  currency: true,
  editionTotal: true,
  editionNumber: true,
  isFeatured: true,
  sortOrder: true,
  category: { select: { id: true, slug: true, translations: true } },
  translations: true,
  variants: {
    select: {
      id: true,
      sku: true,
      priceOverride: true,
      stock: true,
      attributes: true,
      isDefault: true,
      sortOrder: true,
    },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
  },
  images: {
    select: { id: true, url: true, alt: true, isPrimary: true, sortOrder: true },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
  },
  models3d: { select: { id: true, glbUrl: true, usdzUrl: true, posterUrl: true } },
} satisfies Prisma.ProductSelect;

export type ProductRow = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

export async function findManyProducts(args: {
  where?: Prisma.ProductWhereInput;
  orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
  skip?: number;
  take?: number;
}): Promise<ProductRow[]> {
  return prisma.product.findMany({
    where: { isPublished: true, ...args.where },
    orderBy: args.orderBy ?? [{ sortOrder: "asc" }, { createdAt: "desc" }],
    skip: args.skip,
    take: args.take,
    select: productSelect,
  });
}

export async function countProducts(where?: Prisma.ProductWhereInput): Promise<number> {
  return prisma.product.count({ where: { isPublished: true, ...where } });
}

export async function findProductBySlug(slug: string): Promise<ProductRow | null> {
  return prisma.product.findFirst({
    where: { slug, isPublished: true },
    select: productSelect,
  });
}

export async function findFeaturedProducts(take = 6): Promise<ProductRow[]> {
  return prisma.product.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take,
    select: productSelect,
  });
}

export async function findRelatedProducts(args: {
  productId: string;
  categorySlug: string;
  take?: number;
}): Promise<ProductRow[]> {
  // Same category (matched by its stable slug), current product excluded.
  return prisma.product.findMany({
    where: {
      isPublished: true,
      category: { slug: args.categorySlug },
      id: { not: args.productId },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: args.take ?? 4,
    select: productSelect,
  });
}
