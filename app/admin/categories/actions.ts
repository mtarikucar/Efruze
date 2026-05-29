"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";
import { slugify } from "@/lib/slug";

const categoryInputSchema = z.object({
  slug: z.string().optional().or(z.literal("")),
  parentId: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(99_999).default(0),
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional().or(z.literal("")),
  translations: z
    .array(
      z.object({
        locale: z.enum(["tr", "en"]),
        name: z.string().min(1, "Required").max(200),
        description: z.string().max(2000).optional().or(z.literal("")),
      }),
    )
    .min(1),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
type Result = { ok: false; error: string };

export async function createCategoryAction(raw: unknown): Promise<Result | void> {
  await requireAdmin();
  const parsed = categoryInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  const input = parsed.data;
  const trName = input.translations.find((t) => t.locale === "tr")?.name ?? "";
  const slug = (input.slug || slugify(trName)) || `category-${Date.now()}`;

  let createdId: string;
  try {
    const created = await prisma.category.create({
      data: {
        slug,
        parentId: input.parentId || null,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        imageUrl: input.imageUrl || null,
        translations: {
          create: input.translations.map((t) => ({
            locale: t.locale,
            name: t.name,
            description: t.description || null,
          })),
        },
      },
    });
    createdId = created.id;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "CREATE_FAILED" };
  }
  revalidatePath("/admin/categories");
  redirect(`/admin/categories/${createdId}`);
}

export async function updateCategoryAction(raw: unknown & { id: string }): Promise<Result | void> {
  await requireAdmin();
  if (!raw || typeof raw !== "object" || !("id" in raw)) {
    return { ok: false, error: "MISSING_ID" };
  }
  const id = (raw as { id: string }).id;
  const parsed = categoryInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  const input = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUniqueOrThrow({ where: { id } });
      const slug = input.slug || existing.slug;

      await tx.category.update({
        where: { id },
        data: {
          slug,
          parentId: input.parentId || null,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
          imageUrl: input.imageUrl || null,
        },
      });
      await tx.categoryTranslation.deleteMany({ where: { categoryId: id } });
      await tx.categoryTranslation.createMany({
        data: input.translations.map((t) => ({
          categoryId: id,
          locale: t.locale,
          name: t.name,
          description: t.description || null,
        })),
      });
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "UPDATE_FAILED" };
  }
  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${id}`);
}

export async function deleteCategoryAction(raw: unknown): Promise<Result | void> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  try {
    // Guard: a category with products can't be deleted (products would be
    // orphaned — Product.categoryId is NOT NULL with no cascade). The admin
    // must move or delete those products first.
    const count = await prisma.product.count({
      where: { categoryId: parsed.data.id, deletedAt: null },
    });
    if (count > 0) {
      return {
        ok: false,
        error: `Bu kategoride ${count} ürün var; önce ürünleri başka kategoriye taşıyın veya silin.`,
      };
    }
    // Soft delete via deletedAt, plus deactivate
    await prisma.category.update({
      where: { id: parsed.data.id },
      data: { deletedAt: new Date(), isActive: false },
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "DELETE_FAILED" };
  }
  revalidatePath("/admin/categories");
}

/**
 * Lightweight category creation used inline from the product form ("+ Yeni
 * kategori") so the admin never has to leave the page. Unlike
 * createCategoryAction this does NOT redirect — it returns the new id/name so
 * the form can select it immediately.
 */
export async function quickCreateCategoryAction(
  raw: unknown,
): Promise<{ ok: true; id: string; name: string } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Kategori adı gerekli").max(200),
      parentId: z.string().optional().or(z.literal("")),
    })
    .safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  }
  const name = parsed.data.name;
  const slug = slugify(name) || `category-${Date.now()}`;
  try {
    const created = await prisma.category.create({
      data: {
        slug,
        parentId: parsed.data.parentId || null,
        isActive: true,
        translations: { create: [{ locale: "tr", name }] },
      },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    return { ok: true, id: created.id, name };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "Bu isimde bir kategori zaten var." };
    }
    return { ok: false, error: err instanceof Error ? err.message : "CREATE_FAILED" };
  }
}
