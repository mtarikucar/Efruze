"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import {
  AdminButton,
  FormField,
  FormSection,
  adminInputCls,
  adminTextareaCls,
  adminCheckboxCls,
} from "./primitives";
import { CloudinaryImageList, type ImageItem } from "./CloudinaryImageList";
import { CloudinaryGLBUpload, type Model3DItem } from "./CloudinaryGLBUpload";
import {
  createProductAction,
  updateProductAction,
  type ProductInput,
} from "@/app/admin/products/actions";

type CategoryOption = { id: string; name: string };
type ImageRow = ImageItem;
type VariantRow = {
  id?: string;
  sku: string;
  stock: number;
  priceOverride?: string;
  isDefault: boolean;
};

export type ProductFormInitial = {
  id?: string;
  slug: string;
  sku: string;
  categoryId: string;
  basePrice: string;
  currency: string;
  editionTotal: number | null;
  editionNumber: number | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  translations: {
    tr: { name: string; tagline: string; description: string; materials: string };
  };
  variants: VariantRow[];
  images: ImageRow[];
  model3d: Model3DItem | null;
};

const emptyInitial: ProductFormInitial = {
  slug: "",
  sku: "",
  categoryId: "",
  basePrice: "0",
  currency: "TRY",
  editionTotal: null,
  editionNumber: null,
  isFeatured: false,
  isPublished: false,
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
  translations: {
    tr: { name: "", tagline: "", description: "", materials: "" },
  },
  variants: [{ sku: "", stock: 10, priceOverride: "", isDefault: true }],
  images: [],
  model3d: null,
};

