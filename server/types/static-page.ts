import { z } from "zod";

export const staticPageTranslationSchema = z.object({
  locale: z.enum(["tr", "en"]),
  title: z.string().min(1).max(300),
  intro: z.string().max(2000).optional().or(z.literal("")),
  body: z.string().min(1).max(20_000),
});

export const staticPageInputSchema = z.object({
  slug: z.string().min(1).max(120),
  isActive: z.boolean().default(true),
  translations: z.array(staticPageTranslationSchema).min(1),
});

export type StaticPageInput = z.infer<typeof staticPageInputSchema>;

export type StaticPageDTO = {
  id: string;
  slug: string;
  isActive: boolean;
  title: string;
  intro: string | null;
  body: string;
};
