import { findActiveCategories } from "@/server/db/categories";
import type { AppLocale } from "@/i18n/routing";

export type CategoryDTO = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  children: CategoryDTO[];
};

function pickTranslation<T extends { locale: string }>(rows: T[], locale: AppLocale): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "tr") ?? rows[0];
}

export const CategoryService = {
  async listTree(locale: AppLocale): Promise<CategoryDTO[]> {
    const rows = await findActiveCategories();
    return rows.map((c): CategoryDTO => {
      const t = pickTranslation(c.translations, locale);
      return {
        id: c.id,
        slug: c.slug,
        name: t?.name ?? c.slug,
        description: t?.description ?? null,
        imageUrl: c.imageUrl,
        children: c.children.map((cc) => {
          const ct = pickTranslation(cc.translations, locale);
          return {
            id: cc.id,
            slug: cc.slug,
            name: ct?.name ?? cc.slug,
            description: ct?.description ?? null,
            imageUrl: cc.imageUrl,
            children: [],
          };
        }),
      };
    });
  },
};
