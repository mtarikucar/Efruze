export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div
        className="serif-display font-serif font-light text-ink"
        style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1 }}
      >
        efruze
      </div>
      <div className="h-px w-24 overflow-hidden bg-line-soft">
        <div className="h-full w-1/3 animate-pulse bg-ink" />
      </div>
      <span className="font-caps text-[10px] uppercase tracking-[0.32em] text-ink-mute">
        Yükleniyor…
      </span>
    </div>
  );
}
