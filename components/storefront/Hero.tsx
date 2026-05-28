"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const t = useTranslations("home");

  return (
    <section
      className="relative flex min-h-[100vh] flex-col items-center justify-center pt-[140px] pb-20 text-center"
      style={{ paddingLeft: "var(--pad)", paddingRight: "var(--pad)" }}
    >
      <div className="mb-9 flex items-center gap-4 font-caps text-[11px] uppercase tracking-[0.32em] text-ink/70">
        <span className="block h-px w-12 bg-current opacity-50" aria-hidden="true" />
        <span>{t("heroEyebrow")}</span>
        <span className="block h-px w-12 bg-current opacity-50" aria-hidden="true" />
      </div>

      <h1
        className="serif-display m-0 mb-7 max-w-[1200px] font-serif font-light text-ink"
        style={{
          fontSize: "clamp(54px, 9.4vw, 144px)",
          lineHeight: 0.96,
        }}
      >
        <span className="block">{t("heroTitleA")}</span>
        <span className="block">
          <em className="italic font-light text-blue-deep">{t("heroTitleB")}</em>,
        </span>
        <span className="block">{t("heroTitleC")}</span>
      </h1>

      <p
        className="mx-auto mb-10 max-w-[560px] font-serif font-normal text-ink-2"
        style={{
          fontSize: "clamp(17px, 1.5vw, 21px)",
          lineHeight: 1.55,
        }}
      >
        {t("heroSub")}
      </p>

      <div className="mb-16 flex flex-wrap justify-center gap-3.5">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-ink bg-ink px-6 py-4 font-caps text-[11.5px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2 hover:-translate-y-px"
        >
          {t("ctaShop")}
        </Link>
        <Link
          href="/maison"
          className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-ink bg-paper/40 backdrop-blur-sm px-6 py-4 font-caps text-[11.5px] uppercase tracking-[0.22em] text-ink transition hover:bg-paper hover:-translate-y-px"
        >
          {t("ctaProcess")}
          <ArrowRight size={14} strokeWidth={1} />
        </Link>
      </div>

      <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-[18px] font-caps text-[11px] uppercase tracking-[0.22em] text-ink-2/80">
        <div>
          <span className="font-semibold text-ink">14</span> {t("metaArtisans")}
        </div>
        <span className="hidden h-[3px] w-[3px] rounded-full bg-current opacity-40 sm:block" aria-hidden="true" />
        <div>
          <span className="font-semibold text-ink">1 / 1</span> {t("metaPieces")}
        </div>
        <span className="hidden h-[3px] w-[3px] rounded-full bg-current opacity-40 sm:block" aria-hidden="true" />
        <div>
          {t("metaFrom")} <span className="font-semibold text-ink">{t("metaIstanbul")}</span>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2.5 font-caps text-[10px] uppercase tracking-[0.34em] text-ink-2/70 sm:flex"
      >
        <span>{t("scroll")}</span>
        <span
          className="block h-12 w-px bg-gradient-to-b from-current to-transparent"
          style={{ animation: "scroll-cue 2.4s ease-in-out infinite" }}
        />
      </div>
    </section>
  );
}
