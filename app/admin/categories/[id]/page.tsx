import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db/client";
import { PageHeader, AdminButton } from "@/components/admin/primitives";
import { CategoryForm, type CategoryFormInitial } from "@/components/admin/CategoryForm";
import { deleteCategoryAction } from "@/app/admin/categories/actions";

export const metadata: Metadata = { title: "Kategoriyi düzenle · yönetim" };

type Params = Promise<{ id: string }>;

export default async function EditCategoryPage({ params }: { params: Params }) {
  const { id } = await params;

  let initial: CategoryFormInitial | null = null;
  let parents: Array<{ id: string; name: string }> = [];

  try {
    const [c, others] = await Promise.all([
      prisma.category.findUnique({
        where: { id },
        include: { translations: true },
      }),
      prisma.category.findMany({
        where: { isActive: true, parentId: null },
        include: { translations: { where: { locale: "tr" } } },
      }),
    ]);
    if (!c) notFound();
    const tr = c.translations.find((t) => t.locale === "tr");
    initial = {
      id: c.id,
      slug: c.slug,
      parentId: c.parentId ?? "",
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      imageUrl: c.imageUrl ?? "",
      translations: {
        tr: { name: tr?.name ?? "", description: tr?.description ?? "" },
      },
    };
    parents = others.map((p) => ({
      id: p.id,
      name: p.translations[0]?.name ?? p.slug,
    }));
  } catch (err) {
    console.error("[admin/categories/edit] load failed", err);
    notFound();
  }

  if (!initial) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Katalog"
        title="Kategoriyi düzenle"
        sub={initial.translations.tr.name || initial.slug}
        actions={
          <form action={async () => {
            "use server";
            await deleteCategoryAction({ id: initial!.id! });
          }}>
            <AdminButton type="submit" variant="danger" size="md">
              Sil
            </AdminButton>
          </form>
        }
      />
      <CategoryForm initial={initial} parents={parents} />
    </div>
  );
}
