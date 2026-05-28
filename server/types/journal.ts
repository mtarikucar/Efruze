import { z } from "zod";

export const journalTranslationSchema = z.object({
  locale: z.enum(["tr", "en"]),
  category: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  excerpt: z.string().max(4000),
  body: z.string().max(40_000),
});

export const journalInputSchema = z.object({
  slug: z.string().optional().or(z.literal("")),
  date: z.string(),
  imageUrl: z.string().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  readMinutes: z.coerce.number().int().min(1).max(120).default(5),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(99_999).default(0),
  translations: z.array(journalTranslationSchema).min(1),
});

export type JournalInput = z.infer<typeof journalInputSchema>;

export type JournalEntryDTO = {
  id: string;
  slug: string;
  date: string;
  imageUrl: string | null;
  featured: boolean;
  readMinutes: number;
  isPublished: boolean;
  // resolved from translations
  category: string;
  title: string;
  excerpt: string;
  body: string;
};
