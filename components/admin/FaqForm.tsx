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
import { createFaqAction, updateFaqAction } from "@/app/admin/faq/actions";
import type { FaqInput } from "@/server/types/faq";

export type FaqFormInitial = {
  id?: string;
  sortOrder: number;
  isActive: boolean;
  translations: {
    tr: { question: string; answer: string };
  };
};

const empty: FaqFormInitial = {
  sortOrder: 0,
  isActive: true,
  translations: {
    tr: { question: "", answer: "" },
  },
};

export function FaqForm({ initial }: { initial: FaqFormInitial | null }) {
  const router = useRouter();
  const [form, setForm] = useState<FaqFormInitial>(initial ?? empty);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial?.id);

  function submit() {
    setError(null);
    const payload: FaqInput & { id?: string } = {
      sortOrder: form.sortOrder,
      isActive: form.isActive,
      translations: [{ locale: "tr", ...form.translations.tr }],
    };
    startTransition(async () => {
      const r = isEdit
        ? await updateFaqAction({ ...payload, id: initial!.id! })
        : await createFaqAction(payload);
      if (r && !r.ok) setError(r.error);
      else if (isEdit) router.refresh();
    });
  }

  function setTr(k: "question" | "answer", v: string) {
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
      <FormSection title="SSS">
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
          <FormField label="Soru" full>
            <input
              required
              value={form.translations.tr.question}
              onChange={(e) => setTr("question", e.target.value)}
              className={adminInputCls}
            />
          </FormField>
          <FormField label="Cevap" full>
            <textarea
              rows={4}
              required
              value={form.translations.tr.answer}
              onChange={(e) => setTr("answer", e.target.value)}
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
          {pending ? "…" : isEdit ? "Kaydet" : "SSS oluştur"}
        </AdminButton>
        <AdminButton type="button" variant="ghost" onClick={() => router.back()}>
          Vazgeç
        </AdminButton>
      </div>
    </form>
  );
}
