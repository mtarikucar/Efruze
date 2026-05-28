import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  const cols = [
    {
      h: t("h_shop"),
      links: [
        { href: "/shop?category=ipek", label: t("shop_silks") },
        { href: "/shop?category=baski", label: t("shop_prints") },
        { href: "/shop?category=seramik", label: t("shop_ceramics") },
        { href: "/shop?category=kagit", label: t("shop_paper") },
        { href: "/shop?category=cam", label: t("shop_glass") },
        { href: "/shop", label: t("shop_all") },
      ],
    },
    {
      h: t("h_maison"),
      links: [
        { href: "/maison", label: t("maison_process") },
        { href: "/maison#artisans", label: t("maison_artisans") },
        { href: "/maison#visits", label: t("maison_visits") },
        { href: "/journal", label: t("maison_journal") },
        { href: "/maison#press", label: t("maison_press") },
      ],
    },
    {
      h: t("h_service"),
      links: [
        // Shipping/care/bespoke answers live in FAQ until standalone pages ship.
        { href: "/faq", label: t("service_shipping") },
        { href: "/faq", label: t("service_care") },
        { href: "/contact", label: t("service_bespoke") },
        { href: "/contact", label: t("service_contact") },
        { href: "/faq", label: t("service_faq") },
      ],
    },
  ];

  return (
    <footer
      className="relative z-[2] bg-ink text-bg"
      style={{ paddingLeft: "var(--pad)", paddingRight: "var(--pad)" }}
    >
      <div className="mx-auto max-w-[var(--maxw)] pt-20 pb-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="font-serif text-5xl italic tracking-[0.04em] text-bg">efruze</div>
            <p className="mt-5 font-serif italic text-lg leading-snug text-bg/65 max-w-xs">
              {t("tag")}
            </p>
            <p className="mt-6 whitespace-pre-line font-caps text-[11px] uppercase tracking-[0.22em] leading-loose text-bg/55">
              {t("addr")}
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.h} className="flex flex-col gap-2.5">
              <div className="mb-2.5 font-caps text-[11px] uppercase tracking-[0.32em] text-gold-soft">
                {col.h}
              </div>
              {col.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="font-serif text-base text-bg/80 transition hover:text-bg"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-bg/10 pt-6 font-caps text-[10px] uppercase tracking-[0.24em] text-bg/50">
          <span>{t("copyright")}</span>
        </div>
      </div>
    </footer>
  );
}
