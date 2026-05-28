import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { StaticPageHeader } from "@/components/storefront/StaticPageHeader";
import { Link } from "@/i18n/navigation";
import { formatEventDate } from "@/lib/format";
import { safeListAllEvents } from "@/server/services/catalog";
import type { AppLocale } from "@/i18n/routing";
import type { EventKind } from "@prisma/client";

export const metadata: Metadata = { title: "Etkinlikler · Events · efruze" };

const kindStyles: Record<EventKind, { label: string; accent: string }> = {
  WORKSHOP: { label: "Atölye", accent: "text-gold" },
  DROP: { label: "Koleksiyon", accent: "text-blue-deep" },
  EXHIBITION: { label: "Sergi", accent: "text-gold" },
  VISIT: { label: "Ziyaret", accent: "text-ink-2" },
  OTHER: { label: "Diğer", accent: "text-ink-2" },
};

const copy = {
  eyebrow: "III — Atölye Günlüğü",
  title: "Atölyeler, açılışlar,",
  titleEm: "ve sessiz öğleden sonralar.",
  sub: "Yaklaşan etkinliklerin tamamı. Yer sınırlı atölyeler için rezervasyon e-postayla onaylanır.",
  sectionUpcoming: "Yaklaşan",
  empty: "Yakında yeni etkinlikler eklenecek.",
} as const;

export default async function EventsPage() {
  const locale = (await getLocale()) as AppLocale;
  const c = copy;
  const events = await safeListAllEvents(locale);

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      <StaticPageHeader eyebrow={c.eyebrow} title={c.title} titleEm={c.titleEm} sub={c.sub} />

      <div className="mx-auto max-w-4xl">
        <div className="mb-6 font-caps text-[10px] uppercase tracking-[0.32em] text-ink-2">
          <span className="mr-1.5 text-gold">—</span> {c.sectionUpcoming}
        </div>
        {events.length === 0 ? (
          <p className="font-serif italic text-lg text-ink-2">{c.empty}</p>
        ) : (
          <div className="flex flex-col border-t border-line">
            {events.map((ev) => {
              const d = formatEventDate(new Date(ev.date));
              const ks = kindStyles[ev.kind];
              const kindLabel = ks.label;
              return (
                <article
                  key={ev.id}
                  className="grid grid-cols-[80px_1fr] items-start gap-6 border-b border-line py-9 transition-all duration-300 hover:bg-bg-deep/40 md:grid-cols-[160px_1fr] md:gap-12 hover:px-4"
                >
                  <div className="flex flex-col items-start gap-0.5 font-serif text-ink">
                    <span className="font-caps text-[11px] uppercase tracking-[0.32em] text-blue-deep">
                      {d.month}
                    </span>
                    <span
                      className="font-light leading-none tracking-[-0.02em]"
                      style={{ fontSize: "clamp(44px, 5vw, 64px)" }}
                    >
                      {d.day}
                    </span>
                    <span className="font-serif italic text-lg text-ink-mute">{d.year}</span>
                  </div>

                  <div className="flex max-w-[720px] flex-col gap-2">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className={`font-caps text-[10px] uppercase tracking-[0.28em] ${ks.accent}`}>
                        {kindLabel}
                      </span>
                      <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                        · {ev.tag}
                      </span>
                    </div>
                    <h3
                      className="m-0 font-serif font-normal leading-tight tracking-[-0.005em] text-ink"
                      style={{ fontSize: "clamp(22px, 2.4vw, 30px)" }}
                    >
                      {ev.title}
                    </h3>
                    <p className="m-0 max-w-[60ch] font-serif text-base leading-relaxed text-ink-2">
                      {ev.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-6">
                      <span className="font-caps text-[11px] uppercase tracking-[0.22em] text-ink-mute">
                        {ev.meta}
                      </span>
                      {ev.priceText && (
                        <span className="ml-auto font-serif text-xl font-medium text-ink">
                          {ev.priceText}
                        </span>
                      )}
                      <Link
                        href={ev.ctaUrl as never}
                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-ink bg-ink px-4 py-2.5 font-caps text-[10px] uppercase tracking-[0.2em] text-bg transition hover:bg-ink-2"
                      >
                        {ev.ctaLabel}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
