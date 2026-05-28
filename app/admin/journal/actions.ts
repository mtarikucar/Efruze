"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";
import { journalInputSchema } from "@/server/types/journal";
import { slugify } from "@/lib/slug";

type Result = { ok: false; error: string };

export async function createJournalAction(raw: unknown): Promise<Result | void> {
  await requireAdmin();
  const parsed = journalInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  const i = parsed.data;
  const trTitle = i.translations.find((t) => t.locale === "tr")?.title ?? "";
  const slug = (i.slug || slugify(trTitle)) || `entry-${Date.now()}`;
  let createdId: string;
  try {
    const created = await prisma.journalEntry.create({
      data: {
        slug,
        date: new Date(i.date),
        imageUrl: i.imageUrl || null,
        featured: i.featured,
        readMinutes: i.readMinutes,
        isPublished: i.isPublished,
        sortOrder: i.sortOrder,
        publishedAt: i.isPublished ? new Date() : null,
        translations: {
          create: i.translations.map((t) => ({
            locale: t.locale,
            category: t.category,
            title: t.title,
            excerpt: t.excerpt,
            body: t.body,
          })),
        },
      },
    });
    createdId = created.id;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "CREATE_FAILED" };
  }
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  redirect(`/admin/journal/${createdId}`);
}

export async function updateJournalAction(raw: unknown & { id: string }): Promise<Result | void> {
  await requireAdmin();
  if (!raw || typeof raw !== "object" || !("id" in raw)) return { ok: false, error: "MISSING_ID" };
  const id = (raw as { id: string }).id;
  const parsed = journalInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  const i = parsed.data;
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.journalEntry.findUniqueOrThrow({ where: { id } });
      const slug = i.slug || existing.slug;
      await tx.journalEntry.update({
        where: { id },
        data: {
          slug,
          date: new Date(i.date),
          imageUrl: i.imageUrl || null,
          featured: i.featured,
          readMinutes: i.readMinutes,
          isPublished: i.isPublished,
          sortOrder: i.sortOrder,
          publishedAt: i.isPublished ? (existing.publishedAt ?? new Date()) : null,
        },
      });
      await tx.journalEntryTranslation.deleteMany({ where: { entryId: id } });
      await tx.journalEntryTranslation.createMany({
        data: i.translations.map((t) => ({
          entryId: id,
          locale: t.locale,
          category: t.category,
          title: t.title,
          excerpt: t.excerpt,
          body: t.body,
        })),
      });
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "UPDATE_FAILED" };
  }
  revalidatePath("/admin/journal");
  revalidatePath(`/admin/journal/${id}`);
  revalidatePath("/journal");
}

export async function deleteJournalAction(raw: unknown): Promise<Result | void> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  try {
    await prisma.journalEntry.update({
      where: { id: parsed.data.id },
      data: { deletedAt: new Date(), isPublished: false },
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "DELETE_FAILED" };
  }
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
}
