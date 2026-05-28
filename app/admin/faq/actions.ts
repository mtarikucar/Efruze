"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";
import { faqInputSchema } from "@/server/types/faq";

type Result = { ok: false; error: string };

function bustCaches() {
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function createFaqAction(raw: unknown): Promise<Result | void> {
  await requireAdmin();
  const parsed = faqInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  const i = parsed.data;
  let createdId: string;
  try {
    const created = await prisma.faqItem.create({
      data: {
        sortOrder: i.sortOrder,
        isActive: i.isActive,
        translations: {
          create: i.translations.map((t) => ({
            locale: t.locale,
            question: t.question,
            answer: t.answer,
          })),
        },
      },
    });
    createdId = created.id;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "CREATE_FAILED" };
  }
  bustCaches();
  redirect(`/admin/faq/${createdId}`);
}

export async function updateFaqAction(
  raw: unknown & { id: string },
): Promise<Result | void> {
  await requireAdmin();
  if (!raw || typeof raw !== "object" || !("id" in raw)) return { ok: false, error: "MISSING_ID" };
  const id = (raw as { id: string }).id;
  const parsed = faqInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  const i = parsed.data;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.faqItem.update({
        where: { id },
        data: { sortOrder: i.sortOrder, isActive: i.isActive },
      });
      await tx.faqItemTranslation.deleteMany({ where: { itemId: id } });
      await tx.faqItemTranslation.createMany({
        data: i.translations.map((t) => ({
          itemId: id,
          locale: t.locale,
          question: t.question,
          answer: t.answer,
        })),
      });
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "UPDATE_FAILED" };
  }
  bustCaches();
  revalidatePath(`/admin/faq/${id}`);
}

export async function deleteFaqAction(raw: unknown): Promise<Result | void> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  try {
    await prisma.faqItem.delete({ where: { id: parsed.data.id } });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "DELETE_FAILED" };
  }
  bustCaches();
}
