"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { Link } from "@/i18n/navigation";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

type Category = { id: string; slug: string; name: string };

/**
 * Sticky filter sidebar. Reads filter state from URL searchParams (so links
 * are shareable) and writes back via router.push with merged params.
 */
export function ShopFilters({
  categories,
  active,
}: {
  categories: Category[];
  active: {
    category?: string;
    q?: string;
    priceMin?: string;
    priceMax?: string;
    inStock?: boolean;
  };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [priceMin, setPriceMin] = useState(active.priceMin ?? "");
  const [priceMax, setPriceMax] = useState(active.priceMax ?? "");
  const [inStock, setInStock] = useState(Boolean(active.inStock));

  function applyAll() {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (priceMin) next.set("priceMin", priceMin);
    else next.delete("priceMin");
    if (priceMax) next.set("priceMax", priceMax);
    else next.delete("priceMax");
    if (inStock) next.set("inStock", "1");
    else next.delete("inStock");
    next.delete("page");
    router.push(`/shop?${next.toString()}`);
  }

  function clearAll() {
    setPriceMin("");
    setPriceMax("");
    setInStock(false);
    // Keep just q + category if set so the user keeps their context.
    const next = new URLSearchParams();
    if (active.q) next.set("q", active.q);
    if (active.category) next.set("category", active.category);
    router.push(`/shop?${next.toString()}`);
  }

  const linkFor = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params?.toString() ?? "");
    for (const [k, v] of Object.entries(changes)) {
      if (v == null) next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    return `/shop?${next.toString()}`;
  };

  const body = (
    <div className="flex flex-col gap-8">
      <FilterSection title="Kategoriler">
        <ul className="flex flex-col gap-1.5 m-0 p-0 list-none">
          <li>
            <Link
              href={linkFor({ category: null }) as never}
              className={cn(
                "block py-1 font-serif text-base transition",
                !active.category ? "text-ink" : "text-ink-2 hover:text-ink",
              )}
            >
              Tümü
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={linkFor({ category: c.slug }) as never}
                className={cn(
                  "block py-1 font-serif text-base transition",
                  active.category === c.slug
                    ? "text-ink"
                    : "text-ink-2 hover:text-ink",
                )}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection title="Fiyat (₺)">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
              En az
            </span>
            <input
              inputMode="numeric"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value.replace(/\D/g, ""))}
              className="w-full border-0 border-b border-line bg-transparent px-1 py-2 font-serif text-base text-ink outline-none focus:border-ink"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
              En çok
            </span>
            <input
              inputMode="numeric"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, ""))}
              className="w-full border-0 border-b border-line bg-transparent px-1 py-2 font-serif text-base text-ink outline-none focus:border-ink"
            />
          </label>
        </div>
      </FilterSection>

      <FilterSection title="Stok durumu">
        <label className="inline-flex items-center gap-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="accent-ink"
          />
          Yalnızca stoktakiler
        </label>
      </FilterSection>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <button
          type="button"
          onClick={applyAll}
          className="inline-flex items-center rounded-full border border-ink bg-ink px-5 py-2.5 font-caps text-[10px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2"
        >
          Uygula
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute underline-offset-4 hover:text-ink hover:underline"
        >
          Temizle
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile (< lg): Sheet trigger button */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink bg-paper px-5 py-3 font-caps text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-bg-deep">
            <SlidersHorizontal size={14} strokeWidth={1.25} />
            Filtrele
          </SheetTrigger>
          <SheetContent side="left" className="max-w-sm">
            <div className="flex h-full flex-col overflow-y-auto px-8 py-10">
              <SheetTitle className="mb-8 font-caps text-[10px] uppercase tracking-[0.32em] text-gold">
                <span className="mr-1.5">—</span> Filtrele
              </SheetTitle>
              <SheetDescription className="sr-only">Mağazayı filtrele</SheetDescription>
              {body}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop (lg+): sticky sidebar */}
      <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">{body}</aside>
    </>
  );
}

export function ShopSort({ active }: { active?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function go(value: string) {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (value === "newest") next.delete("sort");
    else next.set("sort", value);
    next.delete("page");
    router.push(`/shop?${next.toString()}`);
  }

  return (
    <select
      value={active ?? "newest"}
      onChange={(e) => go(e.target.value)}
      className="cursor-pointer border-0 border-b border-line bg-transparent py-2 pr-6 font-caps text-[10px] uppercase tracking-[0.22em] text-ink outline-none focus:border-ink"
    >
      <option value="newest">En yeni</option>
      <option value="priceAsc">Fiyat · artan</option>
      <option value="priceDesc">Fiyat · azalan</option>
    </select>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="m-0 mb-3 font-caps text-[10px] uppercase tracking-[0.32em] text-ink-2">
        <span className="mr-1.5 text-gold">—</span> {title}
      </h3>
      {children}
    </section>
  );
}
