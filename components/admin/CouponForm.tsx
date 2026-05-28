"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminButton,
  FormField,
  FormSection,
  adminInputCls,
  adminCheckboxCls,
} from "./primitives";
import {
  createCouponAction,
  updateCouponAction,
  type CouponInput,
} from "@/app/admin/coupons/actions";

export type CouponFormInitial = {
  id?: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minSubtotal: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  isActive: boolean;
};

const empty: CouponFormInitial = {
  code: "",
  type: "PERCENT",
  value: "10",
  minSubtotal: "",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  isActive: true,
};

export function CouponForm({ initial }: { initial: CouponFormInitial | null }) {
  const router = useRouter();
  const [form, setForm] = useState<CouponFormInitial>(initial ?? empty);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial?.id);

  function submit() {
    setError(null);
    const payload: CouponInput & { id?: string } = {
      code: form.code,
      type: form.type,
      value: form.value,
      minSubtotal: form.minSubtotal,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      isActive: form.isActive,
    };
    startTransition(async () => {
      const r = isEdit
        ? await updateCouponAction({ ...payload, id: initial!.id! })
        : await createCouponAction(payload);
      if (r && !r.ok) setError(r.error);
      else if (isEdit) router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-6"
    >
      <FormSection title="Kupon">
        <FormField label="Kod (A-Z, 0-9, - ve _)">
          <input
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className={adminInputCls}
            maxLength={40}
            placeholder="YAZ25"
          />
        </FormField>
        <FormField label="Tür">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "PERCENT" | "FIXED" })}
            className={adminInputCls}
          >
            <option value="PERCENT">Yüzde indirim</option>
            <option value="FIXED">Sabit tutar indirimi (TL)</option>
          </select>
        </FormField>
        <FormField label={form.type === "PERCENT" ? "Değer (%)" : "Değer (TL)"}>
          <input
            required
            inputMode="decimal"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Minimum ara toplam (TL)" hint="Boş = minimum yok">
          <input
            inputMode="decimal"
            value={form.minSubtotal}
            onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Başlangıç (tarih, isteğe bağlı)">
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Bitiş (tarih, isteğe bağlı)">
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Kullanım limiti" hint="Boş = sınırsız">
          <input
            type="number"
            min="1"
            value={form.usageLimit}
            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Durum">
          <label className="inline-flex items-center gap-2 pt-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className={adminCheckboxCls}
            />
            Aktif
          </label>
        </FormField>
      </FormSection>

      {error && (
        <div className="rounded-sm border border-red-700/30 bg-red-700/5 p-3 font-serif text-base text-red-900">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "…" : isEdit ? "Değişiklikleri kaydet" : "Kupon oluştur"}
        </AdminButton>
        <AdminButton type="button" variant="ghost" onClick={() => router.back()}>
          Vazgeç
        </AdminButton>
      </div>
    </form>
  );
}
