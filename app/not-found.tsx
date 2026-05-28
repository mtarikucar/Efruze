import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { title: "Sayfa bulunamadı · efruze" };

export default function NotFound() {
  return (
    <section
      className="section-frame relative z-[2] flex min-h-[60vh] flex-col items-center justify-center text-center"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
        <span className="mr-1.5 text-gold">—</span> 404
      </div>
      <h1
        className="serif-display m-0 mt-5 font-serif font-light text-ink"
        style={{ fontSize: "clamp(40px, 6.4vw, 84px)", lineHeight: 1.02 }}
      >
        Sayfa <em className="italic text-blue-deep">bulunamadı.</em>
      </h1>
      <p className="m-0 mt-5 max-w-md font-serif text-lg italic leading-snug text-ink-2">
        Aradığınız sayfa kaldırılmış ya da hiç var olmamış olabilir.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2"
        >
          Ana sayfa
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-full border border-ink bg-transparent px-7 py-3.5 font-caps text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-bg-deep"
        >
          Mağaza
        </Link>
      </div>
    </section>
  );
}
