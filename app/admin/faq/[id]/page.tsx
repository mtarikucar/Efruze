import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db/client";
import { PageHeader, AdminButton } from "@/components/admin/primitives";
import { FaqForm, type FaqFormInitial } from "@/components/admin/FaqForm";
import { deleteFaqAction } from "@/app/admin/faq/actions";

export const metadata: Metadata = { title: "SSS düzenle · yönetim" };

type Params = Promise<{ id: string }>;

export default async function EditFaqPage({ params }: { params: Params }) {
  const { id } = await params;
  let initial: FaqFormInitial | null = null;
  try {
    const e = await prisma.faqItem.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!e) notFound();
    const tr = e.translations.find((t) => t.locale === "tr");
    initial = {
      id: e.id,
      sortOrder: e.sortOrder,
      isActive: e.isActive,
      translations: {
        tr: { question: tr?.question ?? "", answer: tr?.answer ?? "" },
      },
    };
  } catch {
    notFound();
  }
  if (!initial) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Yardım"
        title="SSS düzenle"
        sub={initial.translations.tr.question || `(${initial.id})`}
        actions={
          <form
            action={async () => {
              "use server";
              await deleteFaqAction({ id: initial!.id! });
            }}
          >
            <AdminButton type="submit" variant="danger" size="md">
              Sil
            </AdminButton>
          </form>
        }
      />
      <FaqForm initial={initial} />
    </div>
  );
}
