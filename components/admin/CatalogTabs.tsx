"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";

const TABS: Array<{ href: string; label: string }> = [
  { href: "/admin/products", label: "Katalog" },
  { href: "/admin/categories", label: "Kategorileri yönet" },
];

/**
 * Shared tab strip for the unified Katalog area. "Katalog" is the merged
 * tree (categories + their products); "Kategorileri yönet" is the focused
 * category-metadata view.
 */
export function CatalogTabs() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full border px-4 py-2 font-caps text-[10px] uppercase tracking-[0.22em] transition",
              active
                ? "border-ink bg-ink text-bg"
                : "border-line text-ink-2 hover:border-ink hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
