import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function StoryMaison() {
  const t = useTranslations("home.story");

  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];

  return (
    <section
      className="relative z-[2] border-t border-b border-line bg-bg-deep/40"
      id="story"
    >
      <div
        className="mx-auto grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20"
        style={{
          maxWidth: "var(--maxw)",
          paddingLeft: "var(--pad)",
          paddingRight: "var(--pad)",
          paddingTop: "clamp(80px, 10vw, 140px)",
          paddingBottom: "clamp(80px, 10vw, 140px)",
        }}
      >
        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
            <Image
              src="/ebru-detail.png"
              alt="Alanya atölyesi"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-4 font-caps text-[10px] uppercase tracking-[0.24em] text-ink-2">
            {t("caption")}
            <br />
            <span className="font-serif italic text-sm tracking-normal text-ink-mute normal-case">
              {t("captionSub")}
            </span>
          </figcaption>
        </div>

        <div className="flex max-w-[520px] flex-col gap-4.5">
          <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
            <span className="mr-1.5 text-gold">II —</span> {t("eyebrow")}
          </div>
          <h2
            className="serif-display m-0 mt-2 mb-3 font-serif font-light text-ink"
            style={{
              fontSize: "clamp(34px, 4.4vw, 56px)",
              lineHeight: 1.04,
            }}
          >
            {t("title")} <em className="italic text-blue-deep">{t("titleEm")}</em>
            <br />
            {t("titleSuffix")}
          </h2>

          <p className="m-0 max-w-[46ch] font-serif text-lg leading-relaxed text-ink-2">
            {t("p1")}
          </p>
          <p className="m-0 max-w-[46ch] font-serif text-lg leading-relaxed text-ink-2">
            {t("p2")}
          </p>

          <ul className="m-0 mt-2.5 mb-4 flex list-none flex-col gap-2 p-0">
            {steps.map((step, i) => (
              <li
                key={i}
                className="flex items-baseline gap-4 border-t border-line py-2.5 font-sans text-sm text-ink-2 last:border-b"
              >
                <span className="min-w-[32px] font-serif italic text-lg text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>

          <div>
            <Link href="/maison" className="link-underline">
              {t("readMore")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
