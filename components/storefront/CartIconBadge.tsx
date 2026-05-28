"use client";

import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/cn";

export function CartIconBadge({
  count,
  onOpen,
  className,
}: {
  count: number;
  onOpen?: () => void;
  className?: string;
}) {
  const t = useTranslations("nav");
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("bag")}
      className={cn(
        "inline-flex items-center gap-2 font-caps text-[11.5px] uppercase tracking-[0.18em] text-ink/85 transition hover:text-ink",
        className,
      )}
    >
      <ShoppingBag size={15} strokeWidth={1.25} className="hidden md:inline-block" />
      <span>{t("bag")}</span>
      <span
        aria-hidden="true"
        className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 font-sans text-[10px] tracking-normal text-bg"
      >
        {count}
      </span>
    </button>
  );
}
