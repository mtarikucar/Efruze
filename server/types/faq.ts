import { z } from "zod";

export const faqTranslationSchema = z.object({
  locale: z.enum(["tr", "en"]),
  question: z.string().min(1).max(400),
  answer: z.string().min(1).max(4000),
});

export const faqInputSchema = z.object({
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(99_999).default(0),
  translations: z.array(faqTranslationSchema).min(1),
});

export type FaqInput = z.infer<typeof faqInputSchema>;

export type FaqItemDTO = {
  id: string;
  sortOrder: number;
  isActive: boolean;
  question: string;
  answer: string;
};
