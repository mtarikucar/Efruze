"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { BrandWordmark } from "./BrandWordmark";
import { CartIconBadge } from "./CartIconBadge";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { NavSearch } from "./NavSearch";
import type { NavUser } from "./NavShell";

export function Nav({
  cartCount = 0,
  onOpenCart,
  user,
}: {
  cartCount?: number;
  onOpenCart?: () => void;
  user?: NavUser;
}) {
  const t = useTranslations("nav");
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck((window.scrollY || 0) > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-[background,backdrop-filter,padding,border-color] duration-300 border-b border-transparent",
        stuck
          ? "bg-paper/85 backdrop-blur-md backdrop-saturate-150 py-3 border-line"
          : "bg-transparent py-[18px]",
      )}
      style={{ paddingLeft: "var(--pad)", paddingRight: "var(--pad)" }}
    >
      <div className="mx-auto grid max-w-[var(--maxw)] grid-cols-[1fr_auto_1fr] items-center gap-6">
        {/* Left links + mobile menu */}
        <div className="flex items-center gap-7">
          <MobileMenuSheet />
          <nav className="hidden md:flex md:gap-7">
            {[
              { href: "/shop", label: t("atelier") },
              { href: "/maison", label: t("maison") },
              { href: "/events", label: t("events") },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-caps text-[11.5px] uppercase tracking-[0.18em] text-ink/80 transition hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center brand */}
        <Link href="/" aria-label="efruze, ana sayfa" className="text-center">
          <BrandWordmark size="md" />
        </Link>

        {/* Right links + cart */}
        <div className="flex items-center justify-end gap-7">
          <nav className="hidden md:flex md:gap-7">
            <Link
              href="/maison"
              className="font-caps text-[11.5px] uppercase tracking-[0.18em] text-ink/80 transition hover:text-ink"
            >
              {t("maison")}
            </Link>
            <Link
              href={user ? "/account" : "/sign-in"}
              className="font-caps text-[11.5px] uppercase tracking-[0.18em] text-ink/80 transition hover:text-ink"
            >
              {user ? t("account") : t("signIn")}
            </Link>
          </nav>
          <NavSearch />
          <CartIconBadge count={cartCount} onOpen={onOpenCart} />
        </div>
      </div>
    </header>
  );
}
