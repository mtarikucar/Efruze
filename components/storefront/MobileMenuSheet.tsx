"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "./BrandWordmark";

export function MobileMenuSheet() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/shop", label: t("atelier") },
    { href: "/maison", label: t("maison") },
    { href: "/events", label: t("events") },
    { href: "/journal", label: t("journal") },
    { href: "/account", label: t("account") },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={t("menu")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition hover:text-ink md:hidden"
      >
        <Menu size={18} strokeWidth={1.25} />
      </SheetTrigger>
      <SheetContent side="left" className="max-w-sm">
        <div className="flex h-full flex-col px-8 py-10">
          <div className="mb-12">
            <BrandWordmark size="md" />
          </div>
          <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
          <SheetDescription className="sr-only">efruze menü</SheetDescription>
          <nav className="flex flex-col gap-5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-serif text-2xl text-ink transition hover:text-blue-deep"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-12 font-caps text-[11px] uppercase tracking-[0.32em] text-ink-mute">
            {t("brandSub")}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
