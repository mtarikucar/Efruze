import { z } from "zod";
import type { EventKind } from "@prisma/client";

export const eventTranslationSchema = z.object({
  locale: z.enum(["tr", "en"]),
  tag: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  description: z.string().max(4000),
  meta: z.string().min(1).max(300),
  ctaLabel: z.string().min(1).max(80),
});

export const eventInputSchema = z.object({
  slug: z.string().optional().or(z.literal("")),
  date: z.string(), // ISO-like datetime-local
  kind: z.enum(["WORKSHOP", "DROP", "EXHIBITION", "VISIT", "OTHER"]),
  imageUrl: z.string().optional().or(z.literal("")),
  priceText: z.string().max(40).optional().or(z.literal("")),
  ctaUrl: z.string().min(1).max(300).default("/contact"),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(99_999).default(0),
  translations: z.array(eventTranslationSchema).min(1),
});

export type EventInput = z.infer<typeof eventInputSchema>;

export type EventDTO = {
  id: string;
  slug: string;
  date: string; // ISO
  kind: EventKind;
  imageUrl: string | null;
  priceText: string | null;
  ctaUrl: string;
  isPublished: boolean;
  // resolved from EventTranslation
  tag: string;
  title: string;
  description: string;
  meta: string;
  ctaLabel: string;
};
