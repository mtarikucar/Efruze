import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "efruze — su üstüne çizilen";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default OG image. next/og uses Satori, which only supports the flex/block
 * display values and a strict CSS subset — keep this layout simple.
 */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3ece0",
          color: "#1a2330",
          padding: 80,
          fontFamily: '"Times New Roman", serif',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 14,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#6b6b66",
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", width: 36, height: 1, background: "#cdc4b2" }} />
          <div style={{ display: "flex" }}>maison · mmxxvi</div>
          <div style={{ display: "flex", width: 36, height: 1, background: "#cdc4b2" }} />
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 180,
            lineHeight: 0.95,
            letterSpacing: -2,
            color: "#1a2330",
            fontStyle: "italic",
          }}
        >
          efruze
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#3e5d72",
            fontStyle: "italic",
            marginTop: 24,
          }}
        >
          su üstüne çizilen
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 14,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#b08a4b",
            marginTop: 64,
          }}
        >
          atelier · alanya · antalya
        </div>
      </div>
    ),
    { ...size },
  );
}
