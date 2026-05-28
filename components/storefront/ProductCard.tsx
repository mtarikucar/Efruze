"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { PriceTag } from "./PriceTag";
import { formatEditionNumber } from "@/lib/format";
import type { ProductDTO } from "@/server/types/product";
import { addToCartAction } from "@/app/(storefront)/actions";

export function ProductCard({
  product,
  variant = "standard",
  className,
}: {
  product: ProductDTO;
  variant?: "standard" | "feature";
  className?: string;
}) {
  const t = useTranslations("home.collection");
  const [pending, startTransition] = useTransition();

  const isFeature = variant === "feature";
  const aspect = isFeature ? "aspect-[5/5.4]" : "aspect-[4/5]";

  return (
    <article
      className={cn(
        "group flex flex-col gap-4.5",
        isFeature && "col-span-2 row-span-2 md:col-span-4",
        !isFeature && "col-span-2 md:col-span-2",
        className,
      )}
    >
      <Link
        href={`/shop/${product.slug}` as never}
        className="card-elev card-elev-hover relative block overflow-hidden rounded-sm"
      >
        <div className={cn("relative w-full overflow-hidden", aspect)}>
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            sizes={
              isFeature
                ? "(max-width: 1024px) 100vw, 66vw"
                : "(max-width: 720px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 60%, rgba(26,35,48,0.08))",
            }}
          />
        </div>
        {product.badge && (
          <span className="absolute left-3.5 top-3.5 rounded-full bg-paper/90 px-3 py-1.5 font-caps text-[10px] uppercase tracking-[0.22em] text-ink backdrop-blur-sm">
            {product.badge}
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          <span className="text-blue-deep">{product.category.name}</span>
          {product.editionNumber != null && (
            <span>{formatEditionNumber(product.editionNumber)}</span>
          )}
        </div>

        <Link
          href={`/shop/${product.slug}` as never}
          className={cn(
            "mt-0.5 font-serif font-normal leading-tight tracking-[-0.005em] text-ink hover:text-blue-deep transition",
            isFeature ? "text-[clamp(28px,2.6vw,38px)]" : "text-[22px]",
          )}
        >
          {product.name}
        </Link>

        {isFeature && product.tagline && (
          <p className="mt-1.5 max-w-[48ch] font-serif text-base leading-relaxed text-ink-2">
            {product.tagline}
          </p>
        )}

        <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-line pt-3">
          <PriceTag value={product.basePrice} size={isFeature ? "lg" : "md"} />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(() => {
                void addToCartAction({
                  productId: product.id,
                  quantity: 1,
                });
              })
            }
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-ink bg-ink px-4 py-2.5 font-caps text-[10px] uppercase tracking-[0.2em] text-bg transition hover:bg-ink-2 disabled:opacity-60"
          >
            {pending ? "…" : t("addToBag")}
          </button>
        </div>
      </div>
    </article>
  );
}
