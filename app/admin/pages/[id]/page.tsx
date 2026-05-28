import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db/client";
import { PageHeader } from "@/components/admin/primitives";
import { StaticPageForm, type StaticPageFormInitial } from "@/components/admin/StaticPageForm";

export const metadata: Metadata = { title: "Sayfa düzenle · yönetim" };

type Params = Promise<{ id: string }>;

export default async function EditStaticPagePage({ params }: { params: Params }) {
  const { id } = await params;
  let initial: StaticPageFormInitial | null = null;
  try {
    const p = await prisma.staticPage.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!p) notFound();
    const tr = p.translations.find((t) => t.locale === "tr");
    initial = {
      id: p.id,
      slug: p.slug,
      isActive: p.isActive,
      translations: {
        tr: { title: tr?.title ?? "", intro: tr?.intro ?? "", body: tr?.body ?? "" },
      },
    };
  } catch {
    notFound();
  }
  if (!initial) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="İçerik"
        title={`/${initial.slug}`}
        sub={initial.translations.tr.title || initial.slug}
      />
      <StaticPageForm initial={initial} />
    </div>
  );
}
