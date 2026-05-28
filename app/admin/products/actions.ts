"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";
import { slugify } from "@/lib/slug";
import { destroyMany } from "@/lib/cloudinary";

const translationSchema = z.object({
  locale: z.enum(["tr", "en"]),
  name: z.string().min(1, "Required").max(200),
  tagline: z.string().max(300).optional().or(z.literal("")),
  description: z.string().max(10_000).optional().or(z.literal("")),
  materials: z.string().max(2000).optional().or(z.literal("")),
});

const variantInputSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "Required").max(120),
  stock: z.coerce.number().int().min(0).max(99_999),
  priceOverride: z.string().optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
});

const productInputSchema = z.object({
  slug: z.string().optional().or(z.literal("")),
  sku: z.string().min(1, "Required").max(120),
  categoryId: z.string().min(1, "Required"),
  basePrice: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Invalid price"),
  currency: z.string().length(3).default("TRY"),
  editionTotal: z.coerce.number().int().min(1).max(99_999).optional().or(z.literal("").transform(() => undefined)),
  editionNumber: z.coerce.number().int().min(1).max(99_999).optional().or(z.literal("").transform(() => undefined)),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(99_999).default(0),
  seoTitle: z.string().max(200).optional().or(z.literal("")),
  seoDescription: z.string().max(500).optional().or(z.literal("")),
  translations: z.array(translationSchema).min(1),
  variants: z.array(variantInputSchema).min(1),
  images: z
    .array(
      z.object({
        url: z.string().min(1, "Required"),
        alt: z.string().max(200).optional().or(z.literal("")),
        publicId: z.string().optional(),
      }),
    )
    .default([]),
  model3d: z
    .object({
      glbUrl: z.string().min(1),
      usdzUrl: z.string().optional().or(z.literal("")),
      posterUrl: z.string().optional().or(z.literal("")),
      publicId: z.string().min(1),
    })
    .nullable()
    .optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;
type ActionResult = { ok: false; error: string };

export async function createProductAction(raw: unknown): Promise<ActionResult | void> {
  await requireAdmin();
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID_INPUT" };
  }
  const input = parsed.data;
  const trName = input.translations.find((t) => t.locale === "tr")?.name ?? "";
  const slug = (input.slug || slugify(trName)) || `product-${Date.now()}`;

  let createdId: string;
  try {
    const created = await prisma.product.create({
      data: {
        slug,
        sku: input.sku,
        categoryId: input.categoryId,
        basePrice: new Prisma.Decimal(input.basePrice),
        currency: input.currency,
        editionTotal: input.editionTotal ?? null,
        editionNumber: input.editionNumber ?? null,
        isFeatured: input.isFeatured,
        isPublished: input.isPublished,
        publishedAt: input.isPublished ? new Date() : null,
        sortOrder: input.sortOrder,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        translations: {
          create: input.translations.map((t) => ({
            locale: t.locale,
            name: t.name,
            tagline: t.tagline || null,
            description: t.description || null,
            materials: t.materials || null,
          })),
        },
        variants: {
          create: input.variants.map((v) => ({
            sku: v.sku,
            stock: v.stock,
            priceOverride: v.priceOverride ? new Prisma.Decimal(v.priceOverride) : null,
            isDefault: v.isDefault,
            attributes: {} as Prisma.InputJsonValue,
          })),
        },
        images: {
          create: input.images.map((img, i) => ({
            url: img.url,
            publicId: img.publicId ?? img.url,
            alt: img.alt || null,
            isPrimary: i === 0,
            sortOrder: i,
          })),
        },
        ...(input.model3d
          ? {
              models3d: {
                create: [
                  {
                    glbUrl: input.model3d.glbUrl,
                    usdzUrl: input.model3d.usdzUrl || null,
                    posterUrl: input.model3d.posterUrl || null,
                    publicId: input.model3d.publicId,
                  },
                ],
              },
            }
          : {}),
      },
    });
    createdId = created.id;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "CREATE_FAILED" };
  }

  revalidatePath("/admin/products");
  redirect(`/admin/products/${createdId}`);
}

