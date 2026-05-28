"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

export function NavSearch() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  function submit() {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    setOpen(false);
    setQ("");
    // Navigate via plain router so the user can see /shop?q=… in the URL and share it.
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={t("search")}
        className="inline-flex items-center gap-2 font-caps text-[11.5px] uppercase tracking-[0.18em] text-ink/80 transition hover:text-ink"
      >
        <Search size={15} strokeWidth={1.25} />
        <span className="hidden md:inline">{t("search")}</span>
      </SheetTrigger>
      <SheetContent side="top" className="max-h-[60vh]" showClose={false}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-auto flex h-full max-w-3xl flex-col gap-6 px-8 py-12"
        >
          <SheetTitle className="sr-only">{t("search")}</SheetTitle>
          <SheetDescription className="sr-only">{t("searchHelp")}</SheetDescription>

          <div className="flex items-center justify-between">
            <span className="font-caps text-[10px] uppercase tracking-[0.32em] text-gold">
              <span className="mr-1.5">—</span> {t("search")}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("close")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition hover:bg-bg-deep hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative">
            <Search
              size={18}
              strokeWidth={1.25}
              className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-ink-mute"
            />
            <input
              autoFocus
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full border-0 border-b border-line bg-transparent pl-9 pr-3 py-4 font-serif text-2xl italic text-ink outline-none placeholder:italic placeholder:text-ink-mute focus:border-ink"
            />
          </div>

          <p className="m-0 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
            {t("searchHelp")}
          </p>
        </form>
      </SheetContent>
    </Sheet>
  );
}
