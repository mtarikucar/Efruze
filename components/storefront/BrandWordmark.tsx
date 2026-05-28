import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export function BrandWordmark({
  size = "md",
  showSub = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showSub?: boolean;
  className?: string;
}) {
  const t = useTranslations("nav");
  const sizes = {
    sm: "text-xl",
    md: "text-[30px]",
    lg: "text-5xl",
  } as const;
  return (
    <span className={cn("inline-flex flex-col items-center gap-[2px] leading-none", className)}>
      <span
        className={cn(
          "font-serif font-normal italic tracking-[0.04em] leading-none text-ink",
          sizes[size],
        )}
      >
        efruze
      </span>
      {showSub && (
        <span className="font-caps text-[9px] tracking-[0.32em] uppercase text-ink-2/60">
          {t("brandSub")}
        </span>
      )}
    </span>
  );
}
