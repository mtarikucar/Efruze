import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { AppLocale } from "@/i18n/routing";
import type { JournalEntryDTO } from "@/server/types/journal";

const journalInclude = {
  translations: true,
} satisfies Prisma.JournalEntryInclude;

type EntryRow = Prisma.JournalEntryGetPayload<{ include: typeof journalInclude }>;

function pickTr<T extends { locale: string }>(rows: T[], locale: AppLocale): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "tr") ?? rows[0];
}

function toDTO(row: EntryRow, locale: AppLocale): JournalEntryDTO {
  const tr = pickTr(row.translations, locale);
  return {
    id: row.id,
    slug: row.slug,
    date: row.date.toISOString(),
    imageUrl: row.imageUrl,
    featured: row.featured,
    readMinutes: row.readMinutes,
    isPublished: row.isPublished,
    category: tr?.category ?? "",
    title: tr?.title ?? row.slug,
    excerpt: tr?.excerpt ?? "",
    body: tr?.body ?? "",
  };
}

export const JournalService = {
  async listAll(locale: AppLocale): Promise<JournalEntryDTO[]> {
    const rows = await prisma.journalEntry.findMany({
      where: { isPublished: true },
      orderBy: [{ featured: "desc" }, { date: "desc" }],
      include: journalInclude,
    });
    return rows.map((r) => toDTO(r, locale));
  },

  async getBySlug(slug: string, locale: AppLocale): Promise<JournalEntryDTO | null> {
    const row = await prisma.journalEntry.findFirst({
      where: { slug, isPublished: true },
      include: journalInclude,
    });
    return row ? toDTO(row, locale) : null;
  },
};
