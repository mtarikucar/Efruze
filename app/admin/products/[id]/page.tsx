import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db/client";
import { PageHeader, AdminButton } from "@/components/admin/primitives";
import { ProductForm, type ProductFormInitial } from "@/components/admin/ProductForm";
import { deleteProductAction } from "@/app/admin/products/actions";

export const metadata: Metadata = { title: "Ürünü düzenle · yönetim" };

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;

  let initial: ProductFormInitial | null = null;
  let categories: Array<{ id: string; name: string }> = [];

  try {
    const [product, cats] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: {
          translations: true,
          variants: { orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }] },
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
          models3d: true,
        },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { translations: { where: { locale: "tr" } } },
      }),
    ]);
    if (!product) notFound();

    const tr = product.translations.find((t) => t.locale === "tr");

    initial = {
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      categoryId: product.categoryId,
      basePrice: product.basePrice.toString(),
      currency: product.currency,
      editionTotal: product.editionTotal,
      editionNumber: product.editionNumber,
      isFeatured: product.isFeatured,
      isPublished: product.isPublished,
      sortOrder: product.sortOrder,
      seoTitle: product.seoTitle ?? "",
      seoDescription: product.seoDescription ?? "",
      translations: {
        tr: {
          name: tr?.name ?? "",
          tagline: tr?.tagline ?? "",
          description: tr?.description ?? "",
          materials: tr?.materials ?? "",
        },
      },
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        stock: v.stock,
        priceOverride: v.priceOverride ? v.priceOverride.toString() : "",
        isDefault: v.isDefault,
      })),
      images: product.images.map((i) => ({
        url: i.url,
        alt: i.alt ?? "",
        publicId: i.publicId,
      })),
      model3d: product.models3d[0]
        ? {
            glbUrl: product.models3d[0].glbUrl,
            usdzUrl: product.models3d[0].usdzUrl ?? "",
            posterUrl: product.models3d[0].posterUrl ?? "",
            publicId: product.models3d[0].publicId,
          }
        : null,
    };

    categories = cats.map((c) => ({
      id: c.id,
      name: c.translations[0]?.name ?? c.slug,
    }));
  } catch (err) {
    console.error("[admin/products/edit] load failed", err);
    notFound();
  }

  if (!initial) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Katalog"
        title="Ürünü düzenle"
        sub={initial.translations.tr.name || initial.sku}
        actions={
          <form action={async () => {
            "use server";
            await deleteProductAction({ id: initial!.id! });
          }}>
            <AdminButton type="submit" variant="danger" size="md">
              Sil
            </AdminButton>
          </form>
        }
      />

      <ProductForm initial={initial} categories={categories} />
    </div>
  );
}
