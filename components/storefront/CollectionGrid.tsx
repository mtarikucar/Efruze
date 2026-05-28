import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "./ProductCard";
import type { ProductDTO } from "@/server/types/product";

export function CollectionGrid({ products }: { products: ProductDTO[] }) {
  const t = useTranslations("home.collection");
  if (products.length === 0) return null;

  const [feature, ...rest] = products;

  return (
    <section
      className="section-frame relative z-[2]"
      id="collection"
      data-screen-label="02 collection"
    >
      <header className="mb-16 flex flex-col gap-4">
        <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
          <span className="mr-1.5 text-gold">I —</span> {t("eyebrow")}
        </div>
        <h2
          className="serif-display m-0 max-w-[900px] font-serif font-light text-ink"
          style={{
            fontSize: "clamp(36px, 5.4vw, 68px)",
            lineHeight: 1.02,
          }}
        >
          {t("title")} <em className="italic text-blue-deep">{t("titleEm")}</em>
          <br />
          {t("titleSuffix")}
        </h2>
        <div className="font-caps text-[11px] uppercase tracking-[0.22em]">
          <Link href="/shop" className="link-underline">
            {t("viewAll")}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-x-8 md:gap-y-12 lg:grid-cols-6">
        <ProductCard product={feature} variant="feature" />
        {rest.map((p) => (
          <ProductCard key={p.id} product={p} variant="standard" />
        ))}
      </div>
    </section>
  );
}
