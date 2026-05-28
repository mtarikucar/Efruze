import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "@/server/db/client";
import { OrderService } from "@/server/services/order.service";
import {
  PageHeader,
  StatusPill,
  Table,
  THead,
  Th,
  TBody,
  Tr,
  Td,
} from "@/components/admin/primitives";
import { OrderActionPanel } from "@/components/admin/OrderActionPanel";
import { formatPrice } from "@/lib/format";
import type { AppLocale } from "@/i18n/routing";

export const metadata: Metadata = { title: "Sipariş · yönetim" };

type Params = Promise<{ orderNumber: string }>;

export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  const { orderNumber } = await params;
  const locale = (await getLocale()) as AppLocale;
  let order;
  let raw;
  try {
    order = await OrderService.getOrderForThanks(orderNumber, locale);
    raw = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        adminNote: true,
        trackingCarrier: true,
        trackingNumber: true,
      },
    });
  } catch {
    order = null;
    raw = null;
  }
  if (!order || !raw) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`#${order.orderNumber}`}
        title={`₺${Number(order.total).toLocaleString("tr-TR")}`}
        sub={`${order.email} · ${new Date(order.placedAt).toLocaleString("en-GB")}`}
        actions={<StatusPill status={order.status} />}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-8">
          <section className="rounded-sm card-elev p-6">
            <h2 className="m-0 mb-5 font-serif text-xl font-light text-ink">Ürünler</h2>
            <Table>
              <THead>
                <Th>Ürün</Th>
                <Th>SKU</Th>
                <Th>Adet</Th>
                <Th className="text-right">Birim</Th>
                <Th className="text-right">Tutar</Th>
              </THead>
              <TBody>
                {order.items.map((it) => (
                  <Tr key={it.id}>
                    <Td>{it.nameSnapshot}</Td>
                    <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                      {it.skuSnapshot}
                    </Td>
                    <Td>{it.quantity}</Td>
                    <Td className="text-right">{formatPrice(it.unitPrice)}</Td>
                    <Td className="text-right">{formatPrice(it.lineTotal)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>

            <dl className="mt-6 flex flex-col gap-2">
              <Row label="Ara toplam" value={formatPrice(order.subtotal)} />
              <Row label="Kargo" value={formatPrice(order.shippingCost)} />
              {Number(order.discountTotal) > 0 && (
                <Row label="İndirim" value={`− ${formatPrice(order.discountTotal)}`} />
              )}
              <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-caps text-[11px] uppercase tracking-[0.22em] text-ink">Toplam</dt>
                <dd className="font-serif text-2xl font-medium text-ink">
                  {formatPrice(order.total)}
                </dd>
              </div>
            </dl>
          </section>

          {order.shipping && (
            <section className="rounded-sm card-elev p-6">
              <h2 className="m-0 mb-3 font-serif text-xl font-light text-ink">Teslimat adresi</h2>
              <address className="m-0 not-italic font-serif text-base leading-relaxed text-ink">
                {order.shipping.fullName}
                <br />
                {order.shipping.line1}
                {order.shipping.line2 && (<><br />{order.shipping.line2}</>)}
                <br />
                {order.shipping.city}
                {order.shipping.district && ` · ${order.shipping.district}`} · {order.shipping.postalCode}
                {order.shipping.phone && (<><br />{order.shipping.phone}</>)}
              </address>
            </section>
          )}

          {order.customerNote && (
            <section className="rounded-sm card-elev p-6">
              <h2 className="m-0 mb-3 font-serif text-xl font-light text-ink">Müşteri notu</h2>
              <p className="m-0 font-serif italic text-base leading-relaxed text-ink-2">
                {order.customerNote}
              </p>
            </section>
          )}
        </div>

        <OrderActionPanel
          orderId={raw.id}
          status={order.status}
          paymentMethod={order.paymentMethod}
          paymentStatus={order.paymentStatus}
          trackingCarrier={raw.trackingCarrier}
          trackingNumber={raw.trackingNumber}
          adminNote={raw.adminNote}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">{label}</dt>
      <dd className="font-serif text-base text-ink">{value}</dd>
    </div>
  );
}
