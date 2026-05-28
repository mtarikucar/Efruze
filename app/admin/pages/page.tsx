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
  EmptyState,
} from "@/components/admin/primitives";

export const metadata: Metadata = { title: "Sayfalar · yönetim" };

const KNOWN_SLUGS = ["terms", "privacy"];

export default async function AdminPagesPage() {
  let items: Array<{
    id: string;
    slug: string;
    title: string;
    isActive: boolean;
    missing: boolean;
  }> = [];
  try {
    const rows = await prisma.staticPage.findMany({
      include: { translations: { where: { locale: "tr" } } },
    });
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    items = KNOWN_SLUGS.map((slug) => {
      const row = bySlug.get(slug);
      if (!row) return { id: "", slug, title: "(henüz oluşturulmadı)", isActive: false, missing: true };
      return {
        id: row.id,
        slug: row.slug,
        title: row.translations[0]?.title ?? row.slug,
        isActive: row.isActive,
        missing: false,
      };
    });
  } catch {
    items = KNOWN_SLUGS.map((slug) => ({
      id: "",
      slug,
      title: "(veritabanına erişilemiyor)",
      isActive: false,
      missing: true,
    }));
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="İçerik"
        title="Sayfalar"
        sub="Şartlar ve gizlilik gibi statik sayfalar. Slug'ları kod tarafından sabitlenmiştir — sadece içerik düzenlenir."
      />

      {items.length === 0 ? (
        <EmptyState title="Sistem sayfası yok." />
      ) : (
        <Table>
          <THead>
            <Th>Slug</Th>
            <Th>Başlık</Th>
            <Th>Durum</Th>
            <Th>Ziyaret</Th>
          </THead>
          <TBody>
            {items.map((p) => (
              <Tr key={p.slug}>
                <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  /{p.slug}
                </Td>
                <Td>
                  {p.missing ? (
                    <span className="font-serif italic text-ink-mute">{p.title}</span>
                  ) : (
                    <a
                      href={`/admin/pages/${p.id}`}
                      className="font-serif text-ink hover:text-blue-deep"
                    >
                      {p.title}
                    </a>
                  )}
                </Td>
                <Td className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  {p.missing ? "—" : p.isActive ? "aktif" : "gizli"}
                </Td>
                <Td>
                  <a
                    href={`/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-caps text-[10px] uppercase tracking-[0.22em] text-blue-deep hover:underline"
                  >
                    aç ↗
                  </a>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
