import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { PageHeader, AdminLinkButton } from "@/components/admin/primitives";
import { CatalogTabs } from "@/components/admin/CatalogTabs";
import {
  CatalogTree,
  type CatalogCategory,
  type CatalogProduct,
} from "@/components/admin/CatalogTree";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Katalog · yönetim" };

type Search = Promise<{ category?: string; lowstock?: string }>;

const LOW_STOCK_THRESHOLD = 3;

export default async function AdminCatalogPage({ searchParams }: { searchParams: Search }) {
  const { category, lowstock } = await searchParams;
  const lowStockOnly = lowstock === "1";

  let categories: CatalogCategory[] = [];
  try {
    categories = await load();
  } catch {
    categories = [];
  }

  // Low-stock work list: keep only products at/under the threshold, drop the
  // categories that then hold nothing.
  if (lowStockOnly) {
    categories = categories
      .map((c) => {
        const products = c.products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD);
        return { ...c, products, productCount: products.length };
      })
      .filter((c) => c.products.length > 0);
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

      {lowStockOnly && (
        <div className="flex flex-wrap items-center gap-3 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          <span>
            <span className="text-gold">Stoğu ≤ {LOW_STOCK_THRESHOLD}</span> olan ürünler
          </span>
          <a
            href="/admin/products"
            className="text-blue-deep underline-offset-4 hover:underline"
          >
            filtreyi temizle
          </a>
        </div>
      )}

      {lowStockOnly && categories.length === 0 ? (
        <div className="rounded-sm border border-dashed border-line bg-paper p-12 text-center font-serif text-lg text-ink-2">
          Stoğu azalan ürün yok. 👍
        </div>
      ) : (
        <CatalogTree categories={categories} defaultExpandedId={category} />
      )}
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

  const tree: CatalogCategory[] = cats.map((c) => ({
    id: c.id,
    name: c.translations[0]?.name ?? c.slug,
    parentId: c.parentId,
    parentName: c.parent ? c.parent.translations[0]?.name ?? c.parent.slug : null,
    productCount: c.products.length,
    products: c.products.map(toCatalogProduct),
  }));

  // Catch-all: live products whose category was soft-deleted. They'd otherwise
  // vanish from the tree entirely — the old flat list always showed them, so
  // hiding them is a regression. Surface them so they can be re-categorised.
  const orphans = await prisma.product.findMany({
    where: { deletedAt: null, category: { deletedAt: { not: null } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      translations: { where: { locale: "tr" } },
      images: { where: { isPrimary: true }, take: 1 },
      variants: { select: { stock: true } },
    },
  });
  if (orphans.length > 0) {
    tree.push({
      id: "__orphaned__",
      name: "Silinmiş kategorideki ürünler",
      parentId: null,
      parentName: null,
      manageable: false,
      productCount: orphans.length,
      products: orphans.map(toCatalogProduct),
    });
  }

  return tree;
}

function toCatalogProduct(p: {
  id: string;
  slug: string;
  basePrice: unknown;
  isPublished: boolean;
  isFeatured: boolean;
  translations: { name: string }[];
  images: { url: string }[];
  variants: { stock: number }[];
}): CatalogProduct {
  return {
    id: p.id,
    name: p.translations[0]?.name ?? p.slug,
    price: formatPrice(Number(p.basePrice)),
    isPublished: p.isPublished,
    isFeatured: p.isFeatured,
    stock: p.variants.reduce((acc, v) => acc + v.stock, 0),
    imageUrl: p.images[0]?.url ?? null,
  };
}
