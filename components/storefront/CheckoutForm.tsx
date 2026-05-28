"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { placeOrderAction } from "@/app/(storefront)/checkout/actions";
import type { CartDTO } from "@/server/types/cart";
import type { CheckoutInput, AddressInput } from "@/server/types/order";

type Step = 1 | 2 | 3 | 4;

const emptyAddress: AddressInput = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  district: "",
  postalCode: "",
  country: "TR",
  phone: "",
};

export function CheckoutForm({
  cart,
  hasPayTR,
}: {
  cart: CartDTO;
  hasPayTR: boolean;
}) {
  const t = useTranslations("checkout");
  const [step, setStep] = useState<Step>(1);
  const [pending, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [shipping, setShipping] = useState<AddressInput>(emptyAddress);
  const [billing, setBilling] = useState<AddressInput>(emptyAddress);
  const [billingSame, setBillingSame] = useState(true);
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutInput["paymentMethod"]>("BANK_TRANSFER");
  const [customerNote, setCustomerNote] = useState("");

  // Coupon state — held client-side; OrderService re-validates atomically.
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: string;
    type: string;
    value: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponPending, startCouponTransition] = useTransition();

  function applyCoupon() {
    setCouponError(null);
    startCouponTransition(async () => {
      const { applyCouponAction } = await import(
        "@/app/(storefront)/checkout/actions"
      );
      const r = await applyCouponAction({ code: couponCode.trim() });
      if (r.ok) {
        setAppliedCoupon({
          code: r.code,
          discount: r.discount,
          type: r.type,
          value: r.value,
        });
      } else {
        setAppliedCoupon(null);
        setCouponError(r.error);
      }
    });
  }

  function handleSubmit() {
    setGlobalError(null);
    const payload: CheckoutInput = {
      email,
      shipping,
      billing: billingSame ? shipping : billing,
      paymentMethod,
      customerNote,
      couponCode: appliedCoupon?.code ?? "",
    };
    startTransition(async () => {
      const result = await placeOrderAction(payload);
      if (result && !result.ok) {
        setGlobalError(result.error);
      }
    });
  }

  // Step gating — minimum validation. Server re-validates with Zod.
  const step1Valid = /\S+@\S+\.\S+/.test(email);
  const step2Valid =
    shipping.fullName.length >= 2 &&
    shipping.line1.length >= 2 &&
    shipping.city.length >= 2 &&
    shipping.postalCode.length >= 3;
  const step3Valid = paymentMethod === "BANK_TRANSFER" || paymentMethod === "PAYTR";

  return (
    <div className="flex flex-col gap-10">
      <StepBlock
        n="I"
        title={t("step1Title")}
        active={step === 1}
        completed={step > 1}
        summary={email}
        onEdit={() => setStep(1)}
      >
        <Field label={t("email")}>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </Field>
        <StepContinue disabled={!step1Valid} onClick={() => setStep(2)} label={t("continue")} />
      </StepBlock>

      <StepBlock
        n="II"
        title={t("step2Title")}
        active={step === 2}
        completed={step > 2}
        summary={
          step > 2
            ? `${shipping.fullName} · ${shipping.line1}, ${shipping.city}`
            : ""
        }
        onEdit={() => setStep(2)}
      >
        <AddressFields value={shipping} onChange={setShipping} />
        <label className="mt-4 flex items-center gap-2 font-caps text-[11px] uppercase tracking-[0.22em] text-ink-2">
          <input
            type="checkbox"
            checked={billingSame}
            onChange={(e) => setBillingSame(e.target.checked)}
            className="accent-ink"
          />
          {t("sameBilling")}
        </label>
        {!billingSame && (
          <div className="mt-6 border-t border-line pt-6">
            <div className="mb-4 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
              {t("billingTitle")}
            </div>
            <AddressFields value={billing} onChange={setBilling} />
          </div>
        )}
        <StepContinue disabled={!step2Valid} onClick={() => setStep(3)} label={t("continue")} />
      </StepBlock>

      <StepBlock
        n="III"
        title={t("step3Title")}
        active={step === 3}
        completed={step > 3}
        summary={
          step > 3 ? (paymentMethod === "BANK_TRANSFER" ? t("methodBank") : "PayTR") : ""
        }
        onEdit={() => setStep(3)}
      >
        <div className="flex flex-col gap-3">
          <PaymentRadio
            checked={paymentMethod === "BANK_TRANSFER"}
            onChange={() => setPaymentMethod("BANK_TRANSFER")}
            title={t("methodBank")}
            desc={t("methodBankDesc")}
          />
          <PaymentRadio
            checked={paymentMethod === "PAYTR"}
            onChange={() => hasPayTR && setPaymentMethod("PAYTR")}
            disabled={!hasPayTR}
            title={hasPayTR ? t("methodCard") : "PayTR"}
            desc={hasPayTR ? t("methodCardDesc") : t("paytrSoon")}
          />
        </div>
        <StepContinue disabled={!step3Valid} onClick={() => setStep(4)} label={t("continue")} />
      </StepBlock>

      <StepBlock
        n="IV"
        title={t("step4Title")}
        active={step === 4}
        completed={false}
        onEdit={() => setStep(4)}
      >
        <Field label={t("note")}>
          <textarea
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={t("notePlaceholder")}
            className={cn(inputCls, "h-auto py-3")}
          />
        </Field>

        <div className="mt-5 border-t border-line pt-5">
          {!appliedCoupon ? (
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <Field label={t("couponLabel")}>
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={t("couponPlaceholder")}
                  className={inputCls}
                  maxLength={40}
                />
              </Field>
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponPending || couponCode.trim().length < 2}
                className="self-end inline-flex items-center rounded-full border border-ink bg-transparent px-5 py-3 font-caps text-[10px] uppercase tracking-[0.22em] text-ink transition hover:bg-bg-deep disabled:opacity-50"
              >
                {couponPending ? "…" : t("couponApply")}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline justify-between gap-3 rounded-sm border border-emerald-700/30 bg-emerald-700/5 p-4">
              <div className="font-serif text-base text-emerald-900">
                <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-emerald-800">
                  {appliedCoupon.code}
                </span>{" "}
                uygulandı — −₺ {appliedCoupon.discount}
              </div>
              <button
                type="button"
                onClick={() => {
                  setAppliedCoupon(null);
                  setCouponCode("");
                }}
                className="font-caps text-[10px] uppercase tracking-[0.22em] text-emerald-800 underline-offset-4 hover:underline"
              >
                {t("couponRemove")}
              </button>
            </div>
          )}
          {couponError && (
            <p className="mt-2 m-0 font-serif italic text-base text-red-800">
              {t.has(`couponErrors.${couponError}`)
                ? t(`couponErrors.${couponError}`)
                : couponError}
            </p>
          )}
        </div>

        {globalError && (
          <div className="mt-4 rounded-sm border border-red-700/30 bg-red-700/5 p-4 font-serif text-base text-red-900">
            {globalError}
          </div>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending || cart.items.length === 0}
            className="inline-flex w-full items-center justify-center rounded-full bg-ink px-7 py-4 font-caps text-[11.5px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2 disabled:opacity-60"
          >
            {pending ? "…" : t("placeOrder")}
          </button>
          <p className="text-center font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
            {t("agreeNote")}
          </p>
        </div>
      </StepBlock>
    </div>
  );
}

