/**
 * Turkish-aware slug generator.
 *
 * Edge case: JS `"İ".toLowerCase()` yields "i̇" (lowercase i + combining dot
 * above U+0307). We strip combining marks AFTER lowercasing so the result is
 * "i" not the empty visual.
 */
const trMap: Record<string, string> = {
  ş: "s",
  Ş: "s",
  ç: "c",
  Ç: "c",
  ı: "i",
  I: "i",
  İ: "i",
  ğ: "g",
  Ğ: "g",
  ü: "u",
  Ü: "u",
  ö: "o",
  Ö: "o",
};

export function slugify(input: string): string {
  let s = input;
  // Replace Turkish letters with ASCII equivalents BEFORE lowercasing — handles
  // the İ → i̇ trap cleanly.
  for (const [tr, ascii] of Object.entries(trMap)) {
    s = s.split(tr).join(ascii);
  }
  // Lowercase, then strip remaining combining marks defensively
  s = s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  // Replace non-alphanumeric with dashes; collapse and trim.
  return s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
