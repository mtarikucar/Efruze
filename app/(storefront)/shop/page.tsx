import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ShopFilters, ShopSort } from "@/components/storefront/ShopFilters";
import { safeListProducts, safeListCategories } from "@/server/services/catalog";
import type { AppLocale } from "@/i18n/routing";

type SearchParams = Promise<{
  category?: string;
  q?: string;
  priceMin?: string;
  priceMax?: string;
  inStock?: string;
  sort?: string;
  page?: string;
}>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { q } = await searchParams;
  const t = await getTranslations("shop");
  return {
    title: q ? `"${q}" · ${t("title")}` : t("title"),
  };
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("shop");

  const page = sp.page ? Math.max(1, Number.parseInt(sp.page, 10) || 1) : 1;
  const sort = (sp.sort as "newest" | "priceAsc" | "priceDesc" | undefined) ?? "newest";

  const [{ items, total }, categoriesTree] = await Promise.all([
    safeListProducts({
      category: sp.category,
      q: sp.q,
      priceMin: sp.priceMin ? Number(sp.priceMin) : undefined,
      priceMax: sp.priceMax ? Number(sp.priceMax) : undefined,
      inStock: sp.inStock === "1" || sp.inStock === "true",
      sort,
      page,
      perPage: 24,
      locale,
    }),
    safeListCategories(locale),
  ]);

  const categories = categoriesTree.map((c) => ({ id: c.id, slug: c.slug, name: c.name }));

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(140px, 12vw, 200px)" }}
    >
      <header className="mb-10 flex flex-col gap-3">
        <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
          <span className="mr-1.5 text-gold">I —</span>{" "}
          {sp.q ? t("searchingFor", { q: sp.q }) : t("category")}
        </div>
        <h1
          className="serif-display m-0 font-serif font-light text-ink"
          style={{ fontSize: "clamp(36px, 5.4vw, 68px)", lineHeight: 1.02 }}
        >
          {sp.q ? `"${sp.q}"` : t("title")}
        </h1>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="m-0 font-caps text-[11px] uppercase tracking-[0.22em] text-ink-mute">
            {t("showing", { count: total })}
            {sp.q && (
              <>
                {" · "}
                <Link href="/shop" className="text-ink underline-offset-4 hover:underline">
                  {t("clearSearch")}
                </Link>
              </>
            )}
          </p>
          <ShopSort active={sort} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
        <ShopFilters
          categories={categories}
          active={{
            category: sp.category,
            q: sp.q,
            priceMin: sp.priceMin,
            priceMax: sp.priceMax,
            inStock: sp.inStock === "1" || sp.inStock === "true",
          }}
        />

        {items.length === 0 ? (
          <p className="font-serif text-lg text-ink-2">{t("noResults")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} variant="standard" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
