"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";

const TABS: Array<{ href: string; label: string }> = [
  { href: "/admin/products", label: "Ürünler" },
  { href: "/admin/categories", label: "Kategoriler" },
];

/**
 * Shared tab strip for the unified Katalog area. Rendered at the top of both
 * the products and categories list pages so the two feel like one section.
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
