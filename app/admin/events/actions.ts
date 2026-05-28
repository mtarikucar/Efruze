"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";
import { eventInputSchema } from "@/server/types/event";
import { slugify } from "@/lib/slug";

type Result = { ok: false; error: string };

export async function createEventAction(raw: unknown): Promise<Result | void> {
  await requireAdmin();
  const parsed = eventInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  const i = parsed.data;
  const trTitle = i.translations.find((t) => t.locale === "tr")?.title ?? "";
  const slug = (i.slug || slugify(trTitle)) || `event-${Date.now()}`;
  let createdId: string;
  try {
    const created = await prisma.event.create({
      data: {
        slug,
        date: new Date(i.date),
        kind: i.kind,
        imageUrl: i.imageUrl || null,
        priceText: i.priceText || null,
        ctaUrl: i.ctaUrl,
        isPublished: i.isPublished,
        sortOrder: i.sortOrder,
        publishedAt: i.isPublished ? new Date() : null,
        translations: {
          create: i.translations.map((t) => ({
            locale: t.locale,
            tag: t.tag,
            title: t.title,
            description: t.description,
            meta: t.meta,
            ctaLabel: t.ctaLabel,
          })),
        },
      },
    });
    createdId = created.id;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "CREATE_FAILED" };
  }
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  redirect(`/admin/events/${createdId}`);
}

export async function updateEventAction(raw: unknown & { id: string }): Promise<Result | void> {
  await requireAdmin();
  if (!raw || typeof raw !== "object" || !("id" in raw)) return { ok: false, error: "MISSING_ID" };
  const id = (raw as { id: string }).id;
  const parsed = eventInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  const i = parsed.data;
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.event.findUniqueOrThrow({ where: { id } });
      const slug = i.slug || existing.slug;
      await tx.event.update({
        where: { id },
        data: {
          slug,
          date: new Date(i.date),
          kind: i.kind,
          imageUrl: i.imageUrl || null,
          priceText: i.priceText || null,
          ctaUrl: i.ctaUrl,
          isPublished: i.isPublished,
          sortOrder: i.sortOrder,
          publishedAt: i.isPublished ? (existing.publishedAt ?? new Date()) : null,
        },
      });
      await tx.eventTranslation.deleteMany({ where: { eventId: id } });
      await tx.eventTranslation.createMany({
        data: i.translations.map((t) => ({
          eventId: id,
          locale: t.locale,
          tag: t.tag,
          title: t.title,
          description: t.description,
          meta: t.meta,
          ctaLabel: t.ctaLabel,
        })),
      });
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "UPDATE_FAILED" };
  }
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/events");
  revalidatePath("/");
}

export async function deleteEventAction(raw: unknown): Promise<Result | void> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  try {
    await prisma.event.update({
      where: { id: parsed.data.id },
      data: { deletedAt: new Date(), isPublished: false },
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "DELETE_FAILED" };
  }
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
}
