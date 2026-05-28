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
import type { BankTransferInstructionsDTO } from "@/server/types/order";

const palette = {
  bg: "#f3ece0",
  paper: "#faf6ee",
  ink: "#1a2330",
  inkMute: "#6b6b66",
  line: "#cdc4b2",
  gold: "#b08a4b",
  blue: "#3e5d72",
};

export function BankTransferInstructionsEmail({
  orderNumber,
  instructions,
}: {
  orderNumber: string;
  instructions: BankTransferInstructionsDTO;
}) {
  return (
    <Html>
      <Head />
      <Preview>
        efruze — havale bilgileri · payment instructions ({orderNumber})
      </Preview>
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
            <span style={{ color: palette.gold }}>—</span> havale · efruze
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
            Havale bilgileri · <em style={{ color: palette.blue }}>transfer details</em>
          </Heading>

          <Text style={{ fontSize: 16, color: palette.inkMute, margin: "4px 0 24px" }}>
            Sipariş #{orderNumber} · ₺ {Number(instructions.amount).toLocaleString("tr-TR")}
          </Text>

          <Section
            style={{
              backgroundColor: palette.bg,
              border: `1px dashed ${palette.line}`,
              padding: 18,
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "'Tenor Sans', serif",
                fontSize: 10,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: palette.gold,
                margin: 0,
              }}
            >
              Açıklama · reference
            </Text>
            <Text
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 22,
                color: palette.ink,
                margin: "8px 0 0",
                letterSpacing: "0.05em",
              }}
            >
              {instructions.reference}
            </Text>
            <Text
              style={{
                fontFamily: "'Tenor Sans', serif",
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: palette.inkMute,
                margin: "8px 0 0",
              }}
            >
              Lütfen bu kodu havalenin açıklamasına yazın · please write this in the transfer note
            </Text>
          </Section>

          {instructions.accounts.map((acc, i) => (
            <Section key={i} style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: "'Tenor Sans', serif",
                  fontSize: 10,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: palette.gold,
                  margin: 0,
                }}
              >
                {acc.bankName}
              </Text>
              <Text style={{ fontSize: 16, color: palette.ink, margin: "4px 0 0" }}>
                {acc.accountHolder}
              </Text>
              <Text style={{ fontSize: 16, color: palette.ink, margin: "2px 0 0", letterSpacing: "0.05em" }}>
                IBAN: {acc.iban}
              </Text>
              {acc.swift && (
                <Text style={{ fontSize: 13, color: palette.inkMute, margin: "2px 0 0" }}>
                  SWIFT: {acc.swift}
                </Text>
              )}
            </Section>
          ))}

          <Hr style={{ borderColor: palette.line, margin: "24px 0" }} />

          <Text style={{ fontSize: 15, color: palette.inkMute, lineHeight: 1.55, margin: 0 }}>
            Havalenizi {instructions.deadlineHours} saat içinde tamamlamanızı rica ediyoruz.
            Ödemeniz onaylandıktan sonra siparişiniz hazırlanmaya başlanır.
            <br />
            <br />
            <em>
              We kindly ask you to complete the transfer within {instructions.deadlineHours} hours.
              Once confirmed, we begin preparing your order.
            </em>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default BankTransferInstructionsEmail;