export function ProductForm({
  initial,
  categories,
}: {
  initial: ProductFormInitial | null;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const data = initial ?? emptyInitial;
  const [form, setForm] = useState<ProductFormInitial>(data);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(initial?.id);

  function set<K extends keyof ProductFormInitial>(k: K, v: ProductFormInitial[K]) {
    setForm({ ...form, [k]: v });
  }

  function setTranslation(
    k: keyof ProductFormInitial["translations"]["tr"],
    v: string,
  ) {
    setForm({
      ...form,
      translations: {
        ...form.translations,
        tr: { ...form.translations.tr, [k]: v },
      },
    });
  }

  function setVariant(i: number, patch: Partial<VariantRow>) {
    const next = form.variants.slice();
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, variants: next });
  }

  function addVariant() {
    setForm({
      ...form,
      variants: [
        ...form.variants,
        { sku: "", stock: 0, priceOverride: "", isDefault: false },
      ],
    });
  }

  function removeVariant(i: number) {
    if (form.variants.length === 1) return;
    const next = form.variants.filter((_, idx) => idx !== i);
    setForm({ ...form, variants: next });
  }

  async function submit() {
    setError(null);
    const payload: ProductInput & { id?: string } = {
      slug: form.slug,
      sku: form.sku,
      categoryId: form.categoryId,
      basePrice: form.basePrice,
      currency: form.currency,
      editionTotal: form.editionTotal ?? undefined,
      editionNumber: form.editionNumber ?? undefined,
      isFeatured: form.isFeatured,
      isPublished: form.isPublished,
      sortOrder: form.sortOrder,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      translations: [{ locale: "tr", ...form.translations.tr }],
      variants: form.variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        sku: v.sku,
        stock: v.stock,
        priceOverride: v.priceOverride || "",
        isDefault: v.isDefault,
      })),
      images: form.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
      model3d: form.model3d,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateProductAction({ ...payload, id: initial!.id! })
        : await createProductAction(payload);
      if (result && !result.ok) {
        setError(result.error);
      } else if (isEdit) {
        router.refresh();
      }
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
      <FormSection title="Katalog">
        <FormField label="SKU">
          <input
            required
            value={form.sku}
            onChange={(e) => set("sku", e.target.value)}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Slug (boş = isimden üretilir)">
          <input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            className={adminInputCls}
            placeholder="firuze-ipek-esarp"
          />
        </FormField>
        <FormField label="Kategori">
          <select
            required
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className={adminInputCls}
          >
            <option value="">— seç —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Temel fiyat (TRY)">
          <input
            required
            value={form.basePrice}
            onChange={(e) => set("basePrice", e.target.value)}
            className={adminInputCls}
            inputMode="decimal"
          />
        </FormField>
        <FormField label="Edisyon numarası" hint='"N° XXX" olarak gösterilir'>
          <input
            value={form.editionNumber ?? ""}
            onChange={(e) =>
              set("editionNumber", e.target.value ? Number(e.target.value) : null)
            }
            className={adminInputCls}
            inputMode="numeric"
          />
        </FormField>
        <FormField label="Edisyon toplamı" hint='Boş = açık edisyon; sayı = "1 / N"'>
          <input
            value={form.editionTotal ?? ""}
            onChange={(e) =>
              set("editionTotal", e.target.value ? Number(e.target.value) : null)
            }
            className={adminInputCls}
            inputMode="numeric"
          />
        </FormField>
        <FormField label="Sıralama">
          <input
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
            className={adminInputCls}
            inputMode="numeric"
          />
        </FormField>
        <FormField label="Bayraklar">
          <div className="flex flex-wrap gap-5 pt-2">
            <label className="inline-flex items-center gap-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => set("isFeatured", e.target.checked)}
                className={adminCheckboxCls}
              />
              Öne çıkan
            </label>
            <label className="inline-flex items-center gap-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => set("isPublished", e.target.checked)}
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
          <FormField label="İsim" full>
            <input
              required
              value={form.translations.tr.name}
              onChange={(e) => setTranslation("name", e.target.value)}
              className={adminInputCls}
            />
          </FormField>
          <FormField label="Slogan" full>
            <input
              value={form.translations.tr.tagline}
              onChange={(e) => setTranslation("tagline", e.target.value)}
              className={adminInputCls}
            />
          </FormField>
          <FormField label="Açıklama" full>
            <textarea
              rows={4}
              value={form.translations.tr.description}
              onChange={(e) => setTranslation("description", e.target.value)}
              className={adminTextareaCls}
            />
          </FormField>
          <FormField label="Malzemeler" full>
            <textarea
              rows={2}
              value={form.translations.tr.materials}
              onChange={(e) => setTranslation("materials", e.target.value)}
              className={adminTextareaCls}
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-sm card-elev p-6">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="m-0 font-serif text-xl font-light text-ink">Varyantlar</h2>
          <AdminButton type="button" variant="ghost" size="sm" onClick={addVariant}>
            <Plus size={12} /> Varyant ekle
          </AdminButton>
        </div>
        <div className="flex flex-col gap-3">
          {form.variants.map((v, i) => (
            <div
              key={i}
              className="grid grid-cols-1 items-end gap-3 border-b border-line pb-3 last:border-b-0 sm:grid-cols-[2fr_1fr_1fr_auto_auto]"
            >
              <FormField label="SKU">
                <input
                  required
                  value={v.sku}
                  onChange={(e) => setVariant(i, { sku: e.target.value })}
                  className={adminInputCls}
                />
              </FormField>
              <FormField label="Stok">
                <input
                  required
                  type="number"
                  min="0"
                  value={v.stock}
                  onChange={(e) => setVariant(i, { stock: Number(e.target.value) || 0 })}
                  className={adminInputCls}
                />
              </FormField>
              <FormField label="Fiyat üstüne yazma">
                <input
                  value={v.priceOverride ?? ""}
                  onChange={(e) => setVariant(i, { priceOverride: e.target.value })}
                  placeholder="(temel fiyat)"
                  className={adminInputCls}
                  inputMode="decimal"
                />
              </FormField>
              <label className="inline-flex items-center gap-2 pb-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
                <input
                  type="radio"
                  checked={v.isDefault}
                  onChange={() =>
                    setForm({
                      ...form,
                      variants: form.variants.map((vv, idx) => ({
                        ...vv,
                        isDefault: idx === i,
                      })),
                    })
                  }
                  className={adminCheckboxCls}
                />
                Varsayılan
              </label>
              <button
                type="button"
                aria-label="Varyantı kaldır"
                onClick={() => removeVariant(i)}
                className="self-end pb-3 text-ink-mute transition hover:text-red-700 disabled:opacity-30"
                disabled={form.variants.length === 1}
              >
                <Trash2 size={14} strokeWidth={1.25} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-sm card-elev p-6">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="m-0 font-serif text-xl font-light text-ink">Görseller</h2>
          <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
            Sıralamak için sürükle · ilk = ana görsel
          </span>
        </div>
        <CloudinaryImageList
          value={form.images}
          onChange={(images) => setForm({ ...form, images })}
        />
      </section>

      <section className="rounded-sm card-elev p-6">
        <h2 className="m-0 mb-5 font-serif text-xl font-light text-ink">3D model</h2>
        <CloudinaryGLBUpload
          value={form.model3d}
          onChange={(model3d) => setForm({ ...form, model3d })}
        />
      </section>

      <FormSection title="SEO">
        <FormField label="SEO başlık" full>
          <input
            value={form.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="SEO açıklama" full>
          <textarea
            rows={2}
            value={form.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
            className={adminTextareaCls}
          />
        </FormField>
      </FormSection>

      {error && (
        <div className="rounded-sm border border-red-700/30 bg-red-700/5 p-4 font-serif text-base text-red-900">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <AdminButton type="submit" variant="ink" disabled={pending}>
          {pending ? "…" : isEdit ? "Kaydet" : "Ürün oluştur"}
        </AdminButton>
        <AdminButton type="button" variant="ghost" onClick={() => router.back()}>
          Vazgeç
        </AdminButton>
      </div>
    </form>
  );
}
