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

export const metadata: Metadata = { title: "Kategoriler · yönetim" };

export default async function AdminCategoriesPage() {
  let categories: Awaited<ReturnType<typeof load>> = [];
  try {
    categories = await load();
  } catch {
    categories = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Katalog"
        title="Kategoriler"
        sub="Atölyenin parçalarını nasıl grupladığı."
        actions={
          <AdminLinkButton href="/admin/categories/new">+ Yeni kategori</AdminLinkButton>
        }
      />

      {categories.length === 0 ? (
        <EmptyState title="Henüz kategori yok." />
      ) : (
        <Table>
          <THead>
            <Th>Ad</Th>
            <Th>Slug</Th>
            <Th>Üst kategori</Th>
            <Th>Ürünler</Th>
            <Th>Durum</Th>
            <Th>Sıra</Th>
          </THead>
          <TBody>
            {categories.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <a href={`/admin/categories/${c.id}`} className="font-serif text-ink hover:text-blue-deep">
                    {c.name}
                  </a>
                </Td>
                <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  {c.slug}
                </Td>
                <Td className="text-ink-2">{c.parentName ?? "—"}</Td>
                <Td>{c.productCount}</Td>
                <Td className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  {c.isActive ? "aktif" : "pasif"}
                </Td>
                <Td>{c.sortOrder}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

async function load() {
  const rows = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      translations: { where: { locale: "tr" } },
      parent: { include: { translations: { where: { locale: "tr" } } } },
      _count: { select: { products: true } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.translations[0]?.name ?? c.slug,
    slug: c.slug,
    parentName: c.parent
      ? c.parent.translations[0]?.name ?? c.parent.slug
      : null,
    productCount: c._count.products,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
  }));
}
