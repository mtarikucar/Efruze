import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db/client";
import { PageHeader, AdminButton } from "@/components/admin/primitives";
import { EventForm, type EventFormInitial } from "@/components/admin/EventForm";
import { deleteEventAction } from "@/app/admin/events/actions";

export const metadata: Metadata = { title: "Etkinlik düzenle · yönetim" };

type Params = Promise<{ id: string }>;

export default async function EditEventPage({ params }: { params: Params }) {
  const { id } = await params;
  let initial: EventFormInitial | null = null;
  try {
    const e = await prisma.event.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!e) notFound();
    const tr = e.translations.find((t) => t.locale === "tr");
    initial = {
      id: e.id,
      slug: e.slug,
      date: e.date.toISOString().slice(0, 16),
      kind: e.kind,
      imageUrl: e.imageUrl ?? "",
      priceText: e.priceText ?? "",
      ctaUrl: e.ctaUrl,
      isPublished: e.isPublished,
      sortOrder: e.sortOrder,
      translations: {
        tr: {
          tag: tr?.tag ?? "",
          title: tr?.title ?? "",
          description: tr?.description ?? "",
          meta: tr?.meta ?? "",
          ctaLabel: tr?.ctaLabel ?? "",
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
        title="Etkinlik düzenle"
        sub={initial.translations.tr.title || initial.slug}
        actions={
          <form action={async () => {
            "use server";
            await deleteEventAction({ id: initial!.id! });
          }}>
            <AdminButton type="submit" variant="danger" size="md">
              Sil
            </AdminButton>
          </form>
        }
      />
      <EventForm initial={initial} />
    </div>
  );
}
