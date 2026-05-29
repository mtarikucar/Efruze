"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function AdminNavLink({
  href,
  children,
  match,
}: {
  href: string;
  children: React.ReactNode;
  /** Extra path prefixes that also mark this link active — e.g. "Katalog"
   * links to /admin/products but stays active under /admin/categories too. */
  match?: readonly string[];
}) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (href !== "/admin" && pathname.startsWith(href)) ||
    (match?.some((m) => pathname === m || pathname.startsWith(m)) ?? false);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-sm px-3 py-2 font-caps text-[11px] uppercase tracking-[0.22em] transition",
        active
          ? "bg-ink text-bg"
          : "text-ink-2 hover:bg-bg-deep hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
