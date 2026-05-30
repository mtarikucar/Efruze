"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Settings2,
  Plus,
  Star,
  ImageOff,
} from "lucide-react";
import { QuickCategoryField } from "./QuickCategoryField";
import { StockQuickEdit } from "./StockQuickEdit";
import { EmptyState } from "./primitives";
import { cn } from "@/lib/cn";

export type CatalogProduct = {
  id: string;
  name: string;
  price: string;
  isPublished: boolean;
  isFeatured: boolean;
  stock: number;
  imageUrl: string | null;
  editableVariantId: string | null;
  variantCount: number;
};

export type CatalogCategory = {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  productCount: number;
  products: CatalogProduct[];
  /** false for the synthetic "deleted category" catch-all group — it has no
   * real category row, so no edit/add affordances. */
  manageable?: boolean;
};

/**
 * The merged catalog: categories as collapsible groups, each holding its own
 * products. This is the logical union of the old products + categories lists —
 * the admin manages the whole catalog tree from one mobile-first screen.
 * Groups with products start expanded so nothing is hidden behind a tap.
 */
export function CatalogTree({
  categories,
  defaultExpandedId,
}: {
  categories: CatalogCategory[];
  defaultExpandedId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<Set<string>>(() => {
    const s = new Set<string>(
      categories.filter((c) => c.productCount > 0).map((c) => c.id),
    );
    if (defaultExpandedId) s.add(defaultExpandedId);
    return s;
  });

  // Jump to the pre-expanded category (e.g. arriving from a "N ürün" link).
  useEffect(() => {
    if (!defaultExpandedId) return;
    const el = document.getElementById(`cat-${defaultExpandedId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [defaultExpandedId]);

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allOpen =
    categories.length > 0 && categories.every((c) => open.has(c.id));

  function toggleAll() {
    setOpen(allOpen ? new Set() : new Set(categories.map((c) => c.id)));
  }

  const parents = categories
    .filter((c) => !c.parentId && c.manageable !== false)
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="flex flex-col gap-3">
      {categories.length > 1 && (
        <div className="-mt-2 flex justify-end">
          <button
            type="button"
            onClick={toggleAll}
            className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute transition hover:text-ink"
          >
            {allOpen ? "Tümünü kapat" : "Tümünü aç"}
          </button>
        </div>
      )}

      {categories.length === 0 ? (
        <EmptyState
          title="Henüz kategori yok."
          sub="Ürün ekleyebilmek için önce bir kategori oluşturun."
        />
      ) : (
        categories.map((cat) => {
          const isOpen = open.has(cat.id);
          const manageable = cat.manageable !== false;
          return (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              className="overflow-hidden rounded-sm border border-line bg-paper"
            >
              {/* Header: toggle (left, grows) + manage link (right). Kept as
                  siblings so we never nest an <a> inside a <button>. */}
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => toggle(cat.id)}
                  aria-expanded={isOpen}
                  className="flex flex-1 items-center gap-3 px-4 py-4 text-left transition hover:bg-bg-deep/30"
                >
                  <ChevronRight
                    size={16}
                    strokeWidth={1.5}
                    className={cn(
                      "flex-none text-ink-mute transition-transform",
                      isOpen && "rotate-90",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-lg text-ink">
                      {cat.name}
                    </span>
                    {cat.parentName && (
                      <span className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                        ↳ {cat.parentName}
                      </span>
                    )}
                  </span>
                  <span className="ml-auto flex-none font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                    {cat.productCount} ürün
                  </span>
                </button>
                {manageable && (
                  <Link
                    href={`/admin/categories/${cat.id}`}
                    aria-label={`${cat.name} kategorisini düzenle`}
                    className="flex flex-none items-center border-l border-line px-4 text-ink-mute transition hover:bg-bg-deep/30 hover:text-ink"
                  >
                    <Settings2 size={16} strokeWidth={1.5} />
                  </Link>
                )}
              </div>

              {isOpen && (
                <div className="flex flex-col gap-2 border-t border-line bg-bg-deep/20 p-3">
                  {cat.products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-sm border border-line bg-paper p-3 transition hover:border-ink"
                    >
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <span className="relative flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-sm bg-bg-deep/40">
                          {p.imageUrl ? (
                            <Image
                              src={p.imageUrl}
                              alt={p.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <ImageOff
                              size={16}
                              strokeWidth={1.25}
                              className="text-ink-mute"
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-serif text-ink">
                              {p.name}
                            </span>
                            {p.isFeatured && (
                              <Star
                                size={12}
                                strokeWidth={1.5}
                                className="flex-none text-gold"
                                aria-label="öne çıkan"
                              />
                            )}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-caps text-[9px] uppercase tracking-[0.22em]">
                            <span
                              className={
                                p.isPublished ? "text-emerald-700" : "text-ink-mute"
                              }
                            >
                              {p.isPublished ? "yayında" : "taslak"}
                            </span>
                            <span className="font-serif text-sm normal-case tracking-normal text-ink">
                              {p.price}
                            </span>
                          </span>
                        </span>
                      </Link>
                      {p.editableVariantId ? (
                        <StockQuickEdit
                          variantId={p.editableVariantId}
                          stock={p.stock}
                        />
                      ) : (
                        <span className="flex-none font-caps text-[9px] uppercase tracking-[0.18em] text-ink-mute">
                          stok {p.stock} · {p.variantCount} varyant
                        </span>
                      )}
                    </div>
                  ))}

                  {cat.products.length === 0 && (
                    <p className="m-0 px-1 py-2 font-serif italic text-base text-ink-mute">
                      Bu kategoride henüz ürün yok.
                    </p>
                  )}

                  {manageable ? (
                    <Link
                      href={`/admin/products/new?category=${cat.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-dashed border-line px-4 py-3 font-caps text-[10px] uppercase tracking-[0.22em] text-blue-deep transition hover:border-ink hover:text-ink"
                    >
                      <Plus size={12} strokeWidth={1.5} /> Bu kategoriye ürün ekle
                    </Link>
                  ) : (
                    <p className="m-0 px-1 font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                      Bu ürünlerin kategorisi silinmiş — açıp yeni bir kategori seçin.
                    </p>
                  )}
                </div>
              )}
            </section>
          );
        })
      )}

      {/* Create a new category without leaving the catalog. */}
      <div className="mt-2">
        <QuickCategoryField
          parents={parents}
          onCreated={() => router.refresh()}
        />
      </div>
    </div>
  );
}
