"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  // global-error replaces the root layout, so it must ship its own html/body and
  // cannot rely on globals.css being applied. Inline brand tokens keep it on-tone.
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          padding: "24px",
          textAlign: "center",
          background: "#eadec2",
          color: "#1a2330",
          fontFamily: '"Cormorant Garamond", "Times New Roman", serif',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontWeight: 300,
            fontSize: "clamp(32px, 6vw, 56px)",
            lineHeight: 1.05,
          }}
        >
          Bir şeyler ters gitti.
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: "28rem",
            fontStyle: "italic",
            fontSize: "1.125rem",
            color: "#3a4250",
          }}
        >
          Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        {retry && (
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "8px",
              borderRadius: "9999px",
              border: "none",
              background: "#1a2330",
              color: "#eadec2",
              padding: "14px 28px",
              fontFamily: '"Tenor Sans", "Optima", serif',
              fontSize: "11px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
        )}
      </body>
    </html>
  );
}
