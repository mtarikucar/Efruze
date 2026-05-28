"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminButton,
  FormSection,
  FormField,
  adminInputCls,
  adminTextareaCls,
} from "./primitives";
import { updateSettingsAction } from "@/app/admin/settings/actions";

export type SettingsFormInitial = {
  brandName: string;
  taglineTr: string;
  taglineEn: string;
  contactEmail: string;
  whatsapp: string;
  instagram: string;
  defaultCurrency: string;
  shippingFlatRate: string;
  freeShippingThreshold: string;
  addressTr: string;
  addressEn: string;
  hoursTr: string;
  hoursEn: string;
};

export function SettingsForm({ initial }: { initial: SettingsFormInitial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await updateSettingsAction(form);
      if (r.ok) {
        setSavedAt(Date.now());
        router.refresh();
      } else setError(r.error);
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
      <FormSection title="Marka">
        <FormField label="Marka adı">
          <input
            required
            value={form.brandName}
            onChange={(e) => setForm({ ...form, brandName: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="İletişim e-postası">
          <input
            type="email"
            required
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Slogan (TR)" full>
          <input
            value={form.taglineTr}
            onChange={(e) => setForm({ ...form, taglineTr: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Slogan (EN)" full>
          <input
            value={form.taglineEn}
            onChange={(e) => setForm({ ...form, taglineEn: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="WhatsApp">
          <input
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Instagram">
          <input
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            className={adminInputCls}
            placeholder="@efruze"
          />
        </FormField>
      </FormSection>

      <FormSection title="İletişim bilgileri">
        <FormField label="Adres (TR)" full hint="/contact sayfasında gözükür. Satırları boş bırakmadan yeni satır ile ayır.">
          <textarea
            rows={3}
            value={form.addressTr}
            onChange={(e) => setForm({ ...form, addressTr: e.target.value })}
            className={adminTextareaCls}
          />
        </FormField>
        <FormField label="Adres (EN)" full>
          <textarea
            rows={3}
            value={form.addressEn}
            onChange={(e) => setForm({ ...form, addressEn: e.target.value })}
            className={adminTextareaCls}
          />
        </FormField>
        <FormField label="Çalışma saatleri (TR)" full>
          <textarea
            rows={2}
            value={form.hoursTr}
            onChange={(e) => setForm({ ...form, hoursTr: e.target.value })}
            className={adminTextareaCls}
          />
        </FormField>
        <FormField label="Çalışma saatleri (EN)" full>
          <textarea
            rows={2}
            value={form.hoursEn}
            onChange={(e) => setForm({ ...form, hoursEn: e.target.value })}
            className={adminTextareaCls}
          />
        </FormField>
      </FormSection>

      <FormSection title="Kargo">
        <FormField label="Varsayılan para birimi">
          <input
            value={form.defaultCurrency}
            onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
            className={adminInputCls}
            maxLength={3}
          />
        </FormField>
        <FormField label="Sabit kargo ücreti (TL)">
          <input
            value={form.shippingFlatRate}
            onChange={(e) => setForm({ ...form, shippingFlatRate: e.target.value })}
            className={adminInputCls}
            inputMode="decimal"
          />
        </FormField>
        <FormField label="Ücretsiz kargo eşiği (TL, boş = yok)">
          <input
            value={form.freeShippingThreshold}
            onChange={(e) =>
              setForm({ ...form, freeShippingThreshold: e.target.value })
            }
            className={adminInputCls}
            inputMode="decimal"
          />
        </FormField>
      </FormSection>

      {error && (
        <div className="rounded-sm border border-red-700/30 bg-red-700/5 p-3 font-serif text-base text-red-900">
          {error}
        </div>
      )}
      {savedAt && (
        <div className="rounded-sm border border-emerald-700/30 bg-emerald-700/5 p-3 font-serif italic text-base text-emerald-800">
          Kaydedildi.
        </div>
      )}

      <div>
        <AdminButton type="submit" disabled={pending}>
          {pending ? "…" : "Ayarları kaydet"}
        </AdminButton>
      </div>
    </form>
  );
}
