import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import {
  PageHeader,
  Table,
  THead,
  Th,
  TBody,
  Tr,
  Td,
  AdminLinkButton,
  EmptyState,
} from "@/components/admin/primitives";
import { CatalogTabs } from "@/components/admin/CatalogTabs";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Ürünler · yönetim" };

type Search = Promise<{ category?: string }>;

export default async function AdminProductsPage({ searchParams }: { searchParams: Search }) {
  const { category: categoryId } = await searchParams;

  let products: Awaited<ReturnType<typeof load>> = [];
  let categoryName: string | null = null;
  try {
    products = await load(categoryId);
    if (categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { translations: { where: { locale: "tr" } } },
      });
      categoryName = cat ? (cat.translations[0]?.name ?? cat.slug) : null;
    }
  } catch {
    products = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Katalog"
        title="Ürünler"
        sub="Atölyedeki tüm parçalar."
        actions={
          <AdminLinkButton href="/admin/products/new" variant="ink" size="md">
            + Yeni ürün
          </AdminLinkButton>
        }
      />

      <CatalogTabs />

      {categoryId && (
        <div className="flex flex-wrap items-center gap-3 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          <span>
            <span className="text-ink">{categoryName ?? "Kategori"}</span> kategorisindeki ürünler
          </span>
          <Link
            href="/admin/products"
            className="text-blue-deep underline-offset-4 hover:underline"
          >
            filtreyi temizle
          </Link>
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          title={categoryId ? "Bu kategoride ürün yok." : "Henüz ürün yok."}
          sub={categoryId ? undefined : "İlk parçayı eklemek için 'Yeni ürün'e tıklayın."}
        />
      ) : (
        <Table>
          <THead>
            <Th>Ürün</Th>
            <Th>SKU</Th>
            <Th>Kategori</Th>
            <Th>Stok</Th>
            <Th className="text-right">Fiyat</Th>
            <Th>Durum</Th>
          </THead>
          <TBody>
            {products.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <a
                    href={`/admin/products/${p.id}`}
                    className="font-serif text-ink hover:text-blue-deep"
                  >
                    {p.name}
                  </a>
                  {p.isFeatured && (
                    <span className="ml-3 font-caps text-[9px] uppercase tracking-[0.22em] text-gold">
                      öne çıkan
                    </span>
                  )}
                </Td>
                <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  {p.sku}
                </Td>
                <Td className="text-ink-2">{p.categoryName}</Td>
                <Td className={p.totalStock <= 3 ? "text-gold" : ""}>{p.totalStock}</Td>
                <Td className="text-right">{formatPrice(Number(p.basePrice))}</Td>
                <Td className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  {p.isPublished ? "yayında" : "taslak"}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

async function load(categoryId?: string) {
  const rows = await prisma.product.findMany({
    where: categoryId ? { categoryId } : undefined,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      translations: { where: { locale: "tr" } },
      category: { include: { translations: { where: { locale: "tr" } } } },
      variants: { select: { stock: true } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.translations[0]?.name ?? p.slug,
    sku: p.sku,
    basePrice: p.basePrice.toString(),
    isPublished: p.isPublished,
    isFeatured: p.isFeatured,
    categoryName: p.category.translations[0]?.name ?? p.category.slug,
    totalStock: p.variants.reduce((acc, v) => acc + v.stock, 0),
  }));
}
