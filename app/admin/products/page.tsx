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
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Ürünler · yönetim" };

export default async function AdminProductsPage() {
  let products: Awaited<ReturnType<typeof load>> = [];
  try {
    products = await load();
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

      {products.length === 0 ? (
        <EmptyState title="Henüz ürün yok." sub="İlk parçayı eklemek için 'Yeni ürün'e tıklayın." />
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

async function load() {
  const rows = await prisma.product.findMany({
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
