import type { Metadata } from "next";
import Image from "next/image";
import { StaticPageHeader } from "@/components/storefront/StaticPageHeader";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { title: "Günce · efruze" };

type Entry = {
  id: string;
  date: Date;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  imageHint: string;
  featured?: boolean;
};

const entries: Entry[] = [
  {
    id: "su-ustune",
    date: new Date("2026-05-20"),
    category: "Atölyeden",
    title: "Su üstüne — ebrunun beş yüzyıllık tarihi",
    excerpt:
      "Selçuklu medreselerinden Topkapı sarayına, ebru ustası eline aldığı kamış kalemle bir okyanus çizer. Aynı suyun üzerinde iki kez aynı desen oluşmaz. Bu yüzden hatip ebrusunun her örneği imzalıdır — tekil olduğu için.",
    readTime: "6 dk",
    imageHint: "ebru-1",
    featured: true,
  },
  {
    id: "selma-h",
    date: new Date("2026-05-12"),
    category: "Zanaatkâr portresi",
    title: "Zehra Aydın — yirmi yıl bir tepsi başında",
    excerpt:
      "Alanya'daki atölyemizin mermerleyici ustası Zehra Aydın, Anadolu Süsleme Sanatları geleneğinde yetişti. Üç çocuk büyüttü, on yedi sergi açtı, sayısız ipeği imzaladı. Bu hafta tepsi başında yarım gün geçirdik.",
    readTime: "8 dk",
    imageHint: "ebru-2",
  },
  {
    id: "iznik-mavi",
    date: new Date("2026-05-03"),
    category: "Renkler",
    title: "İznik mavisi — bir rengin coğrafyası",
    excerpt:
      "Kobalt değil, lapis değil, ama biraz ikisinden de. İznik çinilerinin o derin mavisi, 16. yüzyılda bulundu ve hiçbir başka yerde tekrarlanamadı. Çömlekçimiz İrem ile İznik'te bir gün.",
    readTime: "5 dk",
    imageHint: "ebru-3",
  },
  {
    id: "hattat",
    date: new Date("2026-04-22"),
    category: "Hat sanatı",
    title: "Hattat — bir kamış kalemin doğuşu",
    excerpt:
      "İyi bir kamış kalem üç yılda yetişir. Şişli'deki dükkândan ödünç aldığımız kamışları, Hüseyin A. ustamızın elinden geçiriyoruz. Eğri kesim, yumuşak bir hareket — sonra bir mürekkep damlası, ve harf doğar.",
    readTime: "7 dk",
    imageHint: "ebru-4",
  },
  {
    id: "ipek-kumas",
    date: new Date("2026-04-10"),
    category: "Malzeme",
    title: "İpek kumaş — Bursa'dan tepsiye",
    excerpt:
      "Habotai ipeğimizi Bursa'da küçük bir aile dokuyor. Hafif, akışkan, suyu kabul ediyor. Renk almaya hazır olduğunda elimize geliyor — geri kalanı su, pigment ve nefes.",
    readTime: "4 dk",
    imageHint: "ebru-5",
  },
  {
    id: "mart-ayi",
    date: new Date("2026-03-15"),
    category: "Mektup",
    title: "Mart — denizde bir rüzgâr ve yeni başlangıçlar",
    excerpt:
      "Atölyenin penceresinden bakınca, mart'ta deniz başka türlü görünüyor. Su soğuk ama renkler ısınıyor. Bu ay tepsiye ne koyduk, ne çıktı — ve bahara nasıl hazırlanıyoruz.",
    readTime: "3 dk",
    imageHint: "ebru-6",
  },
];

const copy = {
  eyebrow: "IV — Günce",
  title: "Atölyeden",
  titleEm: "küçük yazılar.",
  sub: "Ayda bir, bazen daha sık. Renkler, ustalar, malzemeler ve süreç hakkında.",
  featured: "Bu hafta",
  archive: "Arşiv",
  readMore: "Devamını oku →",
} as const;

export default async function JournalPage() {
  const c = copy;

  const featured = entries.find((e) => e.featured) ?? entries[0];
  const rest = entries.filter((e) => e.id !== featured.id);

  const localised = (e: Entry) => ({
    category: e.category,
    title: e.title,
    excerpt: e.excerpt,
    readTime: e.readTime,
  });

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      <StaticPageHeader eyebrow={c.eyebrow} title={c.title} titleEm={c.titleEm} sub={c.sub} />

      <div className="mx-auto max-w-5xl">
        {/* Featured entry */}
        <article className="mb-16 grid grid-cols-1 gap-10 border-b border-line pb-16 md:grid-cols-[1.1fr_1fr]">
          <div className="relative aspect-[5/4] overflow-hidden rounded-sm bg-bg-deep">
            <Image
              src="/ebru-detail.png"
              alt={localised(featured).title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="font-caps text-[10px] uppercase tracking-[0.32em] text-gold">
              {c.featured}
            </div>
            <div className="flex flex-wrap items-baseline gap-3 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
              <span className="text-blue-deep">{localised(featured).category}</span>
              <span>·</span>
              <span>{featured.date.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}</span>
              <span>·</span>
              <span>{localised(featured).readTime}</span>
            </div>
            <h2
              className="serif-display m-0 font-serif font-light text-ink"
              style={{ fontSize: "clamp(28px, 3.6vw, 44px)", lineHeight: 1.1 }}
            >
              {localised(featured).title}
            </h2>
            <p className="m-0 max-w-prose font-serif text-lg leading-relaxed text-ink-2">
              {localised(featured).excerpt}
            </p>
            <div>
              <Link href={"/journal" as never} className="link-underline">
                {c.readMore}
              </Link>
            </div>
          </div>
        </article>

        {/* Archive */}
        <div className="mb-8 font-caps text-[10px] uppercase tracking-[0.32em] text-ink-2">
          <span className="mr-1.5 text-gold">—</span> {c.archive}
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {rest.map((e) => {
            const l = localised(e);
            return (
              <article
                key={e.id}
                className="group flex flex-col gap-3 border-t border-line pt-6"
              >
                <div className="flex flex-wrap items-baseline gap-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  <span className="text-blue-deep">{l.category}</span>
                  <span>·</span>
                  <span>{e.date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <span>·</span>
                  <span>{l.readTime}</span>
                </div>
                <h3
                  className="m-0 font-serif font-light tracking-[-0.005em] text-ink"
                  style={{ fontSize: "clamp(20px, 2.2vw, 26px)", lineHeight: 1.2 }}
                >
                  {l.title}
                </h3>
                <p className="m-0 font-serif text-base leading-relaxed text-ink-2 line-clamp-3">
                  {l.excerpt}
                </p>
                <div className="mt-1">
                  <Link href={"/journal" as never} className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline">
                    {c.readMore}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
