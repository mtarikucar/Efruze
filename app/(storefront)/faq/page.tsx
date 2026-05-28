import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { StaticPageHeader } from "@/components/storefront/StaticPageHeader";
import { safeListFaq } from "@/server/services/catalog";
import type { AppLocale } from "@/i18n/routing";

export const metadata: Metadata = { title: "SSS · efruze" };

const heading = { eyebrow: "SSS", title: "Sıkça sorulan", titleEm: "sorular." } as const;

export default async function FaqPage() {
  const locale = (await getLocale()) as AppLocale;
  const h = heading;
  const items = await safeListFaq(locale);

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      <StaticPageHeader eyebrow={h.eyebrow} title={h.title} titleEm={h.titleEm} />

      <div className="mx-auto max-w-3xl">
        {items.length === 0 ? (
          <p className="font-serif italic text-ink-2">
            Henüz soru yok.
          </p>
        ) : (
          <dl className="m-0 flex flex-col">
            {items.map((it) => (
              <div key={it.id} className="border-t border-line py-6 last:border-b">
                <dt className="font-serif text-xl text-ink">{it.question}</dt>
                <dd className="m-0 mt-2 font-serif text-base leading-relaxed text-ink-2">
                  {it.answer}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
