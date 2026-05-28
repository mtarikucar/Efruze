import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { StaticPageHeader } from "@/components/storefront/StaticPageHeader";
import { safeGetStaticPage } from "@/server/services/catalog";
import type { AppLocale } from "@/i18n/routing";

export const metadata: Metadata = { title: "Gizlilik · efruze" };

const heading = { eyebrow: "Gizlilik", title: "Gizlilik", titleEm: "politikası." } as const;

export default async function PrivacyPage() {
  const locale = (await getLocale()) as AppLocale;
  const h = heading;
  const page = await safeGetStaticPage("privacy", locale);

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      <StaticPageHeader eyebrow={h.eyebrow} title={h.title} titleEm={h.titleEm} />

      <div className="mx-auto max-w-3xl">
        {page?.intro && (
          <p className="mb-12 rounded-sm border border-gold/30 bg-bg-deep/40 p-5 font-serif italic text-base text-ink-2">
            {page.intro}
          </p>
        )}
        <div className="whitespace-pre-line font-serif text-base leading-relaxed text-ink-2">
          {page?.body ?? "Sayfa bulunamadı."}
        </div>
      </div>
    </section>
  );
}
