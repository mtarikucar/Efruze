/**
 * DB-failure-safe helpers that wrap ProductService with mock fallback. Pages
 * use these so the storefront renders even before DATABASE_URL is set —
 * critical for first-run developer experience.
 *
 * Once DATABASE_URL is configured and the seed is run, the real DB takes
 * over automatically. No code path branches; the catch handler simply falls
 * back to the mocks.
 */
import { ProductService } from "./product.service";
import { CategoryService } from "./category.service";
import { EventService } from "./event.service";
import { JournalService } from "./journal.service";
import { FaqService } from "./faq.service";
import { StaticPageService } from "./static-page.service";
import { MaisonService } from "./maison.service";
import { mockFeatured, mockBySlug } from "@/lib/mock-products";
import { mockEvents } from "@/lib/mock-events";
import { mockJournal } from "@/lib/mock-journal";
import { mockFaq } from "@/lib/mock-faq";
import { mockStaticPage } from "@/lib/mock-pages";
import { mockMaison } from "@/lib/mock-maison";
import { productListParams } from "@/server/types/product";
import type { AppLocale } from "@/i18n/routing";
import type { ProductDTO, ProductDetailDTO } from "@/server/types/product";
import type { CategoryDTO } from "./category.service";
import type { EventDTO } from "@/server/types/event";
import type { JournalEntryDTO } from "@/server/types/journal";
import type { FaqItemDTO } from "@/server/types/faq";
import type { StaticPageDTO } from "@/server/types/static-page";
import type { MaisonContentDTO } from "@/server/types/maison";

export async function safeGetFeatured(locale: AppLocale, take = 6): Promise<ProductDTO[]> {
  try {
    return await ProductService.getFeatured(locale, take);
  } catch {
    return mockFeatured(locale).slice(0, take);
  }
}

export async function safeListProducts(
  rawParams: {
    category?: string;
    q?: string;
    priceMin?: number;
    priceMax?: number;
    inStock?: boolean;
    sort?: "newest" | "priceAsc" | "priceDesc";
    page?: number;
    perPage?: number;
    locale: AppLocale;
  },
): Promise<{ items: ProductDTO[]; total: number; page: number; perPage: number }> {
  // Defense-in-depth: storefront pages forward URL searchParams, which can carry
  // junk like `?priceMin=abc` (→ NaN) or `?sort=hacker` (a TS `as` cast
  // disguises the lie). Run through the same Zod schema the service itself
  // expects — coerces numbers, clamps page/perPage, rejects invalid sort.
  const parsed = productListParams.safeParse(rawParams);
  const params = parsed.success
    ? parsed.data
    : productListParams.parse({ locale: rawParams.locale }); // defaults

  // Mock filter pipeline mirrors the real query for DB-less dev.
  const filterMock = (list: ProductDTO[]) => {
    let r = list;
    if (params.category) r = r.filter((p) => p.category.slug === params.category);
    if (params.q && params.q.trim().length >= 2) {
      const needle = params.q.trim().toLowerCase();
      r = r.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          (p.description ?? "").toLowerCase().includes(needle),
      );
    }
    if (params.priceMin != null) {
      r = r.filter((p) => Number(p.basePrice) >= (params.priceMin as number));
    }
    if (params.priceMax != null) {
      r = r.filter((p) => Number(p.basePrice) <= (params.priceMax as number));
    }
    if (params.inStock) {
      r = r.filter((p) => p.variants.some((v) => v.stock > 0));
    }
    if (params.sort === "priceAsc") r = [...r].sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    if (params.sort === "priceDesc") r = [...r].sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    return r;
  };

  try {
    return await ProductService.list(params);
  } catch {
    const all = filterMock(mockFeatured(params.locale));
    return { items: all, total: all.length, page: params.page, perPage: params.perPage };
  }
}

export async function safeGetBySlug(slug: string, locale: AppLocale): Promise<ProductDetailDTO | null> {
  try {
    // DB reached — trust the result, even when it's null. Falling back to mock
    // here would resurrect products the admin has unpublished/soft-deleted.
    return await ProductService.getBySlug(slug, locale);
  } catch {
    return mockBySlug(slug, locale);
  }
}

export async function safeGetRelated(
  productId: string,
  categorySlug: string,
  locale: AppLocale,
  take = 4,
): Promise<ProductDTO[]> {
  // Related products are a nice-to-have garnish on the PDP — a DB hiccup must
  // never 500 the page. Degrade to an empty list and the caller hides the block.
  try {
    return await ProductService.getRelated(productId, categorySlug, locale, take);
  } catch {
    return [];
  }
}

