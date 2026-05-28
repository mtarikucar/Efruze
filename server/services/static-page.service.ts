import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { AppLocale } from "@/i18n/routing";
import type { StaticPageDTO } from "@/server/types/static-page";

const pageInclude = {
  translations: true,
} satisfies Prisma.StaticPageInclude;

type Row = Prisma.StaticPageGetPayload<{ include: typeof pageInclude }>;

function pickTr<T extends { locale: string }>(rows: T[], locale: AppLocale): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "tr") ?? rows[0];
}

function toDTO(row: Row, locale: AppLocale): StaticPageDTO {
  const tr = pickTr(row.translations, locale);
  return {
    id: row.id,
    slug: row.slug,
    isActive: row.isActive,
    title: tr?.title ?? row.slug,
    intro: tr?.intro ?? null,
    body: tr?.body ?? "",
  };
}

export const StaticPageService = {
  async getBySlug(slug: string, locale: AppLocale): Promise<StaticPageDTO | null> {
    const row = await prisma.staticPage.findFirst({
      where: { slug, isActive: true },
      include: pageInclude,
    });
    return row ? toDTO(row, locale) : null;
  },
};
