import type { Metadata } from "next";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { StaticPageHeader } from "@/components/storefront/StaticPageHeader";
import { safeGetMaison } from "@/server/services/catalog";
import type { AppLocale } from "@/i18n/routing";

export const metadata: Metadata = { title: "Maison · efruze" };

const heading = {
  eyebrow: "II — Maison",
  title: "Beş yüzyıllık",
  titleEm: "ebrû,",
  titleSuffix: " iki pencereli bir odada.",
  sub: "Alanya'da küçük bir atölyede, ipek, kağıt, seramik ve camda mermerleme — su, sabır ve nefes.",
  processH: "Süreç",
  artisansH: "Zanaatkârlar",
  imgAlt: "Alanya atölyesi",
} as const;

export default async function MaisonPage() {
  const locale = (await getLocale()) as AppLocale;
  const h = heading;
  const data = await safeGetMaison(locale);
  const introParagraphs = data.intro.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const heroSrc = data.heroImageUrl || "/ebru-detail.png";

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      <StaticPageHeader
        eyebrow={h.eyebrow}
        title={h.title}
        titleEm={h.titleEm}
        titleSuffix={h.titleSuffix}
        sub={h.sub}
      />

      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-bg-deep">
          <Image
            src={heroSrc}
            alt={h.imgAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-5">
          {introParagraphs.length > 0 ? (
            introParagraphs.map((p, i) => (
              <p key={i} className="m-0 max-w-prose font-serif text-lg leading-relaxed text-ink-2">
                {p}
              </p>
            ))
          ) : (
            <p className="m-0 max-w-prose font-serif italic text-ink-mute">
              Maison metni henüz yazılmamış.
            </p>
          )}
        </div>
      </div>

      {data.steps.length > 0 && (
        <section className="mx-auto mt-24 max-w-5xl" id="process">
          <h2
            className="serif-display mb-10 m-0 text-center font-serif font-light text-ink"
            style={{ fontSize: "clamp(28px, 3.6vw, 44px)", lineHeight: 1.04 }}
          >
            {h.processH}
          </h2>
          <ol className="m-0 grid list-none gap-x-12 gap-y-8 p-0 sm:grid-cols-2">
            {data.steps.map((s, i) => (
              <li key={s.id} className="flex flex-col gap-2 border-t border-line pt-5">
                <span className="font-serif italic text-3xl text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-xl text-ink">{s.title}</span>
                <span className="font-serif text-base leading-relaxed text-ink-2">
                  {s.description}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {data.artisans.length > 0 && (
        <section className="mx-auto mt-24 max-w-5xl" id="artisans">
          <h2
            className="serif-display mb-10 m-0 text-center font-serif font-light text-ink"
            style={{ fontSize: "clamp(28px, 3.6vw, 44px)", lineHeight: 1.04 }}
          >
            {h.artisansH}
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {data.artisans.map((a) => (
              <article key={a.id} className="flex flex-col gap-2 border-t border-line pt-5">
                {a.imageUrl && (
                  <div className="relative mb-2 aspect-[4/5] overflow-hidden rounded-sm bg-bg-deep">
                    <Image
                      src={a.imageUrl}
                      alt={a.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="font-serif text-2xl text-ink">{a.name}</span>
                <span className="font-caps text-[10px] uppercase tracking-[0.28em] text-gold">
                  {a.role}
                </span>
                <span className="mt-1 font-serif text-base leading-relaxed text-ink-2">{a.bio}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
