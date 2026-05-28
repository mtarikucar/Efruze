import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
// note: getTranslations used below for the page body — metadata title is literal
// since translation namespaces aren't reliable during generateMetadata on errors.
import { auth } from "@/auth";
import { OrderService } from "@/server/services/order.service";
import { BankInstructionsPanel } from "@/components/storefront/BankInstructionsPanel";
import { formatPrice } from "@/lib/format";
import { LAST_ORDER_COOKIE } from "@/lib/constants";
import type { AppLocale } from "@/i18n/routing";

type Params = Promise<{ orderNumber: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Sipariş ${orderNumber}`,
    robots: { index: false, follow: false },
  };
}

export default async function OrderThanksPage({ params }: { params: Params }) {
  const { orderNumber } = await params;
  const locale = (await getLocale()) as AppLocale;
  let order;
  try {
    order = await OrderService.getOrderForThanks(orderNumber, locale);
  } catch (err) {
    console.error("[thanks] failed to load order", err);
    order = null;
  }
  if (!order) notFound();

  // Authorize this view. Two paths:
  //  1. The browser just placed this order — `LAST_ORDER_COOKIE` was set by
  //     placeOrderAction and survives ~24h for revisits from the email.
  //  2. A signed-in user whose email matches the order (covers guest checkouts
  //     completed *before* sign-in, plus revisits from another browser).
  // Otherwise 404 — knowing the order number alone leaks PII (name, address,
  // phone, basket totals) via referer/screenshot/log share.
  const [cookieStore, session] = await Promise.all([cookies(), auth().catch(() => null)]);
  const cookieMatch = cookieStore.get(LAST_ORDER_COOKIE)?.value === orderNumber;
  const sessionMatch =
    !!session?.user?.email && session.user.email === order.email;
  if (!cookieMatch && !sessionMatch) notFound();

  const t = await getTranslations("thanks");

  // PayTR pays asynchronously: the user lands here right after the iframe, but
  // the webhook may still be in-flight. Show a verifying state with a meta
  // refresh until Payment.status changes.
  const isPayTRPending =
    order.paymentMethod === "PAYTR" &&
    (order.paymentStatus === "PENDING" || order.paymentStatus === "VERIFYING");

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      {isPayTRPending && (
        <meta httpEquiv="refresh" content="3" />
      )}
      <header className="mb-12 flex flex-col items-center gap-4 text-center">
        <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-gold">
          {t("eyebrow")}
        </div>
        <h1
          className="serif-display m-0 max-w-3xl font-serif font-light text-ink"
          style={{ fontSize: "clamp(36px, 5.4vw, 64px)", lineHeight: 1.04 }}
        >
          {t("titleA")}{" "}
          <em className="italic text-blue-deep">{t("titleEm")}</em>
        </h1>
        <p className="m-0 max-w-xl font-serif text-lg italic leading-snug text-ink-2">
          {t("sub", { orderNumber: order.orderNumber })}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-8">
          {isPayTRPending && (
            <div className="rounded-sm border border-gold/40 bg-gold/5 p-8">
              <div className="mb-3 font-caps text-[10px] uppercase tracking-[0.32em] text-gold">
                Ödeme doğrulanıyor…
              </div>
              <p className="m-0 font-serif text-lg leading-relaxed text-ink-2">
                Ödemenizi kart ağıyla birlikte onaylıyoruz — bu sayfa birkaç
                saniyede bir otomatik olarak yenilenir. Onaylandığında size ayrıca
                bir e-posta da göndereceğiz.
              </p>
            </div>
          )}
          {order.bankInstructions && (
            <BankInstructionsPanel instructions={order.bankInstructions} />
          )}

          {/* Shipping summary */}
          {order.shipping && (
            <section className="rounded-sm card-elev p-8">
              <div className="mb-4 font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
                <span className="mr-1.5 text-gold">—</span> {t("shippingTo")}
              </div>
              <address className="m-0 not-italic font-serif text-base leading-relaxed text-ink">
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
              </address>
            </section>
          )}

          <p className="font-caps text-[11px] uppercase tracking-[0.22em] text-ink-mute">
            {t("emailedTo")} <span className="lowercase tracking-normal font-serif text-base normal-case text-ink">{order.email}</span>
          </p>

          <div>
            <Link href="/shop" className="link-underline">
              {t("continueShopping")} →
            </Link>
          </div>
        </div>

        {/* Order summary card */}
        <aside className="rounded-sm card-elev p-8 self-start">
          <div className="mb-6 font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
            <span className="mr-1.5 text-gold">—</span> {t("orderSummary")}
          </div>
          <ul className="flex flex-col gap-3 border-b border-line pb-6">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-baseline justify-between gap-3">
                <span className="flex-1 font-serif text-base text-ink">
                  {it.nameSnapshot}{" "}
                  <span className="text-ink-mute">× {it.quantity}</span>
                </span>
                <span className="font-serif text-base text-ink">{formatPrice(it.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 flex flex-col gap-2">
            <Row label={t("subtotal")} value={formatPrice(order.subtotal)} />
            <Row label={t("shipping")} value={Number(order.shippingCost) === 0 ? "—" : formatPrice(order.shippingCost)} />
            {Number(order.discountTotal) > 0 && (
              <Row label={t("discount")} value={`− ${formatPrice(order.discountTotal)}`} />
            )}
            <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-caps text-[11px] uppercase tracking-[0.22em] text-ink">
                {t("total")}
              </dt>
              <dd className="font-serif text-2xl font-medium text-ink">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
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
