import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
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

export function PasswordResetEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>efruze — şifre sıfırlama bağlantınız</Preview>
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
            Şifrenizi <em style={{ color: palette.blue }}>sıfırlayın</em>.
          </Heading>

          <Text style={{ fontSize: 17, color: palette.inkMute, lineHeight: 1.6, margin: 0 }}>
            Hesabınız için bir şifre sıfırlama talebi aldık. Yeni bir şifre belirlemek için
            aşağıdaki bağlantıya tıklayın. Bu bağlantı bir saat boyunca geçerlidir.
          </Text>

          <Section style={{ margin: "28px 0 8px" }}>
            <Button
              href={resetUrl}
              style={{
                backgroundColor: palette.ink,
                borderRadius: 9999,
                color: palette.paper,
                display: "inline-block",
                fontFamily: "'Tenor Sans', serif",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                padding: "14px 28px",
                textDecoration: "none",
              }}
            >
              Şifremi sıfırla
            </Button>
          </Section>

          <Text style={{ fontSize: 14, color: palette.inkMute, lineHeight: 1.6, margin: "20px 0 0" }}>
            Buton çalışmazsa bu adresi tarayıcınıza yapıştırın:
            <br />
            <span style={{ color: palette.blue, wordBreak: "break-all" }}>{resetUrl}</span>
          </Text>

          <Text style={{ fontSize: 14, color: palette.inkMute, lineHeight: 1.6, margin: "20px 0 0" }}>
            <em>
              Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz
              değişmeden kalır.
            </em>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;
