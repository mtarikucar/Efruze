import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { AppLocale } from "@/i18n/routing";
import type { EventDTO } from "@/server/types/event";

const eventInclude = {
  translations: true,
} satisfies Prisma.EventInclude;

type EventRow = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

function pickTr<T extends { locale: string }>(rows: T[], locale: AppLocale): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "tr") ?? rows[0];
}

function toDTO(row: EventRow, locale: AppLocale): EventDTO {
  const tr = pickTr(row.translations, locale);
  return {
    id: row.id,
    slug: row.slug,
    date: row.date.toISOString(),
    kind: row.kind,
    imageUrl: row.imageUrl,
    priceText: row.priceText,
    ctaUrl: row.ctaUrl,
    isPublished: row.isPublished,
    tag: tr?.tag ?? "",
    title: tr?.title ?? row.slug,
    description: tr?.description ?? "",
    meta: tr?.meta ?? "",
    ctaLabel: tr?.ctaLabel ?? "→",
  };
}

export const EventService = {
  /** Upcoming events (date >= now), sorted ascending. */
  async listUpcoming(locale: AppLocale, take?: number): Promise<EventDTO[]> {
    const rows = await prisma.event.findMany({
      where: { isPublished: true, date: { gte: new Date() } },
      orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
      take,
      include: eventInclude,
    });
    return rows.map((r) => toDTO(r, locale));
  },

  /** Every published event, regardless of date — useful for /events archive view. */
  async listAll(locale: AppLocale): Promise<EventDTO[]> {
    const rows = await prisma.event.findMany({
      where: { isPublished: true },
      orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
      include: eventInclude,
    });
    return rows.map((r) => toDTO(r, locale));
  },

  async getBySlug(slug: string, locale: AppLocale): Promise<EventDTO | null> {
    const row = await prisma.event.findFirst({
      where: { slug, isPublished: true },
      include: eventInclude,
    });
    return row ? toDTO(row, locale) : null;
  },
};
