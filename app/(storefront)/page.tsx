import { getLocale } from "next-intl/server";
import { Hero } from "@/components/storefront/Hero";
import { MarqueeRibbon } from "@/components/storefront/MarqueeRibbon";
import { CollectionGrid } from "@/components/storefront/CollectionGrid";
import { StoryMaison } from "@/components/storefront/StoryMaison";
import { EventList } from "@/components/storefront/EventList";
import { NewsletterCard } from "@/components/storefront/NewsletterCard";
import { RevealOnScroll } from "@/components/storefront/RevealOnScroll";
import { safeGetFeatured } from "@/server/services/catalog";
import type { AppLocale } from "@/i18n/routing";

export default async function HomePage() {
  const locale = (await getLocale()) as AppLocale;
  const featured = await safeGetFeatured(locale, 6);

  return (
    <>
      <Hero />
      <MarqueeRibbon />
      <RevealOnScroll>
        <CollectionGrid products={featured} />
      </RevealOnScroll>
      <RevealOnScroll>
        <StoryMaison />
      </RevealOnScroll>
      <RevealOnScroll>
        <EventList />
      </RevealOnScroll>
      <RevealOnScroll>
        <NewsletterCard />
      </RevealOnScroll>
    </>
  );
}
