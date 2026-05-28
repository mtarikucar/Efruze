import { Resend } from "resend";
import { render } from "@react-email/render";
import { env } from "@/lib/env";
import { OrderPlacedEmail } from "@/emails/OrderPlacedEmail";
import { BankTransferInstructionsEmail } from "@/emails/BankTransferInstructionsEmail";
import { AdminNewOrderEmail } from "@/emails/AdminNewOrderEmail";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { OrderConfirmedEmail } from "@/emails/OrderConfirmedEmail";
import { OrderShippedEmail } from "@/emails/OrderShippedEmail";
import type { OrderDTO, BankTransferInstructionsDTO } from "@/server/types/order";

const FROM = "efruze atelier <atelier@efruze.com>";
const ADMIN_TO = "atelier@efruze.com"; // M4 will pull from StoreSettings

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

async function sendOrLog(args: { to: string; subject: string; html: string; tag: string }) {
  const client = getClient();
  if (!client) {
    console.log(
      `[email:${args.tag}] would send to=${args.to} subject="${args.subject}" — set RESEND_API_KEY to enable.`,
    );
    return { ok: true, simulated: true };
  }
  const { data, error } = await client.emails.send({
    from: FROM,
    to: [args.to],
    subject: args.subject,
    html: args.html,
  });
  if (error) {
    console.error(`[email:${args.tag}] resend error`, error);
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data?.id };
}

export const EmailService = {
  async orderPlaced(order: OrderDTO) {
    const html = await render(OrderPlacedEmail({ order }));
    return sendOrLog({
      to: order.email,
      subject: `efruze · siparişiniz alındı / order received · #${order.orderNumber}`,
      html,
      tag: "order-placed",
    });
  },

  async bankTransferInstructions(args: {
    to: string;
    orderNumber: string;
    instructions: BankTransferInstructionsDTO;
  }) {
    const html = await render(
      BankTransferInstructionsEmail({
        orderNumber: args.orderNumber,
        instructions: args.instructions,
      }),
    );
    return sendOrLog({
      to: args.to,
      subject: `efruze · havale bilgileri / payment instructions · #${args.orderNumber}`,
      html,
      tag: "bank-transfer-instructions",
    });
  },

  async adminNewOrder(order: OrderDTO) {
    const html = await render(AdminNewOrderEmail({ order }));
    return sendOrLog({
      to: ADMIN_TO,
      subject: `[efruze] New order #${order.orderNumber} · ₺${Number(order.total).toLocaleString("tr-TR")}`,
      html,
      tag: "admin-new-order",
    });
  },

  async welcome(args: { to: string; name: string }) {
    const html = await render(WelcomeEmail({ name: args.name }));
    return sendOrLog({
      to: args.to,
      subject: "efruze · hoş geldiniz / welcome",
      html,
      tag: "welcome",
    });
  },

  async orderConfirmed(order: OrderDTO) {
    const html = await render(OrderConfirmedEmail({ order }));
    return sendOrLog({
      to: order.email,
      subject: `efruze · ödeme onaylandı / payment confirmed · #${order.orderNumber}`,
      html,
      tag: "order-confirmed",
    });
  },

  async orderShipped(args: {
    order: OrderDTO;
    trackingCarrier?: string;
    trackingNumber?: string;
  }) {
    const html = await render(
      OrderShippedEmail({
        order: args.order,
        trackingCarrier: args.trackingCarrier,
        trackingNumber: args.trackingNumber,
      }),
    );
    return sendOrLog({
      to: args.order.email,
      subject: `efruze · siparişiniz yola çıktı / shipped · #${args.order.orderNumber}`,
      html,
      tag: "order-shipped",
    });
  },
};
