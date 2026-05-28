import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

const palette = {
  bg: "#f3ece0",
  paper: "#faf6ee",
  ink: "#1a2330",
  inkMute: "#6b6b66",
  line: "#cdc4b2",
  gold: "#b08a4b",
  blue: "#3e5d72",
};

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Preview>efruze — hoş geldiniz · welcome</Preview>
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
            maxWidth: 560,
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
            <span style={{ color: palette.gold }}>—</span> efruze · alanya
          </Text>

          <Heading
            as="h1"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: 32,
              color: palette.ink,
              margin: "16px 0 16px",
              lineHeight: 1.1,
            }}
          >
            Hoş geldiniz, <em style={{ color: palette.blue }}>{name}</em>.
          </Heading>

          <Text style={{ fontSize: 17, color: palette.inkMute, lineHeight: 1.6, margin: 0 }}>
            Atölyemize katıldığınız için teşekkür ederiz. Mermerlediğimiz her parçayı, tek
            tek imzalayarak ve numaralandırarak sizinle paylaşıyoruz.
          </Text>

          <Text style={{ fontSize: 17, color: palette.inkMute, lineHeight: 1.6, margin: "12px 0 0" }}>
            <em>
              Thank you for joining the atelier. Every piece we marble is signed, numbered,
              and shared with you alone.
            </em>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
