import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StaticPageHeader } from "@/components/storefront/StaticPageHeader";
import { OrderLookupForm } from "@/components/storefront/OrderLookupForm";

export const metadata: Metadata = {
  title: "Sipariş Sorgula · efruze",
  // Lookup results expose order PII — keep this page out of search indexes.
  robots: { index: false, follow: true },
};

export default async function OrderLookupPage() {
  const t = await getTranslations("orderLookup");

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      <StaticPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        titleEm={t("titleEm")}
        sub={t("sub")}
      />

      <div className="mx-auto max-w-3xl">
        <OrderLookupForm />
      </div>
    </section>
  );
}
