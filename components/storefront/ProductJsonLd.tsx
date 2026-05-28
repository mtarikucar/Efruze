import { env } from "@/lib/env";
import type { ProductDetailDTO } from "@/server/types/product";

export function ProductJsonLd({ product }: { product: ProductDetailDTO }) {
  const url = `${env.NEXT_PUBLIC_SITE_URL}/shop/${product.slug}`;
  const inStock = product.variants.some((v) => v.stock > 0);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? product.tagline ?? "",
    image: [product.imageUrl, ...product.images.map((i) => i.url)].filter(Boolean),
    sku: product.sku,
    brand: { "@type": "Brand", name: "efruze" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: product.currency,
      price: product.basePrice,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}

export function BreadcrumbJsonLd({ trail }: { trail: Array<{ name: string; href: string }> }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${env.NEXT_PUBLIC_SITE_URL}${t.href}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
