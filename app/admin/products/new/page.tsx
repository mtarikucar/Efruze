import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { PageHeader } from "@/components/admin/primitives";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Yeni ürün · yönetim" };

type Search = Promise<{ category?: string }>;

export default async function NewProductPage({ searchParams }: { searchParams: Search }) {
  const { category } = await searchParams;
  let categories: Array<{ id: string; name: string; parentId?: string | null }> = [];
  try {
    const rows = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { translations: { where: { locale: "tr" } } },
    });
    categories = rows.map((c) => ({
      id: c.id,
      name: c.translations[0]?.name ?? c.slug,
      parentId: c.parentId,
    }));
  } catch {
    categories = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Katalog" title="Yeni ürün" />
      <ProductForm initial={null} categories={categories} defaultCategoryId={category} />
    </div>
  );
}