const inputCls =
  "w-full rounded-sm border border-line bg-paper px-3.5 py-3 font-serif text-base text-ink outline-none placeholder:italic placeholder:text-ink-mute transition focus:border-ink focus:ring-2 focus:ring-ink/15";

function StepBlock({
  n,
  title,
  active,
  completed,
  summary,
  onEdit,
  children,
}: {
  n: string;
  title: string;
  active: boolean;
  completed: boolean;
  summary?: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "border-b border-line pb-10",
        !active && !completed && "opacity-60",
      )}
    >
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-4">
          <span className="font-serif italic text-2xl text-gold">{n}.</span>
          <h2 className="m-0 font-serif text-2xl font-light text-ink">{title}</h2>
        </div>
        {completed && (
          <button
            type="button"
            onClick={onEdit}
            className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute underline-offset-4 hover:underline"
          >
            Düzenle
          </button>
        )}
      </header>
      {active && <div className="flex flex-col">{children}</div>}
      {!active && completed && summary && (
        <p className="m-0 font-serif text-base text-ink-2">{summary}</p>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 flex flex-col gap-2">
      <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">{label}</span>
      {children}
    </label>
  );
}

function AddressFields({
  value,
  onChange,
}: {
  value: AddressInput;
  onChange: (next: AddressInput) => void;
}) {
  const t = useTranslations("checkout");
  const set = (k: keyof AddressInput, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      <Field label={t("fullName")}>
        <input className={inputCls} value={value.fullName} onChange={(e) => set("fullName", e.target.value)} />
      </Field>
      <Field label={t("phone")}>
        <input className={inputCls} value={value.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
      </Field>
      <div className="sm:col-span-2">
        <Field label={t("line1")}>
          <input className={inputCls} value={value.line1} onChange={(e) => set("line1", e.target.value)} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label={t("line2")}>
          <input className={inputCls} value={value.line2 ?? ""} onChange={(e) => set("line2", e.target.value)} />
        </Field>
      </div>
      <Field label={t("city")}>
        <input className={inputCls} value={value.city} onChange={(e) => set("city", e.target.value)} />
      </Field>
      <Field label={t("district")}>
        <input className={inputCls} value={value.district ?? ""} onChange={(e) => set("district", e.target.value)} />
      </Field>
      <Field label={t("postalCode")}>
        <input className={inputCls} value={value.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
      </Field>
      <Field label={t("country")}>
        <input className={inputCls} value={value.country} onChange={(e) => set("country", e.target.value)} maxLength={2} />
      </Field>
    </div>
  );
}

function PaymentRadio({
  checked,
  onChange,
  title,
  desc,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-start gap-4 rounded-sm border bg-bg-deep/30 p-5 text-left transition",
        checked && !disabled && "border-ink bg-paper",
        !checked && !disabled && "border-line hover:border-ink/60",
        disabled && "cursor-not-allowed border-line opacity-50",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-1 inline-block h-3 w-3 flex-none rounded-full border",
          checked ? "border-ink bg-ink" : "border-ink-mute bg-transparent",
        )}
      />
      <span className="flex flex-col gap-1">
        <span className="font-serif text-lg text-ink">{title}</span>
        <span className="font-serif text-sm text-ink-2">{desc}</span>
      </span>
    </button>
  );
}

function StepContinue({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="inline-flex items-center justify-center rounded-full border border-ink bg-ink px-6 py-3 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2 disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}
