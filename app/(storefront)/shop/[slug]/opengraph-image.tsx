import { ImageResponse } from "next/og";
import { prisma } from "@/server/db/client";

export const runtime = "nodejs";
export const alt = "efruze product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = { params: Promise<{ slug: string }> };

export default async function ProductOgImage({ params }: Params) {
  const { slug } = await params;

  let name = "efruze";
  let tagline = "su üstüne çizilen";
  let priceLabel = "";
  let category = "atelier · alanya · antalya";

  try {
    const p = await prisma.product.findFirst({
      where: { slug, isPublished: true },
      include: {
        translations: { where: { locale: "tr" } },
        category: { include: { translations: { where: { locale: "tr" } } } },
      },
    });
    if (p) {
      const tr = p.translations[0];
      name = tr?.name ?? p.slug;
      tagline = tr?.tagline ?? "from the atelier";
      priceLabel = `₺ ${Math.round(Number(p.basePrice)).toLocaleString("tr-TR")}`;
      category = (p.category.translations[0]?.name ?? p.category.slug).toUpperCase();
    }
  } catch {
    /* fall back to defaults */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3ece0",
          color: "#1a2330",
          padding: 72,
          fontFamily: '"Times New Roman", serif',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 12,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#b08a4b",
          }}
        >
          <div style={{ display: "flex", width: 28, height: 1, background: "#cdc4b2" }} />
          <div style={{ display: "flex" }}>{category}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              lineHeight: 1.02,
              letterSpacing: -1,
              color: "#1a2330",
              maxWidth: 1000,
            }}
          >
            {name}
          </div>
          {tagline && (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                color: "#3e5d72",
                fontStyle: "italic",
                maxWidth: 800,
              }}
            >
              {tagline}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: "1px solid #cdc4b2",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 36,
              fontStyle: "italic",
              color: "#1a2330",
            }}
          >
            efruze
          </div>
          {priceLabel && (
            <div
              style={{
                display: "flex",
                fontSize: 28,
                color: "#1a2330",
              }}
            >
              {priceLabel}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
