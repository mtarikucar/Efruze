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

export const metadata: Metadata = { title: "Etkinlikler · yönetim" };

export default async function AdminEventsPage() {
  let events: Array<{
    id: string;
    slug: string;
    title: string;
    date: string;
    kind: string;
    isPublished: boolean;
    sortOrder: number;
  }> = [];
  try {
    const rows = await prisma.event.findMany({
      orderBy: { date: "asc" },
      include: { translations: { where: { locale: "tr" } } },
    });
    events = rows.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.translations[0]?.title ?? e.slug,
      date: e.date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      kind: e.kind,
      isPublished: e.isPublished,
      sortOrder: e.sortOrder,
    }));
  } catch {
    events = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Atölye güncesi"
        title="Etkinlikler"
        sub="Atölyeler, koleksiyon drop'ları, sergiler, ziyaretler."
        actions={<AdminLinkButton href="/admin/events/new">+ Yeni etkinlik</AdminLinkButton>}
      />

      {events.length === 0 ? (
        <EmptyState title="Henüz etkinlik yok." />
      ) : (
        <Table>
          <THead>
            <Th>Başlık</Th>
            <Th>Tarih</Th>
            <Th>Tür</Th>
            <Th>Durum</Th>
            <Th>Sıra</Th>
          </THead>
          <TBody>
            {events.map((e) => (
              <Tr key={e.id}>
                <Td>
                  <a href={`/admin/events/${e.id}`} className="font-serif text-ink hover:text-blue-deep">
                    {e.title}
                  </a>
                </Td>
                <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  {e.date}
                </Td>
                <Td className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  {e.kind.toLowerCase()}
                </Td>
                <Td className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  {e.isPublished ? "yayında" : "taslak"}
                </Td>
                <Td>{e.sortOrder}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
