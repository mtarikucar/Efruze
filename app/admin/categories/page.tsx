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

export const metadata: Metadata = { title: "Kategorileri yönet · yönetim" };

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
        title="Kategorileri yönet"
        sub="Kategori adı, slug, üst kategori, sıra ve görsel. Ürünler 'Katalog' sekmesinde."
        actions={
          <AdminLinkButton href="/admin/categories/new">+ Yeni kategori</AdminLinkButton>
        }
      />

      <CatalogTabs />

      {categories.length === 0 ? (
        <EmptyState title="Henüz kategori yok." />
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {categories.map((c) => (
              <div key={c.id} className="rounded-sm border border-line bg-paper p-4">
                <div className="flex items-start justify-between gap-3">
                  <a href={`/admin/categories/${c.id}`} className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-lg text-ink">
                      {c.name}
                    </span>
                    <span className="mt-0.5 block font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                      {c.slug}
                    </span>
                  </a>
                  <span className="flex-none font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                    {c.isActive ? "aktif" : "pasif"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  {c.parentName && <span>üst: {c.parentName}</span>}
                  <span>sıra {c.sortOrder}</span>
                  {c.productCount > 0 ? (
                    <a
                      href={`/admin/products?category=${c.id}`}
                      className="text-blue-deep underline-offset-4 hover:underline"
                    >
                      {c.productCount} ürün
                    </a>
                  ) : (
                    <span>0 ürün</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
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
                      <a
                        href={`/admin/categories/${c.id}`}
                        className="font-serif text-ink hover:text-blue-deep"
                      >
                        {c.name}
                      </a>
                    </Td>
                    <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                      {c.slug}
                    </Td>
                    <Td className="text-ink-2">{c.parentName ?? "—"}</Td>
                    <Td>
                      {c.productCount > 0 ? (
                        <a
                          href={`/admin/products?category=${c.id}`}
                          className="font-serif text-ink underline-offset-4 hover:text-blue-deep hover:underline"
                        >
                          {c.productCount} ürün
                        </a>
                      ) : (
                        <span className="text-ink-mute">0</span>
                      )}
                    </Td>
                    <Td className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                      {c.isActive ? "aktif" : "pasif"}
                    </Td>
                    <Td>{c.sortOrder}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

async function load() {
  const rows = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: { where: { locale: "tr" } },
      parent: { include: { translations: { where: { locale: "tr" } } } },
      _count: { select: { products: { where: { deletedAt: null } } } },
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
