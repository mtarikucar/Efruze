import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import * as React from "react";
import type { OrderDTO } from "@/server/types/order";

const palette = { bg: "#f3ece0", paper: "#faf6ee", ink: "#1a2330", inkMute: "#6b6b66", gold: "#b08a4b", line: "#cdc4b2", blue: "#3e5d72" };

export function OrderShippedEmail({
  order,
  trackingCarrier,
  trackingNumber,
}: {
  order: OrderDTO;
  trackingCarrier?: string;
  trackingNumber?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>efruze — siparişiniz yola çıktı · your order is on its way ({order.orderNumber})</Preview>
      <Body style={{ backgroundColor: palette.bg, fontFamily: "'Cormorant Garamond', serif", margin: 0, padding: "40px 0" }}>
        <Container style={{ backgroundColor: palette.paper, border: `1px solid ${palette.line}`, borderRadius: 4, maxWidth: 560, margin: "0 auto", padding: "48px 40px" }}>
          <Text style={{ fontFamily: "'Tenor Sans', serif", fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", color: palette.gold, margin: 0 }}>
            — yola çıktı · shipped
          </Text>
          <Heading as="h1" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 32, color: palette.ink, margin: "16px 0 16px", lineHeight: 1.1 }}>
            Siparişiniz <em style={{ color: palette.blue }}>yola çıktı.</em>
          </Heading>
          <Text style={{ fontSize: 17, color: palette.inkMute, lineHeight: 1.6, margin: 0 }}>
            Pieces are folded in linen and on their way to you.
          </Text>
          {trackingCarrier && trackingNumber && (
            <div style={{ marginTop: 24, padding: 16, border: `1px dashed ${palette.line}`, backgroundColor: palette.bg, textAlign: "center" }}>
              <Text style={{ fontFamily: "'Tenor Sans', serif", fontSize: 10, letterSpacing: "0.32em", textTransform: "uppercase", color: palette.gold, margin: 0 }}>
                {trackingCarrier}
              </Text>
              <Text style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: palette.ink, margin: "6px 0 0", letterSpacing: "0.04em" }}>
                {trackingNumber}
              </Text>
            </div>
          )}
          <Text style={{ fontSize: 14, color: palette.inkMute, margin: "24px 0 0" }}>
            Sipariş #{order.orderNumber}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderShippedEmail;
