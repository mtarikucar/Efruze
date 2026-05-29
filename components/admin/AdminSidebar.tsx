"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/storefront/BrandWordmark";
import { AdminNavLink } from "./AdminNavLink";
import { signOutAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; match?: readonly string[] };

const NAV: readonly NavItem[] = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/orders", label: "Siparişler" },
  { href: "/admin/bank-transfers", label: "Havale onayları" },
  // Katalog = ürünler + kategoriler birleşik. Link ürün listesine gider,
  // kategori alt sayfalarında da aktif kalır.
  { href: "/admin/products", label: "Katalog", match: ["/admin/categories"] },
  { href: "/admin/events", label: "Etkinlikler" },
  { href: "/admin/journal", label: "Günce" },
  { href: "/admin/faq", label: "SSS" },
  { href: "/admin/pages", label: "Sayfalar" },
  { href: "/admin/maison", label: "Maison" },
  { href: "/admin/coupons", label: "Kuponlar" },
  { href: "/admin/customers", label: "Müşteriler" },
  { href: "/admin/banks", label: "Banka hesapları" },
  { href: "/admin/settings", label: "Ayarlar" },
];

// Links only visible to SUPER_ADMIN — appended to NAV when the role allows.
const SUPER_ADMIN_NAV: readonly NavItem[] = [
  { href: "/admin/users", label: "Yöneticiler" },
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

  const nav =
    role === "SUPER_ADMIN" ? [...NAV, ...SUPER_ADMIN_NAV] : NAV;

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
          {nav.map((item) => (
            <AdminNavLink key={item.href} href={item.href} match={item.match}>
              {item.label}
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
