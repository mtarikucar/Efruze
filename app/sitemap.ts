import type { MetadataRoute } from "next";
import { prisma } from "@/server/db/client";
import { env } from "@/lib/env";

const STATIC_PATHS = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/maison", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${base}${p.path}`,
    lastModified: new Date(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
    alternates: {
      languages: {
        tr: `${base}${p.path}`,
        en: `${base}/en${p.path === "/" ? "" : p.path}`,
      },
    },
  }));

  // Add published products + active categories — both fail-soft when DB is down.
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    for (const p of products) {
      entries.push({
        url: `${base}/shop/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const c of categories) {
      entries.push({
        url: `${base}/shop?category=${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    /* DB unavailable — return the static entries only */
  }

  return entries;
}
