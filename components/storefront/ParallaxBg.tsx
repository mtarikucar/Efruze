"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed video bed behind all content. RAF-batched scroll listener applies a
 * parallax translate to the video and ramps the cream veil opacity. The grain
 * overlay is a CSS-only dot pattern (no asset needed).
 */
export function ParallaxBg() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const intensity = 0.55;

    const update = () => {
      rafRef.current = null;
      const y = window.scrollY || 0;
      const py = -y * intensity * 0.35;
      if (videoRef.current) {
        videoRef.current.style.transform = `translate3d(0, ${py.toFixed(1)}px, 0) scale(1.04)`;
      }
      if (veilRef.current) {
        const t = Math.min(1, y / 600);
        veilRef.current.style.opacity = String(0.85 + t * 0.15);
      }
    };

    const onScroll = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // Coax autoplay on iOS Safari
    const v = videoRef.current;
    if (v) {
      const play = () => v.play().catch(() => undefined);
      play();
      document.addEventListener("visibilitychange", play);
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        document.removeEventListener("visibilitychange", play);
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      };
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <video
        ref={videoRef}
        className="absolute -inset-y-[12%] -inset-x-[4%] h-[124%] w-[108%] object-cover"
        style={{
          filter: "saturate(1.05) contrast(1.02)",
          willChange: "transform",
          transform: "translate3d(0, 0, 0) scale(1.04)",
        }}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/ebru-poster.jpg"
      >
        <source src="/ebru-bg.mp4" type="video/mp4" />
      </video>
      <div
        ref={veilRef}
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(243,236,224,0.32) 0%, rgba(243,236,224,0.78) 60%, rgba(243,236,224,0.94) 100%), linear-gradient(180deg, rgba(243,236,224,0.35) 0%, rgba(243,236,224,0.55) 30%, rgba(243,236,224,0.85) 65%, var(--color-bg) 100%)",
          opacity: 0.85,
        }}
      />
      <div
        className="absolute inset-0 mix-blend-multiply opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(rgba(26,35,48,0.04) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
    </div>
  );
}
