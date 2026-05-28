/**
 * efruze seed — 6 categories, 6 products (from the design homepage),
 * 1 StoreSettings singleton, 2 BankAccount rows.
 *
 * Run: npx prisma db seed
 * (requires DATABASE_URL in .env and tsx installed)
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { mockEventsSeedData } from "../lib/mock-events";
import { mockJournalSeedData } from "../lib/mock-journal";
import { mockFaqSeedData } from "../lib/mock-faq";
import { mockPagesSeedData } from "../lib/mock-pages";
import {
  mockMaisonStepsSeedData,
  mockMaisonArtisansSeedData,
  mockMaisonIntroSeedData,
} from "../lib/mock-maison";

const prisma = new PrismaClient();

type CategorySeed = {
  slug: string;
  imageHint: string;
  tr: { name: string; description: string };
  en: { name: string; description: string };
};

const categories: CategorySeed[] = [
  {
    slug: "ipek",
    imageHint: "ebru-bg-1",
    tr: {
      name: "İpek",
      description: "Tek bir daldırmada mermerlenmiş habotai ipek eşarp ve aksesuarlar.",
    },
    en: {
      name: "Silks",
      description: "Habotai silk marbled in a single immersion — scarves and accessories.",
    },
  },
  {
    slug: "baski",
    imageHint: "ebru-bg-2",
    tr: {
      name: "Baskı",
      description: "Atölyede numaralandırılmış ebru baskıları, sınırlı sayıda.",
    },
    en: {
      name: "Prints",
      description: "Numbered ebru prints from the atelier, in small editions.",
    },
  },
  {
    slug: "seramik",
    imageHint: "ebru-bg-3",
    tr: {
      name: "Seramik",
      description: "İznik geleneğinden el yapımı vazolar, tabaklar ve fincanlar.",
    },
    en: {
      name: "Ceramics",
      description: "Vessels, plates and cups hand-thrown in the Iznik tradition.",
    },
  },
  {
    slug: "kagit",
    imageHint: "ebru-bg-4",
    tr: {
      name: "Kağıt",
      description: "Mermerli deri defter ve kağıt ürünler.",
    },
    en: {
      name: "Paper",
      description: "Marbled leather journals and paper goods.",
    },
  },
  {
    slug: "kirtasiye",
    imageHint: "ebru-bg-5",
    tr: {
      name: "Kırtasiye",
      description: "Hattatlık takımı ve yazı malzemeleri.",
    },
    en: {
      name: "Stationery",
      description: "Calligraphy sets and writing supplies.",
    },
  },
  {
    slug: "cam",
    imageHint: "ebru-bg-6",
    tr: {
      name: "Cam",
      description: "El üflemeli bardak ve sürahiler, çift olarak.",
    },
    en: {
      name: "Glassware",
      description: "Hand-blown tumblers and carafes, sold in pairs.",
    },
  },
];

type ProductSeed = {
  slug: string;
  sku: string;
  categorySlug: string;
  basePrice: string;
  editionTotal: number | null;
  editionNumber: number | null;
  isFeatured: boolean;
  badge?: string;
  imageHint: string;
  sortOrder: number;
  tr: { name: string; tagline: string; description: string; materials: string };
  en: { name: string; tagline: string; description: string; materials: string };
};

const products: ProductSeed[] = [
  {
    slug: "firuze-ipek-esarp",
    sku: "EFR-SILK-014",
    categorySlug: "ipek",
    basePrice: "3800.00",
    editionTotal: 12,
    editionNumber: 14,
    isFeatured: true,
    badge: "New · 1 of 12",
    imageHint: "ebru-bg-1",
    sortOrder: 1,
    tr: {
      name: '"Firuze" Mermerli İpek Eşarp, 90×90',
      tagline: "Tek bir daldırmada — krem, mürekkep ve firuze.",
      description:
        "Habotai ipek, tek daldırmada mermerlenir. Krem, mürekkep ve firuze tonlarıyla, kenarları elle kıvrılmıştır. Her parça atölyede imzalanır ve numaralandırılır.",
      materials: "100% habotai ipek · 90×90 cm · elle kıvrılmış kenar",
    },
    en: {
      name: '"Firuze" Marbled Silk Scarf, 90×90',
      tagline: "Marbled in a single immersion — cream, ink, turquoise.",
      description:
        "Habotai silk, marbled in a single immersion. Cream, ink, and turquoise — finished with hand-rolled hems. Each piece is signed and numbered in the atelier.",
      materials: "100% habotai silk · 90×90 cm · hand-rolled hem",
    },
  },
  {
    slug: "su-ustune-ebru-baski",
    sku: "EFR-PRINT-007",
    categorySlug: "baski",
    basePrice: "2400.00",
    editionTotal: 30,
    editionNumber: 7,
    isFeatured: true,
    badge: "Limited · 1/30",
    imageHint: "ebru-bg-2",
    sortOrder: 2,
    tr: {
      name: "Su Üstüne, Numaralı Ebru Baskısı",
      tagline: "Bir tepsi durgun su, bir nefes.",
      description:
        "Hand Made Paper üzerine numaralı baskı. 30 adetle sınırlı, her biri imzalı ve mühürlü.",
      materials: "El yapımı kağıt · 40×60 cm · arşiv mürekkebi",
    },
    en: {
      name: "Su Üstüne, Numbered Ebru Print",
      tagline: "A tray of still water and a single breath.",
      description:
        "Numbered print on hand-made paper. Edition of 30, each signed and sealed.",
      materials: "Hand-made paper · 40×60 cm · archival ink",
    },
  },
  {
    slug: "iznik-lale-vazo",
    sku: "EFR-CER-021",
    categorySlug: "seramik",
    basePrice: "6200.00",
    editionTotal: null,
    editionNumber: 21,
    isFeatured: true,
    badge: "Atelier",
    imageHint: "ebru-bg-3",
    sortOrder: 3,
    tr: {
      name: "İznik Vazo, Lale",
      tagline: "İznik geleneğinden bir lale.",
      description:
        "El yapımı stoneware, lale motifli sırlama. Atölyemizin İznik koleksiyonundan, kilden ele.",
      materials: "Stoneware · 28 cm boy · gıdaya uygun sır",
    },
    en: {
      name: "Iznik Vessel, Lale",
      tagline: "A tulip, in the Iznik tradition.",
      description:
        "Hand-thrown stoneware glazed with a tulip motif. From our Iznik collection — kiln to hand.",
      materials: "Stoneware · 28 cm tall · food-safe glaze",
    },
  },
  {
    slug: "mermer-deri-defter",
    sku: "EFR-PAPER-003",
    categorySlug: "kagit",
    basePrice: "1950.00",
    editionTotal: null,
    editionNumber: 3,
    isFeatured: true,
    imageHint: "ebru-bg-4",
    sortOrder: 4,
    tr: {
      name: "Mermer Deri Defter, A5",
      tagline: "Elde mermerlenmiş cilt.",
      description:
        "Bitkisel deri kapaklı A5 defter. Cildi elle mermerlenmiş, 160 sayfa krem kağıt içerir.",
      materials: "Bitkisel deri · 160 sayfa · A5",
    },
    en: {
      name: "Mermer Leather Journal, A5",
      tagline: "Hand-marbled binding.",
      description:
        "A5 journal bound in vegetable-tanned leather. Hand-marbled covers, 160 pages of cream paper.",
      materials: "Vegetable-tanned leather · 160 pages · A5",
    },
  },
  {
    slug: "hattat-yazi-takimi",
    sku: "EFR-STAT-011",
    categorySlug: "kirtasiye",
    basePrice: "2200.00",
    editionTotal: null,
    editionNumber: 11,
    isFeatured: true,
    imageHint: "ebru-bg-5",
    sortOrder: 5,
    tr: {
      name: "Hattat Yazı Takımı",
      tagline: "Bir kamış, bir hokka, bir çekmece.",
      description:
        "Hattatlık için kamış kalem, mürekkep hokkası ve ahşap çekmece. Çekmecesi mermerli kağıtla kaplanmıştır.",
      materials: "Ahşap · pirinç hokka · kamış · mermerli kağıt",
    },
    en: {
      name: "Hattat Calligraphy Set",
      tagline: "A reed, an inkwell, a drawer.",
      description:
        "Reed pen, brass inkwell, and wooden drawer for calligraphy. Drawer lined with marbled paper.",
      materials: "Wood · brass inkwell · reed · marbled paper",
    },
  },
  {
    slug: "bogazici-cam-bardak",
    sku: "EFR-GLASS-018",
    categorySlug: "cam",
    basePrice: "2800.00",
    editionTotal: null,
    editionNumber: 18,
    isFeatured: true,
    badge: "Pair",
    imageHint: "ebru-bg-6",
    sortOrder: 6,
    tr: {
      name: "Boğaziçi Cam Bardak, Çift",
      tagline: "Beykoz işi, çift olarak.",
      description:
        "El üflemeli iki bardak. Beykoz cam atölyemizden, hafif bir mavi tonla.",
      materials: "Üflemeli cam · 280 ml · çift",
    },
    en: {
      name: "Boğaziçi Glass Tumblers, Pair",
      tagline: "Beykoz blown, sold as a pair.",
      description:
        "Two hand-blown tumblers from our Beykoz glass studio, in a soft blue cast.",
      materials: "Blown glass · 280 ml · pair",
    },
  },
];

async function main() {
  console.log("→ Seeding categories…");
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        sortOrder: categories.indexOf(c),
        isActive: true,
        translations: {
          create: [
            { locale: "tr", name: c.tr.name, description: c.tr.description },
            { locale: "en", name: c.en.name, description: c.en.description },
          ],
        },
      },
    });
  }

  console.log("→ Seeding products…");
  for (const p of products) {
    const cat = await prisma.category.findUniqueOrThrow({
      where: { slug: p.categorySlug },
    });

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        sku: p.sku,
        categoryId: cat.id,
        basePrice: new Prisma.Decimal(p.basePrice),
        currency: "TRY",
        editionTotal: p.editionTotal,
        editionNumber: p.editionNumber,
        isFeatured: p.isFeatured,
        isPublished: true,
        publishedAt: new Date(),
        sortOrder: p.sortOrder,
        translations: {
          create: [
            {
              locale: "tr",
              name: p.tr.name,
              tagline: p.tr.tagline,
              description: p.tr.description,
              materials: p.tr.materials,
            },
            {
              locale: "en",
              name: p.en.name,
              tagline: p.en.tagline,
              description: p.en.description,
              materials: p.en.materials,
            },
          ],
        },
        variants: {
          create: [
            {
              sku: `${p.sku}-DEFAULT`,
              priceOverride: null,
              stock: 10,
              attributes: { default: true } as Prisma.InputJsonValue,
              isDefault: true,
              sortOrder: 0,
            },
          ],
        },
        images: {
          create: [
            {
              url: `/ebru-detail.png`,
              publicId: `seed/${p.slug}`,
              alt: p.en.name,
              sortOrder: 0,
              isPrimary: true,
            },
          ],
        },
      },
    });
  }

  console.log("→ Seeding StoreSettings…");
  await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      brandName: "efruze",
      tagline: {
        tr: "Su üstüne çizilen",
        en: "Drawn upon water",
      } as Prisma.InputJsonValue,
      contactEmail: "atelier@efruze.com",
      whatsapp: "+90 555 000 0000",
      instagram: "@efruze",
      defaultCurrency: "TRY",
      shippingFlatRate: new Prisma.Decimal("80.00"),
      freeShippingThreshold: new Prisma.Decimal("2500.00"),
      addressTr: "Atölye\nAlanya / Antalya",
      addressEn: "Atelier\nAlanya / Antalya",
      hoursTr: "Sal–Cum · 10:00 – 18:00\nCmt · 12:00 – 17:00 · randevu ile",
      hoursEn: "Tue–Fri · 10:00 – 18:00\nSat · 12:00 – 17:00 · by appointment",
      maisonHeroImageUrl: "/ebru-detail.png",
      maisonIntroTr: mockMaisonIntroSeedData.tr,
      maisonIntroEn: mockMaisonIntroSeedData.en,
    },
  });

  // Backfill: for an existing settings row missing the new editorial fields,
  // populate them from defaults — but don't override anything the admin set.
  const currentSettings = await prisma.storeSettings.findUnique({
    where: { id: "singleton" },
  });
  if (currentSettings) {
    const patch: Prisma.StoreSettingsUpdateInput = {};
    if (!currentSettings.addressTr)
      patch.addressTr = "Atölye\nAlanya / Antalya";
    if (!currentSettings.addressEn)
      patch.addressEn = "Atelier\nAlanya / Antalya";
    if (!currentSettings.hoursTr)
      patch.hoursTr = "Sal–Cum · 10:00 – 18:00\nCmt · 12:00 – 17:00 · randevu ile";
    if (!currentSettings.hoursEn)
      patch.hoursEn = "Tue–Fri · 10:00 – 18:00\nSat · 12:00 – 17:00 · by appointment";
    if (!currentSettings.maisonHeroImageUrl) patch.maisonHeroImageUrl = "/ebru-detail.png";
    if (!currentSettings.maisonIntroTr) patch.maisonIntroTr = mockMaisonIntroSeedData.tr;
    if (!currentSettings.maisonIntroEn) patch.maisonIntroEn = mockMaisonIntroSeedData.en;
    if (Object.keys(patch).length > 0) {
      await prisma.storeSettings.update({ where: { id: "singleton" }, data: patch });
    }
  }

  console.log("→ Seeding BankAccount rows…");
  const banks = [
    {
      bankName: "Garanti BBVA",
      accountHolder: "efruze atölye ltd. şti.",
      iban: "TR00 0006 2000 0000 0000 0000 00",
      swift: "TGBATRIS",
      currency: "TRY",
      sortOrder: 0,
    },
    {
      bankName: "İş Bankası",
      accountHolder: "efruze atölye ltd. şti.",
      iban: "TR00 0006 4000 0000 0000 0000 00",
      swift: "ISBKTRIS",
      currency: "TRY",
      sortOrder: 1,
    },
  ];
  for (const b of banks) {
    // BankAccount has no natural unique key beyond id; idempotent insert by IBAN
    const existing = await prisma.bankAccount.findFirst({
      where: { iban: b.iban },
    });
    if (!existing) await prisma.bankAccount.create({ data: b });
  }

  console.log("→ Seeding events…");
  for (const [i, e] of mockEventsSeedData.entries()) {
    await prisma.event.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        slug: e.slug,
        date: new Date(e.date),
        kind: e.kind,
        priceText: e.priceText,
        ctaUrl: e.ctaUrl,
        isPublished: true,
        sortOrder: i,
        publishedAt: new Date(),
        translations: {
          create: [
            { locale: "tr", tag: e.tag.tr, title: e.title.tr, description: e.description.tr, meta: e.meta.tr, ctaLabel: e.ctaLabel.tr },
          ],
        },
      },
    });
  }

  console.log("→ Seeding journal entries…");
  for (const [i, j] of mockJournalSeedData.entries()) {
    await prisma.journalEntry.upsert({
      where: { slug: j.slug },
      update: {},
      create: {
        slug: j.slug,
        date: new Date(j.date),
        featured: j.featured,
        readMinutes: j.readMinutes,
        isPublished: true,
        sortOrder: i,
        publishedAt: new Date(),
        translations: {
          create: [
            { locale: "tr", category: j.category.tr, title: j.title.tr, excerpt: j.excerpt.tr, body: j.body.tr },
          ],
        },
      },
    });
  }

  console.log("→ Seeding FAQ items…");
  for (const f of mockFaqSeedData) {
    await prisma.faqItem.upsert({
      where: { id: f.id },
      update: {},
      create: {
        id: f.id,
        sortOrder: f.sortOrder,
        isActive: true,
        translations: {
          create: [
            { locale: "tr", question: f.question.tr, answer: f.answer.tr },
          ],
        },
      },
    });
  }

  console.log("→ Seeding static pages…");
  for (const p of mockPagesSeedData) {
    await prisma.staticPage.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        isActive: true,
        translations: {
          create: [
            { locale: "tr", title: p.title.tr, intro: p.intro.tr, body: p.body.tr },
          ],
        },
      },
    });
  }

  console.log("→ Seeding Maison steps…");
  for (const s of mockMaisonStepsSeedData) {
    await prisma.maisonStep.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        sortOrder: s.sortOrder,
        isActive: true,
        translations: {
          create: [
            { locale: "tr", title: s.title.tr, description: s.description.tr },
          ],
        },
      },
    });
  }

  console.log("→ Seeding Maison artisans…");
  for (const a of mockMaisonArtisansSeedData) {
    await prisma.maisonArtisan.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        sortOrder: a.sortOrder,
        isActive: true,
        imageUrl: a.imageUrl,
        translations: {
          create: [
            { locale: "tr", name: a.name.tr, role: a.role.tr, bio: a.bio.tr },
          ],
        },
      },
    });
  }

  console.log("✓ Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
