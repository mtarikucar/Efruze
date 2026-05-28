"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * <model-viewer> wrapper. Loads the Google model-viewer Web Component via CDN
 * (so it doesn't bundle three.js into our app). The script registers the
 * <model-viewer> custom element globally — once it's defined we render the tag.
 */
type Props = {
  glbUrl: string;
  usdzUrl?: string | null;
  posterUrl?: string | null;
  alt: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & Record<string, unknown>,
        HTMLElement
      >;
    }
  }
}

const MODEL_VIEWER_SRC =
  "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";

export default function ModelViewer({ glbUrl, usdzUrl, posterUrl, alt }: Props) {
  const t = useTranslations("product");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [suppressed, setSuppressed] = useState(false);

  useEffect(() => {
    // If the custom element is already registered (cached SPA navigation),
    // mark ready immediately. Otherwise the Script onLoad will flip the flag.
    if (typeof window !== "undefined" && window.customElements?.get("model-viewer")) {
      setReady(true);
    }
    const c = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    if (c?.saveData || c?.effectiveType === "2g" || c?.effectiveType === "slow-2g") {
      setSuppressed(true);
    }
  }, []);

  if (failed) {
    return (
      <FallbackImage posterUrl={posterUrl} alt={alt} caption={t("no3D")} />
    );
  }

  if (suppressed) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-paper">
        {posterUrl && (
          <Image src={posterUrl} alt={alt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        )}
        <button
          type="button"
          onClick={() => setSuppressed(false)}
          className="absolute inset-x-6 bottom-6 inline-flex items-center justify-center rounded-full bg-ink/85 px-5 py-3 font-caps text-[10px] uppercase tracking-[0.22em] text-bg backdrop-blur-md"
        >
          {t("tap3D")}
        </button>
      </div>
    );
  }

  return (
    <>
      <Script
        src={MODEL_VIEWER_SRC}
        type="module"
        strategy="lazyOnload"
        onLoad={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      {!ready ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-paper">
          {posterUrl && (
            <Image src={posterUrl} alt={alt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          )}
          <div className="absolute inset-0 grid place-items-center font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
            {t("loading3D")}
          </div>
        </div>
      ) : (
        <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-paper">
          {/* @ts-expect-error — web component intrinsic */}
          <model-viewer
            src={glbUrl}
            ios-src={usdzUrl ?? undefined}
            poster={posterUrl ?? undefined}
            alt={alt}
            camera-controls
            auto-rotate
            auto-rotate-delay={3000}
            ar
            ar-modes="webxr scene-viewer quick-look"
            loading="lazy"
            reveal="interaction"
            style={{ width: "100%", height: "100%", backgroundColor: "var(--color-paper)" }}
            onError={() => setFailed(true)}
          />
        </div>
      )}
    </>
  );
}

function FallbackImage({
  posterUrl,
  alt,
  caption,
}: {
  posterUrl: string | null | undefined;
  alt: string;
  caption: string;
}) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-paper">
      {posterUrl && (
        <Image src={posterUrl} alt={alt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/60 to-transparent p-4 font-caps text-[10px] uppercase tracking-[0.22em] text-bg">
        {caption}
      </div>
    </div>
  );
}
