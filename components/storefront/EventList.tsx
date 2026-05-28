import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatEventDate } from "@/lib/format";
import { safeListUpcomingEvents } from "@/server/services/catalog";
import type { AppLocale } from "@/i18n/routing";

/**
 * Homepage events section — pulls the top 3 upcoming events from the DB
 * (admin-managed via /admin/events). Falls back to mock data when the DB
 * is empty or unreachable.
 */
export async function EventList() {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("home.events");
  const events = await safeListUpcomingEvents(locale, 3);

  if (events.length === 0) return null;

  return (
    <section className="section-frame relative z-[2]" id="events">
      <header className="mb-16 flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
            <span className="mr-1.5 text-gold">III —</span> {t("eyebrow")}
          </div>
          <h2
            className="serif-display m-0 font-serif font-light text-ink"
            style={{ fontSize: "clamp(36px, 5.4vw, 68px)", lineHeight: 1.02 }}
          >
            {t("title")}
            <br />
            {t("titleSuffix")}
          </h2>
        </div>
        <Link href="/events" className="link-underline">
          {t("allUpcoming")}
        </Link>
      </header>

      <div className="flex flex-col border-t border-line">
        {events.map((ev) => {
          const d = formatEventDate(new Date(ev.date));
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
                <div className="font-caps text-[10px] uppercase tracking-[0.28em] text-gold">
                  {ev.tag}
                </div>
                <h3
                  className="m-0 font-serif font-normal leading-tight tracking-[-0.005em] text-ink"
                  style={{ fontSize: "clamp(24px, 2.4vw, 32px)" }}
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
    </section>
  );
}
