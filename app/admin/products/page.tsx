import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { PageHeader, AdminLinkButton } from "@/components/admin/primitives";
import { CatalogTabs } from "@/components/admin/CatalogTabs";
import { CatalogTree, type CatalogCategory } from "@/components/admin/CatalogTree";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Katalog · yönetim" };

type Search = Promise<{ category?: string }>;

export default async function AdminCatalogPage({ searchParams }: { searchParams: Search }) {
  const { category } = await searchParams;

  let categories: CatalogCategory[] = [];
  try {
    categories = await load();
  } catch {
    categories = [];
  }

  const totalProducts = categories.reduce((acc, c) => acc + c.productCount, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Katalog"
        title="Katalog"
        sub={`${categories.length} kategori · ${totalProducts} ürün`}
        actions={
          <AdminLinkButton href="/admin/products/new" variant="ink" size="md">
            + Yeni ürün
          </AdminLinkButton>
        }
      />

      <CatalogTabs />

      <CatalogTree categories={categories} defaultExpandedId={category} />
    </div>
  );
}

async function load(): Promise<CatalogCategory[]> {
  const cats = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: { where: { locale: "tr" } },
      parent: { include: { translations: { where: { locale: "tr" } } } },
      products: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: {
          translations: { where: { locale: "tr" } },
          images: { where: { isPrimary: true }, take: 1 },
          variants: { select: { stock: true } },
        },
      },
    },
  });

  return cats.map((c) => ({
    id: c.id,
    name: c.translations[0]?.name ?? c.slug,
    parentId: c.parentId,
    parentName: c.parent ? c.parent.translations[0]?.name ?? c.parent.slug : null,
    productCount: c.products.length,
    products: c.products.map((p) => ({
      id: p.id,
      name: p.translations[0]?.name ?? p.slug,
      price: formatPrice(Number(p.basePrice)),
      isPublished: p.isPublished,
      isFeatured: p.isFeatured,
      stock: p.variants.reduce((acc, v) => acc + v.stock, 0),
      imageUrl: p.images[0]?.url ?? null,
    })),
  }));
}
