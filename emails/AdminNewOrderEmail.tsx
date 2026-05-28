import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";
import type { OrderDTO } from "@/server/types/order";

const palette = {
  bg: "#1a2330",
  paper: "#faf6ee",
  ink: "#1a2330",
  inkMute: "#6b6b66",
  line: "#cdc4b2",
  gold: "#b08a4b",
};

export function AdminNewOrderEmail({ order }: { order: OrderDTO }) {
  return (
    <Html>
      <Head />
      <Preview>New order · {order.orderNumber} · ₺{Number(order.total).toLocaleString("tr-TR")}</Preview>
      <Body
        style={{
          backgroundColor: palette.bg,
          fontFamily: "'DM Sans', sans-serif",
          margin: 0,
          padding: "40px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: palette.paper,
            margin: "0 auto",
            maxWidth: 600,
            padding: "32px 28px",
          }}
        >
          <Text
            style={{
              fontFamily: "'Tenor Sans', serif",
              fontSize: 11,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: palette.gold,
              margin: 0,
            }}
          >
            — Atelier alert
          </Text>

          <Heading
            as="h1"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 400,
              fontSize: 28,
              color: palette.ink,
              margin: "12px 0 4px",
            }}
          >
            New order #{order.orderNumber}
          </Heading>

          <Text style={{ fontSize: 14, color: palette.inkMute, margin: 0 }}>
            {order.email} · ₺{Number(order.total).toLocaleString("tr-TR")} · {order.paymentMethod}
          </Text>

          <Hr style={{ borderColor: palette.line, margin: "20px 0" }} />

          {order.items.map((it) => (
            <Text key={it.id} style={{ margin: "4px 0", fontSize: 14, color: palette.ink }}>
              {it.quantity}× {it.nameSnapshot}{" "}
              <span style={{ color: palette.inkMute }}>({it.skuSnapshot})</span> ·{" "}
              ₺{Number(it.lineTotal).toLocaleString("tr-TR")}
            </Text>
          ))}

          <Hr style={{ borderColor: palette.line, margin: "20px 0" }} />

          {order.shipping && (
            <>
              <Text
                style={{
                  fontFamily: "'Tenor Sans', serif",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: palette.inkMute,
                  margin: 0,
                }}
              >
                Ship to
              </Text>
              <Text style={{ fontSize: 14, color: palette.ink, margin: "4px 0 0", lineHeight: 1.55 }}>
                {order.shipping.fullName}
                <br />
                {order.shipping.line1}
                {order.shipping.line2 && (
                  <>
                    <br />
                    {order.shipping.line2}
                  </>
                )}
                <br />
                {order.shipping.city}
                {order.shipping.district && ` · ${order.shipping.district}`} ·{" "}
                {order.shipping.postalCode}
                {order.shipping.phone && (
                  <>
                    <br />
                    {order.shipping.phone}
                  </>
                )}
              </Text>
            </>
          )}

          {order.customerNote && (
            <>
              <Hr style={{ borderColor: palette.line, margin: "20px 0" }} />
              <Text
                style={{
                  fontFamily: "'Tenor Sans', serif",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: palette.inkMute,
                  margin: 0,
                }}
              >
                Customer note
              </Text>
              <Text style={{ fontSize: 14, color: palette.ink, fontStyle: "italic", margin: "4px 0 0" }}>
                {order.customerNote}
              </Text>
            </>
          )}
        </Container>
      </Body>
    </Html>
  );
}

export default AdminNewOrderEmail;
