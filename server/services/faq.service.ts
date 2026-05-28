import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { AppLocale } from "@/i18n/routing";
import type { FaqItemDTO } from "@/server/types/faq";

const faqInclude = {
  translations: true,
} satisfies Prisma.FaqItemInclude;

type Row = Prisma.FaqItemGetPayload<{ include: typeof faqInclude }>;

function pickTr<T extends { locale: string }>(rows: T[], locale: AppLocale): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "tr") ?? rows[0];
}

function toDTO(row: Row, locale: AppLocale): FaqItemDTO {
  const tr = pickTr(row.translations, locale);
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    question: tr?.question ?? "",
    answer: tr?.answer ?? "",
  };
}

export const FaqService = {
  async listActive(locale: AppLocale): Promise<FaqItemDTO[]> {
    const rows = await prisma.faqItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: faqInclude,
    });
    return rows.map((r) => toDTO(r, locale));
  },
};
