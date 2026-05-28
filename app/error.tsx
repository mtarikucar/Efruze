"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

export default function Error({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  // Next.js 16.2+ forwards `unstable_retry`, which re-fetches and re-renders the
  // failed segment. Prefer it when present, otherwise fall back to `reset`.
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <section
      className="section-frame relative z-[2] flex min-h-[60vh] flex-col items-center justify-center text-center"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
        <span className="mr-1.5 text-gold">—</span> Hata
      </div>
      <h1
        className="serif-display m-0 mt-5 font-serif font-light text-ink"
        style={{ fontSize: "clamp(40px, 6.4vw, 84px)", lineHeight: 1.02 }}
      >
        Bir şeyler <em className="italic text-blue-deep">ters gitti.</em>
      </h1>
      <p className="m-0 mt-5 max-w-md font-serif text-lg italic leading-snug text-ink-2">
        Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin; sorun sürerse kısa
        süre sonra yeniden ziyaret edin.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        {retry && (
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2"
          >
            Tekrar dene
          </button>
        )}
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-ink bg-transparent px-7 py-3.5 font-caps text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-bg-deep"
        >
          Ana sayfa
        </Link>
      </div>
    </section>
  );
}
