import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { AddToBagPanel } from "@/components/storefront/AddToBagPanel";
import { PriceTag } from "@/components/storefront/PriceTag";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/storefront/ProductJsonLd";
import ModelViewer from "@/components/storefront/ModelViewer";
import { safeGetBySlug, safeGetRelated } from "@/server/services/catalog";
import { formatEditionNumber } from "@/lib/format";
import type { AppLocale } from "@/i18n/routing";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as AppLocale;
  const product = await safeGetBySlug(slug, locale);
  if (!product) return { title: "Not found" };
  return {
    title: product.name,
    description: product.tagline ?? product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.tagline ?? product.description ?? undefined,
      images: [{ url: product.imageUrl, width: 1200, height: 1200 }],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const locale = (await getLocale()) as AppLocale;
  const product = await safeGetBySlug(slug, locale);
  if (!product) notFound();

  const t = await getTranslations("product");
  const related = await safeGetRelated(product.id, product.category.slug, locale, 4);

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(140px, 12vw, 200px)" }}
    >
      {/* Breadcrumb */}
      <nav
        className="mb-10 flex flex-wrap items-center gap-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="transition hover:text-ink">efruze</Link>
        <span aria-hidden="true">·</span>
        <Link href="/shop" className="transition hover:text-ink">Atelier</Link>
        <span aria-hidden="true">·</span>
        <Link
          href={`/shop?category=${product.category.slug}` as never}
          className="transition hover:text-ink"
        >
          {product.category.name}
        </Link>
        <span aria-hidden="true">·</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          {product.model3d ? (
            <ModelViewer
              glbUrl={product.model3d.glbUrl}
              usdzUrl={product.model3d.usdzUrl}
              posterUrl={product.model3d.posterUrl ?? product.imageUrl}
              alt={product.name}
            />
          ) : (
            <ProductGallery images={product.images} alt={product.name} />
          )}
        </div>

        <div className="flex flex-col gap-6 lg:max-w-md">
          <div className="flex items-center justify-between font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
            <span className="text-blue-deep">{product.category.name}</span>
            {product.editionNumber != null && (
              <span>{formatEditionNumber(product.editionNumber)}</span>
            )}
          </div>

          <h1
            className="serif-display m-0 font-serif font-light text-ink"
            style={{ fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.04 }}
          >
            {product.name}
          </h1>

          {product.tagline && (
            <p className="m-0 font-serif italic text-lg leading-snug text-ink-2">
              {product.tagline}
            </p>
          )}

          <PriceTag value={product.basePrice} size="lg" />

          <AddToBagPanel product={product} />

          {product.description && (
            <section className="mt-4 border-t border-line pt-6">
              <div className="mb-3 font-caps text-[10px] uppercase tracking-[0.28em] text-gold">
                {t("atelierNote")}
              </div>
              <p className="m-0 max-w-[60ch] font-serif text-base leading-relaxed text-ink-2">
                {product.description}
              </p>
            </section>
          )}

          {product.materials && (
            <section className="border-t border-line pt-6">
              <div className="mb-3 font-caps text-[10px] uppercase tracking-[0.28em] text-gold">
                {t("materials")}
              </div>
              <p className="m-0 font-serif text-base leading-relaxed text-ink-2">
                {product.materials}
              </p>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24 border-t border-line pt-16 sm:mt-32">
          <div className="mb-10 font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
            <span className="mr-1.5 text-gold">—</span> {t("related")}
          </div>
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} variant="standard" />
            ))}
          </div>
        </section>
      )}

      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd
        trail={[
          { name: "efruze", href: "/" },
          { name: "Atelier", href: "/shop" },
          { name: product.category.name, href: `/shop?category=${product.category.slug}` },
          { name: product.name, href: `/shop/${product.slug}` },
        ]}
      />
    </section>
  );
}
