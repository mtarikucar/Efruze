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
import { updateStaticPageAction } from "@/app/admin/pages/actions";
import type { StaticPageInput } from "@/server/types/static-page";

export type StaticPageFormInitial = {
  id: string;
  slug: string;
  isActive: boolean;
  translations: {
    tr: { title: string; intro: string; body: string };
  };
};

export function StaticPageForm({ initial }: { initial: StaticPageFormInitial }) {
  const router = useRouter();
  const [form, setForm] = useState<StaticPageFormInitial>(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    const payload: StaticPageInput & { id: string } = {
      id: initial.id,
      slug: form.slug,
      isActive: form.isActive,
      translations: [{ locale: "tr", ...form.translations.tr }],
    };
    startTransition(async () => {
      const r = await updateStaticPageAction(payload);
      if (!r.ok) setError(r.error);
      else {
        setSavedAt(Date.now());
        router.refresh();
      }
    });
  }

  function setTr(k: "title" | "intro" | "body", v: string) {
    setForm({
      ...form,
      translations: { ...form.translations, tr: { ...form.translations.tr, [k]: v } },
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
      <FormSection title="Sayfa">
        <FormField label="Slug (URL yolu — örn. terms, privacy)" full>
          <input
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Durum" full>
          <label className="inline-flex items-center gap-2 pt-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className={adminCheckboxCls}
            />
            Aktif (sitede görünür)
          </label>
        </FormField>
      </FormSection>

      <section className="rounded-sm card-elev p-6">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="m-0 font-serif text-xl font-light text-ink">İçerik</h2>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4">
          <FormField label="Başlık" full>
            <input
              required
              value={form.translations.tr.title}
              onChange={(e) => setTr("title", e.target.value)}
              className={adminInputCls}
            />
          </FormField>
          <FormField label="Giriş / uyarı (opsiyonel)" full hint="Gövdenin üstünde gözüken kısa not — şablon uyarısı vs.">
            <textarea
              rows={2}
              value={form.translations.tr.intro}
              onChange={(e) => setTr("intro", e.target.value)}
              className={adminTextareaCls}
            />
          </FormField>
          <FormField
            label="Gövde"
            full
            hint="Paragrafları boş satır ile ayır. Bölüm başlıkları için '1. Title' gibi numaralı satırlar kullanabilirsin."
          >
            <textarea
              rows={20}
              required
              value={form.translations.tr.body}
              onChange={(e) => setTr("body", e.target.value)}
              className={`${adminTextareaCls} font-serif text-base leading-relaxed`}
            />
          </FormField>
        </div>
      </section>

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

      <div className="flex gap-3">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "…" : "Kaydet"}
        </AdminButton>
        <AdminButton type="button" variant="ghost" onClick={() => router.back()}>
          Vazgeç
        </AdminButton>
      </div>
    </form>
  );
}
