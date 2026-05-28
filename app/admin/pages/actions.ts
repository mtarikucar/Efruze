"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";
import { staticPageInputSchema } from "@/server/types/static-page";

type Result = { ok: false; error: string } | { ok: true };

export async function updateStaticPageAction(
  raw: unknown & { id: string },
): Promise<Result> {
  await requireAdmin();
  if (!raw || typeof raw !== "object" || !("id" in raw)) return { ok: false, error: "MISSING_ID" };
  const id = (raw as { id: string }).id;
  const parsed = staticPageInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  const i = parsed.data;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.staticPage.update({
        where: { id },
        data: { slug: i.slug, isActive: i.isActive },
      });
      await tx.staticPageTranslation.deleteMany({ where: { pageId: id } });
      await tx.staticPageTranslation.createMany({
        data: i.translations.map((t) => ({
          pageId: id,
          locale: t.locale,
          title: t.title,
          intro: t.intro || null,
          body: t.body,
        })),
      });
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "UPDATE_FAILED" };
  }
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${id}`);
  revalidatePath(`/${i.slug}`);
  return { ok: true };
}
