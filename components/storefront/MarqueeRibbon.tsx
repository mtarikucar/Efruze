import { useTranslations } from "next-intl";

export function MarqueeRibbon() {
  const t = useTranslations("home.ribbon");

  const items = [
    t("shipping"),
    t("signed"),
    t("atelier"),
    t("unrepeatable"),
  ];
  // Duplicate the set so the track is exactly 2× wide and the keyframe
  // `translateX(-50%)` loops seamlessly.
  const track = [...items, ...items];

  return (
    <div
      className="relative z-[2] overflow-hidden border-t border-b border-white/5 bg-ink py-3.5 text-bg"
      aria-hidden="true"
    >
      <div
        className="flex items-center gap-9 whitespace-nowrap font-caps text-[11px] uppercase tracking-[0.32em]"
        style={{
          width: "max-content",
          animation: "marquee-slide 38s linear infinite",
        }}
      >
        {track.map((text, i) => (
          <span key={i} className="inline-flex items-center gap-9">
            <span>{text}</span>
            <span className="text-[7px] text-gold-soft/55">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