/* ---- Events ---------------------------------------------------------- */

export async function safeListUpcomingEvents(locale: AppLocale, take?: number): Promise<EventDTO[]> {
  try {
    return await EventService.listUpcoming(locale, take);
  } catch {
    const m = mockEvents(locale);
    return take ? m.slice(0, take) : m;
  }
}

export async function safeListAllEvents(locale: AppLocale): Promise<EventDTO[]> {
  try {
    return await EventService.listAll(locale);
  } catch {
    return mockEvents(locale);
  }
}

/* ---- Journal --------------------------------------------------------- */

export async function safeListJournal(locale: AppLocale): Promise<JournalEntryDTO[]> {
  try {
    return await JournalService.listAll(locale);
  } catch {
    return mockJournal(locale);
  }
}

/* ---- FAQ ------------------------------------------------------------- */

export async function safeListFaq(locale: AppLocale): Promise<FaqItemDTO[]> {
  try {
    return await FaqService.listActive(locale);
  } catch {
    return mockFaq(locale);
  }
}

/* ---- Static pages (terms / privacy) --------------------------------- */

export async function safeGetStaticPage(
  slug: string,
  locale: AppLocale,
): Promise<StaticPageDTO | null> {
  try {
    const real = await StaticPageService.getBySlug(slug, locale);
    if (real) return real;
  } catch {
    /* fall through */
  }
  return mockStaticPage(slug, locale);
}

/* ---- Maison editorial (hero + intro + steps + artisans) ------------- */

export async function safeGetMaison(locale: AppLocale): Promise<MaisonContentDTO> {
  try {
    return await MaisonService.getContent(locale);
  } catch {
    return mockMaison(locale);
  }
}

/* ---- Store settings — contact info for /contact --------------------- */

export type ContactInfoDTO = {
  email: string;
  whatsapp: string | null;
  instagram: string | null;
  address: string;
  hours: string;
};

const fallbackContact: Record<AppLocale, { address: string; hours: string }> = {
  tr: {
    address: "Atölye\nAlanya / Antalya",
    hours: "Sal–Cum · 10:00 – 18:00\nCmt · 12:00 – 17:00 · randevu ile",
  },
};

export async function safeGetContactInfo(locale: AppLocale): Promise<ContactInfoDTO> {
  let address = fallbackContact[locale].address;
  let hours = fallbackContact[locale].hours;
  let email = "atelier@efruze.com";
  let whatsapp: string | null = null;
  let instagram: string | null = "@efruze";
  try {
    const { prisma } = await import("@/server/db/client");
    const s = await prisma.storeSettings.findUnique({ where: { id: "singleton" } });
    if (s) {
      if (s.addressTr) address = s.addressTr;
      if (s.hoursTr) hours = s.hoursTr;
      email = s.contactEmail;
      whatsapp = s.whatsapp;
      instagram = s.instagram;
    }
  } catch {
    /* fall through */
  }
  return { email, whatsapp, instagram, address, hours };
}

export async function safeListCategories(locale: AppLocale): Promise<CategoryDTO[]> {
  try {
    const real = await CategoryService.listTree(locale);
    if (real.length > 0) return real;
  } catch {
    /* fall through to mock */
  }
  // Mock categories — order matches design + seed
  return [
    { id: "mc-ipek", slug: "ipek", name: locale === "tr" ? "İpek" : "Silks", description: null, imageUrl: null, children: [] },
    { id: "mc-baski", slug: "baski", name: locale === "tr" ? "Baskı" : "Prints", description: null, imageUrl: null, children: [] },
    { id: "mc-seramik", slug: "seramik", name: locale === "tr" ? "Seramik" : "Ceramics", description: null, imageUrl: null, children: [] },
    { id: "mc-kagit", slug: "kagit", name: locale === "tr" ? "Kağıt" : "Paper", description: null, imageUrl: null, children: [] },
    { id: "mc-kirtasiye", slug: "kirtasiye", name: locale === "tr" ? "Kırtasiye" : "Stationery", description: null, imageUrl: null, children: [] },
    { id: "mc-cam", slug: "cam", name: locale === "tr" ? "Cam" : "Glassware", description: null, imageUrl: null, children: [] },
  ];
}
