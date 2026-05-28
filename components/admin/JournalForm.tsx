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
import { createJournalAction, updateJournalAction } from "@/app/admin/journal/actions";
import type { JournalInput } from "@/server/types/journal";

export type JournalFormInitial = {
  id?: string;
  slug: string;
  date: string;
  imageUrl: string;
  featured: boolean;
  readMinutes: number;
  isPublished: boolean;
  sortOrder: number;
  translations: {
    tr: { category: string; title: string; excerpt: string; body: string };
  };
};

const empty: JournalFormInitial = {
  slug: "",
  date: new Date().toISOString().slice(0, 16),
  imageUrl: "",
  featured: false,
  readMinutes: 5,
  isPublished: true,
  sortOrder: 0,
  translations: {
    tr: { category: "Atölyeden", title: "", excerpt: "", body: "" },
  },
};

export function JournalForm({ initial }: { initial: JournalFormInitial | null }) {
  const router = useRouter();
  const [form, setForm] = useState<JournalFormInitial>(initial ?? empty);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial?.id);

  function submit() {
    setError(null);
    const payload: JournalInput & { id?: string } = {
      slug: form.slug,
      date: form.date,
      imageUrl: form.imageUrl,
      featured: form.featured,
      readMinutes: form.readMinutes,
      isPublished: form.isPublished,
      sortOrder: form.sortOrder,
      translations: [{ locale: "tr", ...form.translations.tr }],
    };
    startTransition(async () => {
      const r = isEdit
        ? await updateJournalAction({ ...payload, id: initial!.id! })
        : await createJournalAction(payload);
      if (r && !r.ok) setError(r.error);
      else if (isEdit) router.refresh();
    });
  }

  function setTr(k: keyof JournalFormInitial["translations"]["tr"], v: string) {
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
      <FormSection title="Yazı">
        <FormField label="Yayın tarihi">
          <input
            type="datetime-local"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Slug (boş = başlıktan üret)">
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <ImageUploadField
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
          label="Görsel"
        />
        <FormField label="Okuma süresi (dakika)">
          <input
            type="number"
            min="1"
            max="120"
            value={form.readMinutes}
            onChange={(e) => setForm({ ...form, readMinutes: Number(e.target.value) || 5 })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Sıralama">
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Bayraklar">
          <div className="flex flex-wrap gap-5 pt-2">
            <label className="inline-flex items-center gap-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className={adminCheckboxCls}
              />
              Öne çıkan (Bu hafta)
            </label>
            <label className="inline-flex items-center gap-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className={adminCheckboxCls}
              />
              Yayında
            </label>
          </div>
        </FormField>
      </FormSection>

      <section className="rounded-sm card-elev p-6">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="m-0 font-serif text-xl font-light text-ink">İçerik</h2>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <FormField label="Kategori" full>
            <input
              required
              value={form.translations.tr.category}
              onChange={(e) => setTr("category", e.target.value)}
              className={adminInputCls}
              placeholder='örn. "Atölyeden"'
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
          <FormField label="Özet (listede gösterilir)" full>
            <textarea
              rows={3}
              value={form.translations.tr.excerpt}
              onChange={(e) => setTr("excerpt", e.target.value)}
              className={adminTextareaCls}
            />
          </FormField>
          <FormField label="Gövde (tam metin — düz paragraflar)" full>
            <textarea
              rows={8}
              value={form.translations.tr.body}
              onChange={(e) => setTr("body", e.target.value)}
              className={adminTextareaCls}
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
          {pending ? "…" : isEdit ? "Kaydet" : "Yazı oluştur"}
        </AdminButton>
        <AdminButton type="button" variant="ghost" onClick={() => router.back()}>
          Vazgeç
        </AdminButton>
      </div>
    </form>
  );
}
