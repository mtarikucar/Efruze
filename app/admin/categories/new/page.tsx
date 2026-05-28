import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { PageHeader } from "@/components/admin/primitives";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata: Metadata = { title: "Yeni kategori · yönetim" };

export default async function NewCategoryPage() {
  let parents: Array<{ id: string; name: string }> = [];
  try {
    const rows = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      include: { translations: { where: { locale: "tr" } } },
    });
    parents = rows.map((c) => ({
      id: c.id,
      name: c.translations[0]?.name ?? c.slug,
    }));
  } catch {
    parents = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Katalog" title="Yeni kategori" />
      <CategoryForm initial={null} parents={parents} />
    </div>
  );
}
