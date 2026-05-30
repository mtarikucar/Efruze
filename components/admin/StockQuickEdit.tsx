"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { updateVariantStockAction } from "@/app/admin/products/actions";

/**
 * Inline stock editor shown on single-variant catalog cards so the admin can
 * restock without opening the full product form. Rendered as a sibling of the
 * card's link (never nested inside it).
 */
export function StockQuickEdit({
  variantId,
  stock,
}: {
  variantId: string;
  stock: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(stock));
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const dirty = value !== "" && value !== String(stock);

  function save() {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return;
    start(async () => {
      const r = await updateVariantStockAction({ variantId, stock: n });
      if (r.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 1500);
      }
    });
  }

  return (
    <div className="flex flex-none items-center gap-1.5">
      <span className="font-caps text-[9px] uppercase tracking-[0.18em] text-ink-mute">
        stok
      </span>
      <input
        value={value}
        inputMode="numeric"
        aria-label="Stok"
        onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
        className={`w-12 rounded-sm border bg-paper px-1.5 py-1 text-center font-serif text-sm text-ink outline-none focus:border-ink ${
          Number(value) <= 3 ? "border-gold/60 text-gold" : "border-line"
        }`}
      />
      {dirty && (
        <button
          type="button"
          onClick={save}
          disabled={pending}
          aria-label="Stoğu kaydet"
          className="inline-flex items-center rounded-sm border border-ink bg-ink px-1.5 py-1 text-bg transition hover:bg-ink-2 disabled:opacity-50"
        >
          <Check size={12} strokeWidth={2} />
        </button>
      )}
      {saved && !dirty && (
        <span className="font-caps text-[10px] text-emerald-700">✓</span>
      )}
    </div>
  );
}
