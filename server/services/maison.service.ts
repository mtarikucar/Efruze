import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { AppLocale } from "@/i18n/routing";
import type {
  MaisonContentDTO,
  MaisonStepDTO,
  MaisonArtisanDTO,
} from "@/server/types/maison";

const stepInclude = { translations: true } satisfies Prisma.MaisonStepInclude;
type StepRow = Prisma.MaisonStepGetPayload<{ include: typeof stepInclude }>;

const artisanInclude = { translations: true } satisfies Prisma.MaisonArtisanInclude;
type ArtisanRow = Prisma.MaisonArtisanGetPayload<{ include: typeof artisanInclude }>;

function pickTr<T extends { locale: string }>(rows: T[], locale: AppLocale): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "tr") ?? rows[0];
}

function stepToDTO(row: StepRow, locale: AppLocale): MaisonStepDTO {
  const tr = pickTr(row.translations, locale);
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    title: tr?.title ?? "",
    description: tr?.description ?? "",
  };
}

function artisanToDTO(row: ArtisanRow, locale: AppLocale): MaisonArtisanDTO {
  const tr = pickTr(row.translations, locale);
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    imageUrl: row.imageUrl,
    name: tr?.name ?? "",
    role: tr?.role ?? "",
    bio: tr?.bio ?? "",
  };
}

export const MaisonService = {
  async listSteps(locale: AppLocale): Promise<MaisonStepDTO[]> {
    const rows = await prisma.maisonStep.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: stepInclude,
    });
    return rows.map((r) => stepToDTO(r, locale));
  },

  async listAllSteps(locale: AppLocale): Promise<MaisonStepDTO[]> {
    const rows = await prisma.maisonStep.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: stepInclude,
    });
    return rows.map((r) => stepToDTO(r, locale));
  },

  async listArtisans(locale: AppLocale): Promise<MaisonArtisanDTO[]> {
    const rows = await prisma.maisonArtisan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: artisanInclude,
    });
    return rows.map((r) => artisanToDTO(r, locale));
  },

  async listAllArtisans(locale: AppLocale): Promise<MaisonArtisanDTO[]> {
    const rows = await prisma.maisonArtisan.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: artisanInclude,
    });
    return rows.map((r) => artisanToDTO(r, locale));
  },

  async getContent(locale: AppLocale): Promise<MaisonContentDTO> {
    const [settings, steps, artisans] = await Promise.all([
      prisma.storeSettings.findUnique({ where: { id: "singleton" } }),
      MaisonService.listSteps(locale),
      MaisonService.listArtisans(locale),
    ]);
    const intro = settings?.maisonIntroTr ?? "";
    return {
      heroImageUrl: settings?.maisonHeroImageUrl ?? null,
      intro,
      steps,
      artisans,
    };
  },
};
