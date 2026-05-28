import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { PageHeader } from "@/components/admin/primitives";
import { MaisonEditor, type MaisonEditorInitial } from "@/components/admin/MaisonEditor";
import {
  mockMaisonStepsSeedData,
  mockMaisonArtisansSeedData,
  mockMaisonIntroSeedData,
} from "@/lib/mock-maison";

export const metadata: Metadata = { title: "Maison · yönetim" };

function locText<T extends { locale: string }>(rows: T[], locale: "tr" | "en"): T | undefined {
  return rows.find((r) => r.locale === locale);
}

export default async function AdminMaisonPage() {
  let initial: MaisonEditorInitial = {
    heroImageUrl: "/ebru-detail.png",
    introTr: mockMaisonIntroSeedData.tr,
    steps: mockMaisonStepsSeedData.map((s) => ({
      sortOrder: s.sortOrder,
      isActive: true,
      tr: { title: s.title.tr, description: s.description.tr },
    })),
    artisans: mockMaisonArtisansSeedData.map((a) => ({
      sortOrder: a.sortOrder,
      isActive: true,
      imageUrl: a.imageUrl ?? "",
      tr: { name: a.name.tr, role: a.role.tr, bio: a.bio.tr },
    })),
  };

  try {
    const [settings, steps, artisans] = await Promise.all([
      prisma.storeSettings.findUnique({ where: { id: "singleton" } }),
      prisma.maisonStep.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { translations: true },
      }),
      prisma.maisonArtisan.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { translations: true },
      }),
    ]);

    if (settings) {
      initial.heroImageUrl = settings.maisonHeroImageUrl ?? "";
      initial.introTr = settings.maisonIntroTr ?? initial.introTr;
    }

    if (steps.length > 0) {
      initial.steps = steps.map((s) => {
        const tr = locText(s.translations, "tr");
        return {
          sortOrder: s.sortOrder,
          isActive: s.isActive,
          tr: { title: tr?.title ?? "", description: tr?.description ?? "" },
        };
      });
    }

    if (artisans.length > 0) {
      initial.artisans = artisans.map((a) => {
        const tr = locText(a.translations, "tr");
        return {
          sortOrder: a.sortOrder,
          isActive: a.isActive,
          imageUrl: a.imageUrl ?? "",
          tr: { name: tr?.name ?? "", role: tr?.role ?? "", bio: tr?.bio ?? "" },
        };
      });
    }
  } catch {
    /* fall back to mock defaults already in `initial` */
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="İçerik"
        title="Maison sayfası"
        sub="Hero görseli, intro paragrafları, süreç adımları ve zanaatkârlar — hepsi bu sayfada."
      />
      <MaisonEditor initial={initial} />
    </div>
  );
}
