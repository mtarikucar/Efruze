/**
 * Mock product DTOs that mirror the seed data, used as a graceful fallback
 * when the database is unreachable (e.g., during local dev before the user
 * configures DATABASE_URL). Keep in sync with prisma/seed.ts.
 */
import type { ProductDTO, ProductDetailDTO } from "@/server/types/product";
import type { AppLocale } from "@/i18n/routing";

type Loc<T> = { tr: T; en?: T };

type MockSeed = {
  id: string;
  slug: string;
  sku: string;
  basePrice: string;
  editionTotal: number | null;
  editionNumber: number | null;
  isFeatured: boolean;
  badge: string | null;
  category: { slug: string; name: Loc<string> };
  name: Loc<string>;
  tagline: Loc<string>;
  description: Loc<string>;
  materials: Loc<string>;
};

const mock: MockSeed[] = [
  {
    id: "mock-firuze",
    slug: "firuze-ipek-esarp",
    sku: "EFR-SILK-014",
    basePrice: "3800.00",
    editionTotal: 12,
    editionNumber: 14,
    isFeatured: true,
    badge: "New · 1 of 12",
    category: { slug: "ipek", name: { tr: "İpek", en: "Silks" } },
    name: {
      tr: '"Firuze" Mermerli İpek Eşarp, 90×90',
      en: '"Firuze" Marbled Silk Scarf, 90×90',
    },
    tagline: {
      tr: "Tek bir daldırmada — krem, mürekkep ve firuze.",
      en: "Marbled in a single immersion — cream, ink, turquoise.",
    },
    description: {
      tr: "Habotai ipek, tek daldırmada mermerlenir. Krem, mürekkep ve firuze tonlarıyla, kenarları elle kıvrılmıştır.",
      en: "Habotai silk, marbled in a single immersion. Cream, ink, and turquoise — finished with hand-rolled hems.",
    },
    materials: {
      tr: "100% habotai ipek · 90×90 cm · elle kıvrılmış kenar",
      en: "100% habotai silk · 90×90 cm · hand-rolled hem",
    },
  },
  {
    id: "mock-su-ustune",
    slug: "su-ustune-ebru-baski",
    sku: "EFR-PRINT-007",
    basePrice: "2400.00",
    editionTotal: 30,
    editionNumber: 7,
    isFeatured: true,
    badge: "Limited · 1/30",
    category: { slug: "baski", name: { tr: "Baskı", en: "Prints" } },
    name: {
      tr: "Su Üstüne, Numaralı Ebru Baskısı",
      en: "Su Üstüne, Numbered Ebru Print",
    },
    tagline: {
      tr: "Bir tepsi durgun su, bir nefes.",
      en: "A tray of still water and a single breath.",
    },
    description: {
      tr: "El yapımı kağıt üzerine numaralı baskı. 30 adetle sınırlı.",
      en: "Numbered print on hand-made paper. Edition of 30.",
    },
    materials: {
      tr: "El yapımı kağıt · 40×60 cm · arşiv mürekkebi",
      en: "Hand-made paper · 40×60 cm · archival ink",
    },
  },
  {
    id: "mock-iznik",
    slug: "iznik-lale-vazo",
    sku: "EFR-CER-021",
    basePrice: "6200.00",
    editionTotal: null,
    editionNumber: 21,
    isFeatured: true,
    badge: "Atelier",
    category: { slug: "seramik", name: { tr: "Seramik", en: "Ceramics" } },
    name: { tr: "İznik Vazo, Lale", en: "Iznik Vessel, Lale" },
    tagline: {
      tr: "İznik geleneğinden bir lale.",
      en: "A tulip, in the Iznik tradition.",
    },
    description: {
      tr: "El yapımı stoneware, lale motifli sırlama. İznik koleksiyonundan.",
      en: "Hand-thrown stoneware glazed with a tulip motif. From our Iznik collection.",
    },
    materials: {
      tr: "Stoneware · 28 cm boy · gıdaya uygun sır",
      en: "Stoneware · 28 cm tall · food-safe glaze",
    },
  },
  {
    id: "mock-mermer",
    slug: "mermer-deri-defter",
    sku: "EFR-PAPER-003",
    basePrice: "1950.00",
    editionTotal: null,
    editionNumber: 3,
    isFeatured: true,
    badge: null,
    category: { slug: "kagit", name: { tr: "Kağıt", en: "Paper" } },
    name: { tr: "Mermer Deri Defter, A5", en: "Mermer Leather Journal, A5" },
    tagline: {
      tr: "Elde mermerlenmiş cilt.",
      en: "Hand-marbled binding.",
    },
    description: {
      tr: "Bitkisel deri kapaklı A5 defter, 160 sayfa krem kağıt.",
      en: "A5 journal bound in vegetable-tanned leather, 160 cream pages.",
    },
    materials: {
      tr: "Bitkisel deri · 160 sayfa · A5",
      en: "Vegetable-tanned leather · 160 pages · A5",
    },
  },
  {
    id: "mock-hattat",
    slug: "hattat-yazi-takimi",
    sku: "EFR-STAT-011",
    basePrice: "2200.00",
    editionTotal: null,
    editionNumber: 11,
    isFeatured: true,
    badge: null,
    category: { slug: "kirtasiye", name: { tr: "Kırtasiye", en: "Stationery" } },
    name: { tr: "Hattat Yazı Takımı", en: "Hattat Calligraphy Set" },
    tagline: {
      tr: "Bir kamış, bir hokka, bir çekmece.",
      en: "A reed, an inkwell, a drawer.",
    },
    description: {
      tr: "Hattatlık için kamış kalem, mürekkep hokkası ve ahşap çekmece.",
      en: "Reed pen, brass inkwell, and wooden drawer for calligraphy.",
    },
    materials: {
      tr: "Ahşap · pirinç hokka · kamış · mermerli kağıt",
      en: "Wood · brass inkwell · reed · marbled paper",
    },
  },
  {
    id: "mock-bogazici",
    slug: "bogazici-cam-bardak",
    sku: "EFR-GLASS-018",
    basePrice: "2800.00",
    editionTotal: null,
    editionNumber: 18,
    isFeatured: true,
    badge: "Pair",
    category: { slug: "cam", name: { tr: "Cam", en: "Glassware" } },
    name: {
      tr: "Boğaziçi Cam Bardak, Çift",
      en: "Boğaziçi Glass Tumblers, Pair",
    },
    tagline: { tr: "Beykoz işi, çift olarak.", en: "Beykoz blown, sold as a pair." },
    description: {
      tr: "El üflemeli iki bardak, hafif mavi tonla.",
      en: "Two hand-blown tumblers, soft blue cast.",
    },
    materials: {
      tr: "Üflemeli cam · 280 ml · çift",
      en: "Blown glass · 280 ml · pair",
    },
  },
];

