import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db/client";
import { PageHeader, AdminButton } from "@/components/admin/primitives";
import { JournalForm, type JournalFormInitial } from "@/components/admin/JournalForm";
import { deleteJournalAction } from "@/app/admin/journal/actions";

export const metadata: Metadata = { title: "Yazı düzenle · yönetim" };

type Params = Promise<{ id: string }>;

export default async function EditJournalPage({ params }: { params: Params }) {
  const { id } = await params;
  let initial: JournalFormInitial | null = null;
  try {
    const e = await prisma.journalEntry.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!e) notFound();
    const tr = e.translations.find((t) => t.locale === "tr");
    initial = {
      id: e.id,
      slug: e.slug,
      date: e.date.toISOString().slice(0, 16),
      imageUrl: e.imageUrl ?? "",
      featured: e.featured,
      readMinutes: e.readMinutes,
      isPublished: e.isPublished,
      sortOrder: e.sortOrder,
      translations: {
        tr: {
          category: tr?.category ?? "",
          title: tr?.title ?? "",
          excerpt: tr?.excerpt ?? "",
          body: tr?.body ?? "",
        },
      },
    };
  } catch {
    notFound();
  }
  if (!initial) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Atölye güncesi"
        title="Yazı düzenle"
        sub={initial.translations.tr.title || initial.slug}
        actions={
          <form action={async () => {
            "use server";
            await deleteJournalAction({ id: initial!.id! });
          }}>
            <AdminButton type="submit" variant="danger" size="md">
              Sil
            </AdminButton>
          </form>
        }
      />
      <JournalForm initial={initial} />
    </div>
  );
}
