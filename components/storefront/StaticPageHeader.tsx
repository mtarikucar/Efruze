export function StaticPageHeader({
  eyebrow,
  title,
  titleEm,
  titleSuffix,
  sub,
}: {
  eyebrow: string;
  title: string;
  titleEm?: string;
  titleSuffix?: string;
  sub?: string;
}) {
  return (
    <header className="mx-auto mb-16 flex max-w-3xl flex-col items-center gap-5 text-center">
      <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
        <span className="mr-1.5 text-gold">—</span> {eyebrow}
      </div>
      <h1
        className="serif-display m-0 font-serif font-light text-ink"
        style={{ fontSize: "clamp(40px, 6.4vw, 84px)", lineHeight: 1.02 }}
      >
        {title}
        {titleEm && (
          <>
            {" "}
            <em className="italic text-blue-deep">{titleEm}</em>
          </>
        )}
        {titleSuffix && <>{titleSuffix}</>}
      </h1>
      {sub && (
        <p className="m-0 max-w-2xl font-serif text-lg italic leading-snug text-ink-2">{sub}</p>
      )}
    </header>
  );
}
