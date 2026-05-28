import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import type { OrderDTO } from "@/server/types/order";

const palette = {
  bg: "#f3ece0",
  paper: "#faf6ee",
  ink: "#1a2330",
  inkMute: "#6b6b66",
  line: "#cdc4b2",
  gold: "#b08a4b",
  blue: "#3e5d72",
};

export function OrderPlacedEmail({ order }: { order: OrderDTO }) {
  return (
    <Html>
      <Head />
      <Preview>efruze — siparişiniz alındı · order received ({order.orderNumber})</Preview>
      <Body
        style={{
          backgroundColor: palette.bg,
          fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
          margin: 0,
          padding: "40px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: palette.paper,
            border: `1px solid ${palette.line}`,
            borderRadius: 4,
            margin: "0 auto",
            maxWidth: 600,
            padding: "48px 40px",
          }}
        >
          <Text
            style={{
              fontFamily: "'Tenor Sans', serif",
              fontSize: 11,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: palette.inkMute,
              margin: 0,
            }}
          >
            <span style={{ color: palette.gold }}>—</span> efruze atelier · alanya
          </Text>

          <Heading
            as="h1"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: 32,
              color: palette.ink,
              margin: "16px 0 8px",
              lineHeight: 1.1,
            }}
          >
            Siparişinizi aldık · <em style={{ color: palette.blue }}>your order is received</em>
          </Heading>

          <Text style={{ fontSize: 16, color: palette.inkMute, margin: "4px 0 24px" }}>
            #{order.orderNumber}
          </Text>

          <Hr style={{ borderColor: palette.line, margin: "24px 0" }} />

          <Section>
            {order.items.map((it) => (
              <div
                key={it.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 12,
                }}
              >
                <Text style={{ margin: 0, fontSize: 16, color: palette.ink, flex: 1 }}>
                  {it.nameSnapshot}{" "}
                  <span style={{ color: palette.inkMute, fontSize: 13 }}>× {it.quantity}</span>
                </Text>
                <Text style={{ margin: 0, fontSize: 16, color: palette.ink }}>
                  ₺ {Number(it.lineTotal).toLocaleString("tr-TR")}
                </Text>
              </div>
            ))}
          </Section>

          <Hr style={{ borderColor: palette.line, margin: "24px 0" }} />

          <Section>
            <Row label="Ara toplam · subtotal" value={`₺ ${Number(order.subtotal).toLocaleString("tr-TR")}`} />
            <Row label="Kargo · shipping" value={`₺ ${Number(order.shippingCost).toLocaleString("tr-TR")}`} />
            {Number(order.discountTotal) > 0 && (
              <Row label="İndirim · discount" value={`− ₺ ${Number(order.discountTotal).toLocaleString("tr-TR")}`} />
            )}
            <Hr style={{ borderColor: palette.line, margin: "12px 0" }} />
            <Row label="Toplam · total" value={`₺ ${Number(order.total).toLocaleString("tr-TR")}`} bold />
          </Section>

          <Hr style={{ borderColor: palette.line, margin: "24px 0" }} />

          <Text
            style={{
              fontFamily: "'Tenor Sans', serif",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: palette.inkMute,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            efruze atelier · alanya · antalya
            <br />
            atelier@efruze.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 6,
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: "'Tenor Sans', serif",
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: palette.inkMute,
          fontWeight: bold ? 600 : 400,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          margin: 0,
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: bold ? 22 : 16,
          color: palette.ink,
          fontWeight: bold ? 500 : 400,
        }}
      >
        {value}
      </Text>
    </div>
  );
}

export default OrderPlacedEmail;