function toDTO(m: MockSeed, locale: AppLocale): ProductDTO {
  return {
    id: m.id,
    slug: m.slug,
    sku: m.sku,
    basePrice: m.basePrice,
    currency: "TRY",
    editionTotal: m.editionTotal,
    editionNumber: m.editionNumber,
    isFeatured: m.isFeatured,
    name: m.name[locale],
    tagline: m.tagline[locale],
    description: m.description[locale],
    materials: m.materials[locale],
    imageUrl: "/ebru-detail.png",
    imageAlt: m.name[locale],
    badge: m.badge,
    category: { slug: m.category.slug, name: m.category.name[locale] },
    variants: [
      {
        id: `${m.id}-default`,
        sku: `${m.sku}-DEFAULT`,
        price: m.basePrice,
        stock: 10,
        attributes: {},
        isDefault: true,
      },
    ],
    hasModel3D: false,
  };
}

export function mockFeatured(locale: AppLocale): ProductDTO[] {
  return mock.map((m) => toDTO(m, locale));
}

export function mockBySlug(slug: string, locale: AppLocale): ProductDetailDTO | null {
  const m = mock.find((x) => x.slug === slug);
  if (!m) return null;
  return {
    ...toDTO(m, locale),
    images: [{ id: `${m.id}-img-0`, url: "/ebru-detail.png", alt: m.name[locale] }],
    model3d: null,
  };
}
