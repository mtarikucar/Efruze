import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export function PriceTag({
  value,
  className,
  size = "md",
}: {
  value: string | number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  } as const;

  return (
    <span
      className={cn(
        "font-serif font-medium text-ink tracking-[0.005em]",
        sizes[size],
        className,
      )}
    >
      {formatPrice(value)}
    </span>
  );
}
