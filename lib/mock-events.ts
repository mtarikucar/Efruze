import type { EventDTO } from "@/server/types/event";
import type { AppLocale } from "@/i18n/routing";

type Loc<T> = { tr: T; en?: T }; // EN kept as optional so legacy seed data still parses; runtime reads tr only.
type MockSeed = {
  id: string;
  slug: string;
  date: string;
  kind: EventDTO["kind"];
  priceText: string | null;
  ctaUrl: string;
  tag: Loc<string>;
  title: Loc<string>;
  description: Loc<string>;
  meta: Loc<string>;
  ctaLabel: Loc<string>;
};

const mock: MockSeed[] = [
  {
    id: "mock-ebru-jun14",
    slug: "ebru-baslangic-jun14",
    date: "2026-06-14T14:00:00+03:00",
    kind: "WORKSHOP",
    priceText: "₺ 1,800",
    ctaUrl: "/contact",
    tag: { tr: "Atölye · 8 kişi sınırlı", en: "Workshop · 8 seats only" },
    title: {
      tr: "Ebrû başlangıç — bir öğleden sonra tepside",
      en: "Ebrû for beginners — an afternoon at the tray",
    },
    description: {
      tr: "Alanya atölyemizde mermerleyici Zehra Aydın ile üç saat. Çay, simit ve eve götürmen için bir ipek kare.",
      en: "Three hours with master marbler Zehra Aydın in our Alanya atelier. Tea, simit, and a silk square to take home.",
    },
    meta: { tr: "Cmt, 14.06 · 14:00–17:00 · Alanya", en: "Sat, 14.06 · 14:00–17:00 · Alanya" },
    ctaLabel: { tr: "Yer ayır", en: "Reserve seat" },
  },
  {
    id: "mock-sular-jun21",
    slug: "sular-yaz-koleksiyonu",
    date: "2026-06-21T12:00:00+03:00",
    kind: "DROP",
    priceText: null,
    ctaUrl: "/#journal",
    tag: { tr: "Koleksiyon · Gündönümü", en: "Collection drop · Solstice" },
    title: { tr: '"Sular" — Yaz Koleksiyonu, online ve atölyede', en: '"Sular" — Summer Drop, online & in-atelier' },
    description: {
      tr: "On iki yeni ipek, altı seramik ve mermerli kırtasiye. Üyeler 10:00'da, kamu erişimi 12:00 TRT.",
      en: "Twelve new silks, six ceramics and a small run of marbled stationery. Members preview at 10:00, public release at 12:00 TRT.",
    },
    meta: { tr: "Paz, 21.06 · 12:00 TRT · Online + Alanya", en: "Sun, 21.06 · 12:00 TRT · Online + Alanya" },
    ctaLabel: { tr: "Bana haber ver", en: "Notify me" },
  },
  {
    id: "mock-pigments-jun28",
    slug: "anadolu-pigmentleri",
    date: "2026-06-28T18:00:00+03:00",
    kind: "EXHIBITION",
    priceText: "RSVP",
    ctaUrl: "/contact",
    tag: { tr: "Sergi · Alanya", en: "Exhibition · Alanya" },
    title: { tr: "Anadolu Pigmentleri — küçük bir sergi", en: "Anatolian Pigments — a small exhibition" },
    description: {
      tr: "Pigment arşivimizden orijinal işler, mermerleyici ile sohbet eşliğinde. 19 Temmuz'a kadar Alanya Galerisi.",
      en: "Original works from our pigment archive, opened with the marbler in conversation. Through 19 July, Alanya Gallery.",
    },
    meta: { tr: "28.06 – 19.07 · Alanya Galerisi · Ücretsiz", en: "28.06 – 19.07 · Alanya Gallery · Free entry" },
    ctaLabel: { tr: "Açılış için RSVP", en: "RSVP opening" },
  },
  {
    id: "mock-kagit-jul05",
    slug: "marbleli-kagit-jul05",
    date: "2026-07-05T13:00:00+03:00",
    kind: "WORKSHOP",
    priceText: "₺ 2,200",
    ctaUrl: "/contact",
    tag: { tr: "Atölye · 6 kişi sınırlı", en: "Workshop · 6 seats only" },
    title: { tr: "Marbleli kağıt — kendi defterini cilt et", en: "Marbled paper — bind your own journal" },
    description: {
      tr: "Dört saatlik bir öğleden sonra. Kağıdı sen mermerleyeceksin, sonra kapağa cilt edeceğiz. A6 deri defterle dön.",
      en: "Four hours. You marble the paper, then we bind it onto the cover. Leave with an A6 leather journal.",
    },
    meta: { tr: "Paz, 05.07 · 13:00–17:00 · Alanya", en: "Sun, 05.07 · 13:00–17:00 · Alanya" },
    ctaLabel: { tr: "Yer ayır", en: "Reserve seat" },
  },
  {
    id: "mock-visit-jul",
    slug: "atolye-ziyareti",
    date: "2026-07-12T11:00:00+03:00",
    kind: "VISIT",
    priceText: "Ücretsiz",
    ctaUrl: "/contact",
    tag: { tr: "Atölye ziyareti · randevulu", en: "Atelier visit · by appointment" },
    title: { tr: "Alanya'da bir saat — atölye ziyareti", en: "An hour in Alanya — atelier visit" },
    description: {
      tr: "Atölyeyi gör, tepsiye dokun, çayını iç. Süreci anlatırız. Hediye ya da koleksiyon için seçim yaparsın.",
      en: "See the atelier, touch the tray, sip the tea. We walk you through the process. Choose for a gift or your collection.",
    },
    meta: { tr: "Pzt/Paz · 11:00 veya 16:00 · randevulu", en: "Mon/Sun · 11:00 or 16:00 · by appointment" },
    ctaLabel: { tr: "Randevu al", en: "Book a slot" },
  },
  {
    id: "mock-iznik-aug02",
    slug: "iznik-yeni-vazolar",
    date: "2026-08-02T15:00:00+03:00",
    kind: "DROP",
    priceText: null,
    ctaUrl: "/#journal",
    tag: { tr: "Koleksiyon · Yaz sonu", en: "Collection drop · Late summer" },
    title: { tr: "İznik — sekiz yeni vazo", en: "İznik — eight new vessels" },
    description: {
      tr: "İznik geleneğine selam. Çömlekçimiz İrem'in elinden sekiz yeni parça. Her biri tekildir, imzalanmıştır.",
      en: "A nod to the İznik tradition. Eight new pieces from our kilnsmith İrem. Each unique, each signed.",
    },
    meta: { tr: "Paz, 02.08 · 15:00 TRT · Online", en: "Sun, 02.08 · 15:00 TRT · Online" },
    ctaLabel: { tr: "Bana haber ver", en: "Notify me" },
  },
];

export function mockEvents(locale: AppLocale): EventDTO[] {
  return mock.map((m) => ({
    id: m.id,
    slug: m.slug,
    date: new Date(m.date).toISOString(),
    kind: m.kind,
    imageUrl: null,
    priceText: m.priceText,
    ctaUrl: m.ctaUrl,
    isPublished: true,
    tag: m.tag[locale],
    title: m.title[locale],
    description: m.description[locale],
    meta: m.meta[locale],
    ctaLabel: m.ctaLabel[locale],
  }));
}

export const mockEventsSeedData = mock; // Used by prisma/seed.ts
