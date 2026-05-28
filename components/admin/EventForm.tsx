"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminButton,
  FormField,
  FormSection,
  adminInputCls,
  adminTextareaCls,
  adminCheckboxCls,
} from "./primitives";
import { ImageUploadField } from "./ImageUploadField";
import { createEventAction, updateEventAction } from "@/app/admin/events/actions";
import type { EventInput } from "@/server/types/event";

export type EventFormInitial = {
  id?: string;
  slug: string;
  date: string;
  kind: "WORKSHOP" | "DROP" | "EXHIBITION" | "VISIT" | "OTHER";
  imageUrl: string;
  priceText: string;
  ctaUrl: string;
  isPublished: boolean;
  sortOrder: number;
  translations: {
    tr: { tag: string; title: string; description: string; meta: string; ctaLabel: string };
  };
};

const empty: EventFormInitial = {
  slug: "",
  date: new Date().toISOString().slice(0, 16),
  kind: "WORKSHOP",
  imageUrl: "",
  priceText: "",
  ctaUrl: "/contact",
  isPublished: true,
  sortOrder: 0,
  translations: {
    tr: { tag: "", title: "", description: "", meta: "", ctaLabel: "Yer ayır" },
  },
};

const KINDS: Array<{ value: EventFormInitial["kind"]; label: string }> = [
  { value: "WORKSHOP", label: "Atölye" },
  { value: "DROP", label: "Koleksiyon" },
  { value: "EXHIBITION", label: "Sergi" },
  { value: "VISIT", label: "Ziyaret" },
  { value: "OTHER", label: "Diğer" },
];

export function EventForm({ initial }: { initial: EventFormInitial | null }) {
  const router = useRouter();
  const [form, setForm] = useState<EventFormInitial>(initial ?? empty);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial?.id);

  function submit() {
    setError(null);
    const payload: EventInput & { id?: string } = {
      slug: form.slug,
      date: form.date,
      kind: form.kind,
      imageUrl: form.imageUrl,
      priceText: form.priceText,
      ctaUrl: form.ctaUrl,
      isPublished: form.isPublished,
      sortOrder: form.sortOrder,
      translations: [{ locale: "tr", ...form.translations.tr }],
    };
    startTransition(async () => {
      const r = isEdit
        ? await updateEventAction({ ...payload, id: initial!.id! })
        : await createEventAction(payload);
      if (r && !r.ok) setError(r.error);
      else if (isEdit) router.refresh();
    });
  }

  function setTr(k: keyof EventFormInitial["translations"]["tr"], v: string) {
    setForm({
      ...form,
      translations: {
        ...form.translations,
        tr: { ...form.translations.tr, [k]: v },
      },
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
      <FormSection title="Etkinlik">
        <FormField label="Tarih + saat">
          <input
            type="datetime-local"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Tür">
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value as EventFormInitial["kind"] })}
            className={adminInputCls}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Slug (boş = başlıktan üret)">
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={adminInputCls}
            placeholder="ebru-baslangic-jun14"
          />
        </FormField>
        <FormField label='Fiyat metni (örn. "₺ 1,800", "RSVP", "Açık", "Ücretsiz")'>
          <input
            value={form.priceText}
            onChange={(e) => setForm({ ...form, priceText: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="CTA URL (butonun yönlendireceği yer)">
          <input
            value={form.ctaUrl}
            onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
            className={adminInputCls}
            placeholder="/contact"
          />
        </FormField>
        <ImageUploadField
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
          label="Görsel"
        />
        <FormField label="Sıralama (düşük = önce)">
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Durum">
          <label className="inline-flex items-center gap-2 pt-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className={adminCheckboxCls}
            />
            Yayında (sitede görünür)
          </label>
        </FormField>
      </FormSection>

      <section className="rounded-sm card-elev p-6">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="m-0 font-serif text-xl font-light text-ink">İçerik</h2>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <FormField label="Etiket (tür alt başlığı)" full>
            <input
              required
              value={form.translations.tr.tag}
              onChange={(e) => setTr("tag", e.target.value)}
              className={adminInputCls}
              placeholder='örn. "Atölye · 8 kişilik"'
            />
          </FormField>
          <FormField label="Başlık" full>
            <input
              required
              value={form.translations.tr.title}
              onChange={(e) => setTr("title", e.target.value)}
              className={adminInputCls}
            />
          </FormField>
          <FormField label="Açıklama" full>
            <textarea
              rows={3}
              value={form.translations.tr.description}
              onChange={(e) => setTr("description", e.target.value)}
              className={adminTextareaCls}
            />
          </FormField>
          <FormField label="Meta (tek satır: gün + saat + mekan)">
            <input
              value={form.translations.tr.meta}
              onChange={(e) => setTr("meta", e.target.value)}
              className={adminInputCls}
              placeholder='örn. "Cmt, 14.06 · 14:00–17:00 · Alanya"'
            />
          </FormField>
          <FormField label="CTA butonu metni">
            <input
              value={form.translations.tr.ctaLabel}
              onChange={(e) => setTr("ctaLabel", e.target.value)}
              className={adminInputCls}
              placeholder='örn. "Yer ayır"'
            />
          </FormField>
        </div>
      </section>

      {error && (
        <div className="rounded-sm border border-red-700/30 bg-red-700/5 p-3 font-serif text-base text-red-900">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "…" : isEdit ? "Kaydet" : "Etkinlik oluştur"}
        </AdminButton>
        <AdminButton type="button" variant="ghost" onClick={() => router.back()}>
          Vazgeç
        </AdminButton>
      </div>
    </form>
  );
}
