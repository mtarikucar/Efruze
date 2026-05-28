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
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryInput,
} from "@/app/admin/categories/actions";

export type CategoryFormInitial = {
  id?: string;
  slug: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string;
  translations: {
    tr: { name: string; description: string };
  };
};

const emptyInitial: CategoryFormInitial = {
  slug: "",
  parentId: "",
  sortOrder: 0,
  isActive: true,
  imageUrl: "",
  translations: {
    tr: { name: "", description: "" },
  },
};

export function CategoryForm({
  initial,
  parents,
}: {
  initial: CategoryFormInitial | null;
  parents: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryFormInitial>(initial ?? emptyInitial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial?.id);

  function setTr(k: "name" | "description", v: string) {
    setForm({
      ...form,
      translations: {
        ...form.translations,
        tr: { ...form.translations.tr, [k]: v },
      },
    });
  }

  async function submit() {
    setError(null);
    const payload: CategoryInput & { id?: string } = {
      slug: form.slug,
      parentId: form.parentId,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
      imageUrl: form.imageUrl,
      translations: [{ locale: "tr", ...form.translations.tr }],
    };
    startTransition(async () => {
      const r = isEdit
        ? await updateCategoryAction({ ...payload, id: initial!.id! })
        : await createCategoryAction(payload);
      if (r && !r.ok) setError(r.error);
      else if (isEdit) router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-6"
    >
      <FormSection title="Ayarlar">
        <FormField label="Slug (boş = isimden üretilir)">
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Üst kategori (opsiyonel)">
          <select
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            className={adminInputCls}
          >
            <option value="">— en üst seviye —</option>
            {parents
              .filter((p) => p.id !== initial?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </FormField>
        <FormField label="Sıralama">
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
            className={adminInputCls}
          />
        </FormField>
        <ImageUploadField
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
          label="Görsel"
        />
        <FormField label="Aktif">
          <label className="inline-flex items-center gap-2 pt-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className={adminCheckboxCls}
            />
            Sitede görünür
          </label>
        </FormField>
      </FormSection>

      <section className="rounded-sm card-elev p-6">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="m-0 font-serif text-xl font-light text-ink">İçerik</h2>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <FormField label="İsim" full>
            <input
              required
              value={form.translations.tr.name}
              onChange={(e) => setTr("name", e.target.value)}
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
        </div>
      </section>

      {error && (
        <div className="rounded-sm border border-red-700/30 bg-red-700/5 p-4 font-serif text-base text-red-900">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "…" : isEdit ? "Kaydet" : "Kategori oluştur"}
        </AdminButton>
        <AdminButton type="button" variant="ghost" onClick={() => router.back()}>
          Vazgeç
        </AdminButton>
      </div>
    </form>
  );
}
