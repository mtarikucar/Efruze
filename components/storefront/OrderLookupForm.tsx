"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { lookupOrderAction } from "@/app/(storefront)/orders/lookup/actions";
import { BankInstructionsPanel } from "./BankInstructionsPanel";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel } from "@/lib/order-status";
import type { OrderDTO } from "@/server/types/order";

const KNOWN_ERRORS = ["NOT_FOUND", "TOO_MANY_REQUESTS", "INVALID_INPUT", "UNKNOWN"] as const;
type KnownError = (typeof KNOWN_ERRORS)[number];

function toErrorKey(code: string): KnownError {
  return (KNOWN_ERRORS as readonly string[]).includes(code) ? (code as KnownError) : "UNKNOWN";
}

export function OrderLookupForm() {
  const t = useTranslations("orderLookup");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<KnownError | null>(null);
  const [order, setOrder] = useState<OrderDTO | null>(null);

  // Field styling lifted verbatim from the checkout/contact inputs so the
  // lookup form matches the rest of the storefront.
  const inputCls =
    "w-full rounded-sm border border-line bg-paper px-3.5 py-3 font-serif text-base text-ink outline-none placeholder:italic placeholder:text-ink-mute transition focus:border-ink focus:ring-2 focus:ring-ink/15";

  if (order) {
    return (
      <div className="flex flex-col gap-8">
        <OrderResult order={order} />
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setOrder(null);
              setError(null);
              setOrderNumber("");
              setEmail("");
            }}
            className="link-underline font-caps text-[11px] uppercase tracking-[0.22em] text-ink-2"
          >
            {t("newLookup")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await lookupOrderAction({ orderNumber, email });
          if (res.ok) {
            setOrder(res.order);
          } else {
            setError(toErrorKey(res.error));
          }
        });
      }}
      className="rounded-sm card-elev p-8 sm:p-12"
    >
      <label className="flex flex-col gap-2">
        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {t("orderNumber")}
        </span>
        <input
          className={inputCls}
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder={t("orderNumberPlaceholder")}
          autoComplete="off"
          required
        />
      </label>

      <label className="mt-5 flex flex-col gap-2">
        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {t("email")}
        </span>
        <input
          type="email"
          className={inputCls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          required
        />
      </label>

      {error && (
        <p className="mt-5 rounded-sm border border-dashed border-blue-deep/40 bg-blue-deep/5 px-4 py-3 font-serif text-base text-ink-2">
          {t(`errors.${error}`)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-8 inline-flex items-center justify-center rounded-full border border-ink bg-ink px-6 py-3 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2 disabled:opacity-60"
      >
        {pending ? t("loading") : t("submit")}
      </button>
    </form>
  );
}

function OrderResult({ order }: { order: OrderDTO }) {
  const t = useTranslations("orderLookup");
  const tThanks = useTranslations("thanks");
  const placed = new Date(order.placedAt).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Status + meta banner */}
      <section className="rounded-sm card-elev p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="font-caps text-[10px] uppercase tracking-[0.28em] text-ink-mute">
              {t("statusLabel")}
            </div>
            <div className="mt-1 font-serif text-2xl text-ink">{order.orderNumber}</div>
          </div>
          <span className="rounded-full bg-paper px-4 py-2 font-caps text-[10px] uppercase tracking-[0.22em] text-blue-deep">
            {orderStatusLabel(order.status)}
          </span>
        </div>
        <div className="mt-4 border-t border-line pt-4 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {t("placedAt")} ·{" "}
          <span className="font-serif text-base normal-case tracking-normal text-ink-2">
            {placed}
          </span>
        </div>
      </section>

      {order.bankInstructions && (
        <BankInstructionsPanel instructions={order.bankInstructions} />
      )}

      {/* Order summary */}
      <section className="rounded-sm card-elev p-8">
        <div className="mb-6 font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
          <span className="mr-1.5 text-gold">—</span> {t("orderSummary")}
        </div>
        <ul className="flex flex-col gap-3 border-b border-line pb-6">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-baseline justify-between gap-3">
              <span className="flex-1 font-serif text-base text-ink">
                {it.nameSnapshot} <span className="text-ink-mute">× {it.quantity}</span>
              </span>
              <span className="font-serif text-base text-ink">{formatPrice(it.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 flex flex-col gap-2">
          <Row label={t("subtotal")} value={formatPrice(order.subtotal)} />
          <Row
            label={t("shipping")}
            value={Number(order.shippingCost) === 0 ? "—" : formatPrice(order.shippingCost)}
          />
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
      </section>

      {/* Shipping address */}
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

      <div>
        <Link href="/shop" className="link-underline">
          {tThanks("continueShopping")} →
        </Link>
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
