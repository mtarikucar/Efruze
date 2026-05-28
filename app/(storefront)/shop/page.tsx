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

  const [{ items, total, page: currentPage, perPage }, categoriesTree] = await Promise.all([
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

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Build a /shop?... href that preserves every active filter/sort param and
  // only swaps the target page. Strings are cast for typed-routes (matches the
  // pattern used by ShopFilters).
  const pageHref = (target: number): string => {
    const params = new URLSearchParams();
    if (sp.category) params.set("category", sp.category);
    if (sp.q) params.set("q", sp.q);
    if (sp.priceMin) params.set("priceMin", sp.priceMin);
    if (sp.priceMax) params.set("priceMax", sp.priceMax);
    if (sp.inStock) params.set("inStock", sp.inStock);
    if (sp.sort) params.set("sort", sp.sort);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  // Compact window of page numbers around the current page (max ~5 visible).
  const pageNumbers: number[] = [];
  const windowStart = Math.max(1, currentPage - 2);
  const windowEnd = Math.min(totalPages, currentPage + 2);
  for (let n = windowStart; n <= windowEnd; n++) pageNumbers.push(n);

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
          <div className="flex flex-col gap-12">
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} variant="standard" />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label={t("pageLabel", { page: currentPage, total: totalPages })}
                className="flex flex-wrap items-center justify-center gap-2 border-t border-line pt-10"
              >
                {currentPage > 1 ? (
                  <Link
                    href={pageHref(currentPage - 1) as never}
                    rel="prev"
                    className="inline-flex items-center rounded-full border border-line px-4 py-2.5 font-caps text-[10px] uppercase tracking-[0.22em] text-ink transition hover:border-ink"
                  >
                    {t("prevPage")}
                  </Link>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center rounded-full border border-line px-4 py-2.5 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute opacity-50">
                    {t("prevPage")}
                  </span>
                )}

                {pageNumbers.map((n) => (
                  <Link
                    key={n}
                    href={pageHref(n) as never}
                    aria-current={n === currentPage ? "page" : undefined}
                    className={
                      n === currentPage
                        ? "inline-flex min-w-[2.5rem] items-center justify-center rounded-full border border-ink bg-ink px-3.5 py-2.5 font-caps text-[10px] uppercase tracking-[0.22em] text-bg"
                        : "inline-flex min-w-[2.5rem] items-center justify-center rounded-full border border-line px-3.5 py-2.5 font-caps text-[10px] uppercase tracking-[0.22em] text-ink transition hover:border-ink"
                    }
                  >
                    {n}
                  </Link>
                ))}

                {currentPage < totalPages ? (
                  <Link
                    href={pageHref(currentPage + 1) as never}
                    rel="next"
                    className="inline-flex items-center rounded-full border border-line px-4 py-2.5 font-caps text-[10px] uppercase tracking-[0.22em] text-ink transition hover:border-ink"
                  >
                    {t("nextPage")}
                  </Link>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center rounded-full border border-line px-4 py-2.5 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute opacity-50">
                    {t("nextPage")}
                  </span>
                )}
              </nav>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
