import Decimal from "decimal.js";

/**
 * Format an amount as Turkish Lira (₺). Accepts a string, number, or Decimal.
 * Prisma `Decimal` arrives as a special type — pass via `.toString()` if needed.
 */
export function formatTRY(value: string | number | Decimal, locale = "tr-TR"): string {
  const n = typeof value === "string" ? Number(value) : value instanceof Decimal ? value.toNumber() : value;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Format a price without currency symbol (for compact card display). */
export function formatPrice(value: string | number | Decimal, locale = "tr-TR"): string {
  const n = typeof value === "string" ? Number(value) : value instanceof Decimal ? value.toNumber() : value;
  return `₺ ${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n)}`;
}

/** Roman numerals for editorial display ("N° XIV" → editionNumber 14). */
export function romanize(num: number): string {
  if (num <= 0 || !Number.isInteger(num)) return String(num);
  const map: Array<[number, string]> = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let n = num;
  let out = "";
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

/** "N° 014" style — zero-padded three digits, used in editorial cards. */
export function formatEditionNumber(n: number | null | undefined): string {
  if (n == null) return "";
  return `N° ${String(n).padStart(3, "0")}`;
}

/** Editorial date — "14.06.'26" style used in EventList. */
export function formatEventDate(d: Date): { day: string; month: string; year: string } {
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = `'${String(d.getFullYear()).slice(-2)}`;
  return { day, month, year };
}
