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

export const metadata: Metadata = { title: "SSS · yönetim" };

export default async function AdminFaqPage() {
  let items: Array<{
    id: string;
    question: string;
    sortOrder: number;
    isActive: boolean;
  }> = [];
  try {
    const rows = await prisma.faqItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { translations: { where: { locale: "tr" } } },
    });
    items = rows.map((r) => ({
      id: r.id,
      question: r.translations[0]?.question ?? "(TR çeviri yok)",
      sortOrder: r.sortOrder,
      isActive: r.isActive,
    }));
  } catch {
    items = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Yardım"
        title="SSS"
        sub="Sıkça sorulan sorular — sıralama numarası küçük olan önce çıkar."
        actions={<AdminLinkButton href="/admin/faq/new">+ Yeni soru</AdminLinkButton>}
      />

      {items.length === 0 ? (
        <EmptyState title="Henüz SSS kaydı yok." />
      ) : (
        <Table>
          <THead>
            <Th>Soru</Th>
            <Th>Sıra</Th>
            <Th>Durum</Th>
          </THead>
          <TBody>
            {items.map((it) => (
              <Tr key={it.id}>
                <Td>
                  <a
                    href={`/admin/faq/${it.id}`}
                    className="font-serif text-ink hover:text-blue-deep"
                  >
                    {it.question}
                  </a>
                </Td>
                <Td>{it.sortOrder}</Td>
                <Td className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  {it.isActive ? "aktif" : "gizli"}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
