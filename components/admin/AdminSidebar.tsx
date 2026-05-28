"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/storefront/BrandWordmark";
import { AdminNavLink } from "./AdminNavLink";
import { signOutAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/cn";

const NAV: ReadonlyArray<readonly [string, string]> = [
  ["/admin", "Panel"],
  ["/admin/orders", "Siparişler"],
  ["/admin/bank-transfers", "Havale onayları"],
  ["/admin/products", "Ürünler"],
  ["/admin/categories", "Kategoriler"],
  ["/admin/events", "Etkinlikler"],
  ["/admin/journal", "Günce"],
  ["/admin/faq", "SSS"],
  ["/admin/pages", "Sayfalar"],
  ["/admin/maison", "Maison"],
  ["/admin/coupons", "Kuponlar"],
  ["/admin/customers", "Müşteriler"],
  ["/admin/banks", "Banka hesapları"],
  ["/admin/settings", "Ayarlar"],
];

export function AdminSidebar({
  userLabel,
  role,
}: {
  userLabel: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Collapse the mobile menu whenever the route changes (tapped a nav link).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile top bar — brand + hamburger. Hidden on lg where the full
          sidebar is always visible. */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-paper px-5 py-4 lg:hidden">
        <Link href="/" className="inline-block">
          <BrandWordmark size="sm" showSub={false} />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition hover:border-ink"
        >
          {open ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
        </button>
      </div>

      <aside
        className={cn(
          "bg-paper px-6 pb-8 lg:block lg:border-r lg:border-line lg:py-8",
          open ? "block border-b border-line pt-6" : "hidden",
        )}
      >
        {/* Brand block — desktop only; mobile shows it in the top bar. */}
        <div className="hidden lg:block">
          <Link href="/" className="inline-block">
            <BrandWordmark size="md" showSub={false} />
          </Link>
          <div className="mt-2 font-caps text-[9px] uppercase tracking-[0.32em] text-gold">
            Atölye · yönetim
          </div>
        </div>

        <nav className="flex flex-col gap-1 lg:mt-10">
          {NAV.map(([href, label]) => (
            <AdminNavLink key={href} href={href}>
              {label}
            </AdminNavLink>
          ))}
        </nav>

        <div className="mt-10 border-t border-line pt-6 lg:mt-12">
          <div className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
            {userLabel}
          </div>
          <div className="mt-1 font-caps text-[9px] uppercase tracking-[0.22em] text-gold">
            {role}
          </div>
          <form action={signOutAction} className="mt-4">
            <button
              type="submit"
              className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute transition hover:text-ink"
            >
              Çıkış yap
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
