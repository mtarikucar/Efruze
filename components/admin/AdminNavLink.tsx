"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));

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
