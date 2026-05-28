import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getLocale, getTranslations } from "next-intl/server";
import { OrderService } from "@/server/services/order.service";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { BankInstructionsPanel } from "@/components/storefront/BankInstructionsPanel";
import type { AppLocale } from "@/i18n/routing";

type Params = Promise<{ orderNumber: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber} · efruze`, robots: { index: false } };
}

export default async function AccountOrderDetailPage({ params }: { params: Params }) {
  const session = await auth();
  if (!session?.user) return null;
  const { orderNumber } = await params;
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("account");

  let order;
  try {
    order = await OrderService.getOrderForThanks(orderNumber, locale);
  } catch {
    order = null;
  }
  if (!order) notFound();

  // Authorisation: the order must belong to the signed-in user (by userId or email).
  const ownedByUser =
    order.email === session.user.email; // guest orders show up by email match too
  if (!ownedByUser) notFound();

  return (
    <div className="flex flex-col gap-10">
      <Link href="/account/orders" className="link-underline self-start">
        ← {t("backToOrders")}
      </Link>

      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1
            className="serif-display m-0 font-serif font-light text-ink"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.04 }}
          >
            #{order.orderNumber}
          </h1>
          <p className="mt-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
            {new Date(order.placedAt).toLocaleDateString("en-GB")} · {order.status.replaceAll("_", " ").toLowerCase()}
          </p>
        </div>
        <span className="font-serif text-3xl font-medium text-ink">{formatPrice(order.total)}</span>
      </header>

      {order.bankInstructions && order.status === "AWAITING_PAYMENT" && (
        <BankInstructionsPanel instructions={order.bankInstructions} />
      )}

      <section className="rounded-sm card-elev p-8">
        <div className="mb-5 font-caps text-[10px] uppercase tracking-[0.32em] text-ink-2">
          <span className="mr-1.5 text-gold">—</span> {t("items")}
        </div>
        <ul className="flex flex-col gap-3">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-baseline justify-between gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0">
              <span className="flex-1 font-serif text-base text-ink">
                {it.nameSnapshot}{" "}
                <span className="text-ink-mute">× {it.quantity}</span>
              </span>
              <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                {it.skuSnapshot}
              </span>
              <span className="font-serif text-base text-ink">{formatPrice(it.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-6 flex flex-col gap-2 border-t border-line pt-4">
          <Row label={t("subtotal")} value={formatPrice(order.subtotal)} />
          <Row label={t("shipping")} value={Number(order.shippingCost) === 0 ? "—" : formatPrice(order.shippingCost)} />
          {Number(order.discountTotal) > 0 && (
            <Row label={t("discount")} value={`− ${formatPrice(order.discountTotal)}`} />
          )}
          <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-caps text-[11px] uppercase tracking-[0.22em] text-ink">{t("total")}</dt>
            <dd className="font-serif text-2xl font-medium text-ink">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      {order.shipping && (
        <section className="rounded-sm card-elev p-8">
          <div className="mb-3 font-caps text-[10px] uppercase tracking-[0.32em] text-ink-2">
            <span className="mr-1.5 text-gold">—</span> {t("shippingTo")}
          </div>
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
