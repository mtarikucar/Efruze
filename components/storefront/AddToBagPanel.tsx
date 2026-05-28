"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { addToCartAction } from "@/app/(storefront)/actions";
import { cn } from "@/lib/cn";
import type { ProductDetailDTO } from "@/server/types/product";

export function AddToBagPanel({ product }: { product: ProductDetailDTO }) {
  const t = useTranslations("product");
  const [variantId, setVariantId] = useState<string>(
    product.variants.find((v) => v.isDefault)?.id ?? product.variants[0]?.id ?? "",
  );
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showVariants = product.variants.length > 1;
  const selected = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const outOfStock = !selected || selected.stock <= 0;

  return (
    <div className="flex flex-col gap-6">
      {showVariants && (
        <div className="flex flex-col gap-3">
          <div className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
            {/* Variant label inferred from attributes — keep simple for v1 */}
            Seçenek
          </div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const label =
                Object.values(v.attributes ?? {}).filter((x): x is string => typeof x === "string").join(" · ") ||
                v.sku;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 font-caps text-[10px] uppercase tracking-[0.2em] transition",
                    v.id === variantId
                      ? "border-ink bg-ink text-bg"
                      : "border-line text-ink-2 hover:border-ink hover:text-ink",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="inline-flex items-center gap-3 rounded-full border border-line px-4 py-2 font-serif text-base text-ink">
          <button
            type="button"
            aria-label="Azalt"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="inline-flex h-6 w-6 items-center justify-center text-ink-mute transition hover:text-ink"
          >
            <Minus size={14} strokeWidth={1.5} />
          </button>
          <span className="min-w-[2ch] text-center tabular-nums">{qty}</span>
          <button
            type="button"
            aria-label="Artır"
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="inline-flex h-6 w-6 items-center justify-center text-ink-mute transition hover:text-ink"
          >
            <Plus size={14} strokeWidth={1.5} />
          </button>
        </div>

        <button
          type="button"
          disabled={pending || outOfStock}
          onClick={() =>
            startTransition(async () => {
              const res = await addToCartAction({
                productId: product.id,
                variantId,
                quantity: qty,
              });
              if (res.ok) {
                setAdded(true);
                if (addedTimer.current) clearTimeout(addedTimer.current);
                addedTimer.current = setTimeout(() => setAdded(false), 2000);
              }
            })
          }
          className={cn(
            "inline-flex flex-1 items-center justify-center rounded-full px-6 py-4 font-caps text-[11.5px] uppercase tracking-[0.22em] transition",
            outOfStock
              ? "border border-line bg-bg-deep text-ink-mute cursor-not-allowed"
              : "border border-ink bg-ink text-bg hover:bg-ink-2 disabled:opacity-60",
          )}
        >
          {outOfStock
            ? t("outOfStock")
            : pending
              ? t("adding")
              : added
                ? t("added")
                : t("addToBag")}
        </button>
      </div>
    </div>
  );
}