export async function updateProductAction(
  raw: unknown & { id: string },
): Promise<ActionResult | void> {
  await requireAdmin();
  if (!raw || typeof raw !== "object" || !("id" in raw)) {
    return { ok: false, error: "MISSING_ID" };
  }
  const id = (raw as { id: string }).id;
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID_INPUT" };
  }
  const input = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUniqueOrThrow({ where: { id } });
      const slug = input.slug || existing.slug;

      await tx.product.update({
        where: { id },
        data: {
          slug,
          sku: input.sku,
          categoryId: input.categoryId,
          basePrice: new Prisma.Decimal(input.basePrice),
          currency: input.currency,
          editionTotal: input.editionTotal ?? null,
          editionNumber: input.editionNumber ?? null,
          isFeatured: input.isFeatured,
          isPublished: input.isPublished,
          publishedAt: input.isPublished
            ? existing.publishedAt ?? new Date()
            : null,
          sortOrder: input.sortOrder,
          seoTitle: input.seoTitle || null,
          seoDescription: input.seoDescription || null,
        },
      });

      // Replace translations
      await tx.productTranslation.deleteMany({ where: { productId: id } });
      await tx.productTranslation.createMany({
        data: input.translations.map((t) => ({
          productId: id,
          locale: t.locale,
          name: t.name,
          tagline: t.tagline || null,
          description: t.description || null,
          materials: t.materials || null,
        })),
      });

      // Sync variants — upsert by id; delete orphans
      const keepVariantIds: string[] = [];
      for (const v of input.variants) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              sku: v.sku,
              stock: v.stock,
              priceOverride: v.priceOverride ? new Prisma.Decimal(v.priceOverride) : null,
              isDefault: v.isDefault,
            },
          });
          keepVariantIds.push(v.id);
        } else {
          const created = await tx.productVariant.create({
            data: {
              productId: id,
              sku: v.sku,
              stock: v.stock,
              priceOverride: v.priceOverride ? new Prisma.Decimal(v.priceOverride) : null,
              isDefault: v.isDefault,
              attributes: {} as Prisma.InputJsonValue,
            },
          });
          keepVariantIds.push(created.id);
        }
      }
      await tx.productVariant.deleteMany({
        where: { productId: id, id: { notIn: keepVariantIds } },
      });

      // Replace images — wholesale delete/recreate keeps sortOrder/isPrimary
      // in lockstep with the form's array order.
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (input.images.length > 0) {
        await tx.productImage.createMany({
          data: input.images.map((img, i) => ({
            productId: id,
            url: img.url,
            publicId: img.publicId ?? img.url,
            alt: img.alt || null,
            isPrimary: i === 0,
            sortOrder: i,
          })),
        });
      }

      // Sync 3D model — at most one per product in v1.
      await tx.productModel3D.deleteMany({ where: { productId: id } });
      if (input.model3d) {
        await tx.productModel3D.create({
          data: {
            productId: id,
            glbUrl: input.model3d.glbUrl,
            usdzUrl: input.model3d.usdzUrl || null,
            posterUrl: input.model3d.posterUrl || null,
            publicId: input.model3d.publicId,
          },
        });
      }
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "UPDATE_FAILED" };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/"); // storefront featured grid
  return;
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function deleteProductAction(raw: unknown): Promise<ActionResult | void> {
  await requireAdmin();
  const parsed = deleteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  try {
    // Fetch assets first so we can destroy them post-soft-delete (fail-soft).
    const product = await prisma.product.findUnique({
      where: { id: parsed.data.id },
      include: {
        images: { select: { publicId: true } },
        models3d: { select: { publicId: true } },
      },
    });

    // Soft delete — set deletedAt instead of removing the row, so OrderItem
    // history remains intact.
    await prisma.product.update({
      where: { id: parsed.data.id },
      data: { deletedAt: new Date(), isPublished: false },
    });

    if (product) {
      // Cloudinary cleanup — fail-soft; the SDK no-ops when env vars are missing,
      // and per-asset errors are logged inside lib/cloudinary.
      const toDestroy: Array<{ publicId: string; resourceType: "image" | "raw" }> = [];
      for (const img of product.images) {
        if (img.publicId && !img.publicId.startsWith("/")) {
          toDestroy.push({ publicId: img.publicId, resourceType: "image" });
        }
      }
      for (const m of product.models3d) {
        if (m.publicId) toDestroy.push({ publicId: m.publicId, resourceType: "raw" });
      }
      if (toDestroy.length > 0) {
        await destroyMany(toDestroy);
      }
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "DELETE_FAILED" };
  }
  revalidatePath("/admin/products");
  revalidatePath("/");
}
