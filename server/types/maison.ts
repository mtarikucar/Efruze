import { z } from "zod";

/* --- Steps (4 numbered process items) --------------------------------- */

export const maisonStepTranslationSchema = z.object({
  locale: z.enum(["tr", "en"]),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
});

export const maisonStepInputSchema = z.object({
  sortOrder: z.coerce.number().int().min(0).max(99_999).default(0),
  isActive: z.boolean().default(true),
  translations: z.array(maisonStepTranslationSchema).min(1),
});

export type MaisonStepInput = z.infer<typeof maisonStepInputSchema>;

export type MaisonStepDTO = {
  id: string;
  sortOrder: number;
  isActive: boolean;
  title: string;
  description: string;
};

/* --- Artisans (3 portrait cards) -------------------------------------- */

export const maisonArtisanTranslationSchema = z.object({
  locale: z.enum(["tr", "en"]),
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  bio: z.string().min(1).max(2000),
});

export const maisonArtisanInputSchema = z.object({
  sortOrder: z.coerce.number().int().min(0).max(99_999).default(0),
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional().or(z.literal("")),
  translations: z.array(maisonArtisanTranslationSchema).min(1),
});

export type MaisonArtisanInput = z.infer<typeof maisonArtisanInputSchema>;

export type MaisonArtisanDTO = {
  id: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  name: string;
  role: string;
  bio: string;
};

/* --- The full Maison page payload ------------------------------------- */

export type MaisonContentDTO = {
  heroImageUrl: string | null;
  intro: string; // long-form, paragraph-separated text
  steps: MaisonStepDTO[];
  artisans: MaisonArtisanDTO[];
};
