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

export const metadata: Metadata = { title: "Günce · yönetim" };

export default async function AdminJournalPage() {
  let entries: Array<{
    id: string;
    title: string;
    category: string;
    date: string;
    featured: boolean;
    isPublished: boolean;
    readMinutes: number;
  }> = [];
  try {
    const rows = await prisma.journalEntry.findMany({
      orderBy: [{ featured: "desc" }, { date: "desc" }],
      include: { translations: { where: { locale: "tr" } } },
    });
    entries = rows.map((e) => ({
      id: e.id,
      title: e.translations[0]?.title ?? e.slug,
      category: e.translations[0]?.category ?? "—",
      date: e.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      featured: e.featured,
      isPublished: e.isPublished,
      readMinutes: e.readMinutes,
    }));
  } catch {
    entries = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Atölye güncesi"
        title="Günce"
        sub="Günce yazıları — atölyeden, ustalardan, malzemelerden."
        actions={<AdminLinkButton href="/admin/journal/new">+ Yeni yazı</AdminLinkButton>}
      />

      {entries.length === 0 ? (
        <EmptyState title="Henüz yazı yok." />
      ) : (
        <Table>
          <THead>
            <Th>Başlık</Th>
            <Th>Kategori</Th>
            <Th>Tarih</Th>
            <Th>Okuma</Th>
            <Th>Etiketler</Th>
          </THead>
          <TBody>
            {entries.map((e) => (
              <Tr key={e.id}>
                <Td>
                  <a href={`/admin/journal/${e.id}`} className="font-serif text-ink hover:text-blue-deep">
                    {e.title}
                  </a>
                </Td>
                <Td className="text-ink-2">{e.category}</Td>
                <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  {e.date}
                </Td>
                <Td className="text-ink-mute">{e.readMinutes} dk</Td>
                <Td className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  {[e.featured && "öne çıkan", e.isPublished ? "yayında" : "taslak"].filter(Boolean).join(" · ")}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
