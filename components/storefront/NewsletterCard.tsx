"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { subscribeNewsletterAction } from "@/app/(storefront)/actions";

export function NewsletterCard() {
  const t = useTranslations("home.newsletter");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <section
      className="relative z-[2]"
      style={{
        paddingLeft: "var(--pad)",
        paddingRight: "var(--pad)",
        paddingTop: 60,
        paddingBottom: 60,
      }}
      id="journal"
    >
      <div
        className="relative mx-auto max-w-[780px] overflow-hidden rounded card-elev text-center"
        style={{ padding: "clamp(40px, 6vw, 72px)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            background: "url('/ebru-detail.png') center / cover",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 inline-block font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
          <span className="mr-1.5 text-gold">IV —</span> {t("eyebrow")}
        </div>

        <h2
          className="serif-display relative z-10 m-0 mt-3.5 mb-3.5 font-serif font-light text-ink"
          style={{ fontSize: "clamp(32px, 4.2vw, 52px)", lineHeight: 1.04 }}
        >
          {t("title")}
          <br />
          {t("titleSuffix")}
        </h2>

        <p className="relative z-10 mx-auto mb-7 max-w-[480px] font-serif text-lg leading-relaxed text-ink-2">
          {t("sub")}
        </p>

        {done ? (
          <p className="relative z-10 font-serif italic text-base text-ink">
            {t("thanks")}
          </p>
        ) : (
          <form
            className="relative z-10 mx-auto flex max-w-[480px] items-stretch border-b border-ink"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await subscribeNewsletterAction({ email });
                if (result?.ok) setDone(true);
              });
            }}
          >
            <input
              type="email"
              required
              placeholder={t("placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border-0 bg-transparent px-1 py-3.5 font-serif italic text-base text-ink outline-none placeholder:italic placeholder:text-ink-mute"
            />
            <button
              type="submit"
              disabled={pending || email.length === 0}
              className="border-0 bg-transparent pl-4 pr-1 py-3.5 font-caps text-[11.5px] uppercase tracking-[0.22em] text-ink transition disabled:opacity-50"
            >
              {pending ? "…" : t("submit")}
            </button>
          </form>
        )}

        <div className="relative z-10 mt-4 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {t("fine")}
        </div>
      </div>
    </section>
  );
}
