import { prisma } from "./client";

export async function findActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      translations: true,
      children: {
        where: { isActive: true },
        include: { translations: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function findCategoryBySlug(slug: string) {
  return prisma.category.findFirst({
    where: { slug, isActive: true },
    include: { translations: true },
  });
}
