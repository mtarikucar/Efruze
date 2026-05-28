"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";
import {
  maisonStepInputSchema,
  maisonArtisanInputSchema,
} from "@/server/types/maison";

const maisonPagePayloadSchema = z.object({
  heroImageUrl: z.string().optional().or(z.literal("")),
  introTr: z.string().max(20_000),
  introEn: z.string().max(20_000),
  steps: z.array(maisonStepInputSchema).max(20),
  artisans: z.array(maisonArtisanInputSchema).max(20),
});

export async function updateMaisonAction(raw: unknown) {
  await requireAdmin();
  const parsed = maisonPagePayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "INVALID" };
  }
  const p = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. settings (intro + hero) via upsert with required fields filled from existing row.
      const existing = await tx.storeSettings.findUnique({ where: { id: "singleton" } });
      if (existing) {
        await tx.storeSettings.update({
          where: { id: "singleton" },
          data: {
            maisonHeroImageUrl: p.heroImageUrl || null,
            maisonIntroTr: p.introTr || null,
            maisonIntroEn: p.introEn || null,
          },
        });
      } else {
        await tx.storeSettings.create({
          data: {
            id: "singleton",
            brandName: "efruze",
            tagline: { tr: "Su üstüne çizilen", en: "Drawn upon water" } as Prisma.InputJsonValue,
            contactEmail: "atelier@efruze.com",
            maisonHeroImageUrl: p.heroImageUrl || null,
            maisonIntroTr: p.introTr || null,
            maisonIntroEn: p.introEn || null,
          },
        });
      }

      // 2. steps: full wipe + recreate (translation children also dropped via cascade).
      await tx.maisonStep.deleteMany({});
      for (const s of p.steps) {
        await tx.maisonStep.create({
          data: {
            sortOrder: s.sortOrder,
            isActive: s.isActive,
            translations: {
              create: s.translations.map((t) => ({
                locale: t.locale,
                title: t.title,
                description: t.description,
              })),
            },
          },
        });
      }

      // 3. artisans: same recreate strategy.
      await tx.maisonArtisan.deleteMany({});
      for (const a of p.artisans) {
        await tx.maisonArtisan.create({
          data: {
            sortOrder: a.sortOrder,
            isActive: a.isActive,
            imageUrl: a.imageUrl || null,
            translations: {
              create: a.translations.map((t) => ({
                locale: t.locale,
                name: t.name,
                role: t.role,
                bio: t.bio,
              })),
            },
          },
        });
      }
    });
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "UPDATE_FAILED" };
  }

  revalidatePath("/admin/maison");
  revalidatePath("/maison");
  return { ok: true as const };
}
