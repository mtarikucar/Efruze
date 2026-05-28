"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminButton,
  FormField,
  FormSection,
  adminInputCls,
  adminTextareaCls,
} from "./primitives";
import { ImageUploadField } from "./ImageUploadField";
import { updateMaisonAction } from "@/app/admin/maison/actions";

type StepEntry = {
  sortOrder: number;
  isActive: boolean;
  tr: { title: string; description: string };
};

type ArtisanEntry = {
  sortOrder: number;
  isActive: boolean;
  imageUrl: string;
  tr: { name: string; role: string; bio: string };
};

export type MaisonEditorInitial = {
  heroImageUrl: string;
  introTr: string;
  steps: StepEntry[];
  artisans: ArtisanEntry[];
};

export function MaisonEditor({ initial }: { initial: MaisonEditorInitial }) {
  const router = useRouter();
  const [form, setForm] = useState<MaisonEditorInitial>(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    const payload = {
      heroImageUrl: form.heroImageUrl,
      introTr: form.introTr,
      introEn: "", // EN kaldırıldı; action TR-only translation row'ları yazıyor.
      steps: form.steps.map((s) => ({
        sortOrder: s.sortOrder,
        isActive: s.isActive,
        translations: [
          { locale: "tr" as const, title: s.tr.title, description: s.tr.description },
        ],
      })),
      artisans: form.artisans.map((a) => ({
        sortOrder: a.sortOrder,
        isActive: a.isActive,
        imageUrl: a.imageUrl,
        translations: [
          { locale: "tr" as const, name: a.tr.name, role: a.tr.role, bio: a.tr.bio },
        ],
      })),
    };
    startTransition(async () => {
      const r = await updateMaisonAction(payload);
      if (!r.ok) setError(r.error);
      else {
        setSavedAt(Date.now());
        router.refresh();
      }
    });
  }

  function updateStep(i: number, patch: Partial<StepEntry>) {
    setForm({
      ...form,
      steps: form.steps.map((s, ix) => (ix === i ? { ...s, ...patch } : s)),
    });
  }

  function updateStepTr(i: number, patch: Partial<StepEntry["tr"]>) {
    setForm({
      ...form,
      steps: form.steps.map((s, ix) =>
        ix === i ? { ...s, tr: { ...s.tr, ...patch } } : s,
      ),
    });
  }

  function addStep() {
    const next = (form.steps.at(-1)?.sortOrder ?? 0) + 10;
    setForm({
      ...form,
      steps: [
        ...form.steps,
        {
          sortOrder: next,
          isActive: true,
          tr: { title: "", description: "" },
        },
      ],
    });
  }

  function removeStep(i: number) {
    setForm({ ...form, steps: form.steps.filter((_, ix) => ix !== i) });
  }

  function updateArtisan(i: number, patch: Partial<ArtisanEntry>) {
    setForm({
      ...form,
      artisans: form.artisans.map((a, ix) => (ix === i ? { ...a, ...patch } : a)),
    });
  }

  function updateArtisanTr(i: number, patch: Partial<ArtisanEntry["tr"]>) {
    setForm({
      ...form,
      artisans: form.artisans.map((a, ix) =>
        ix === i ? { ...a, tr: { ...a.tr, ...patch } } : a,
      ),
    });
  }

  function addArtisan() {
    const next = (form.artisans.at(-1)?.sortOrder ?? 0) + 10;
    setForm({
      ...form,
      artisans: [
        ...form.artisans,
        {
          sortOrder: next,
          isActive: true,
          imageUrl: "",
          tr: { name: "", role: "", bio: "" },
        },
      ],
    });
  }

  function removeArtisan(i: number) {
    setForm({ ...form, artisans: form.artisans.filter((_, ix) => ix !== i) });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-6"
    >
      <FormSection title="Hero & Tanıtım">
        <div className="sm:col-span-2">
          <ImageUploadField
            value={form.heroImageUrl}
            onChange={(url) => setForm({ ...form, heroImageUrl: url })}
            label="Hero görsel"
            previewHeight={300}
          />
        </div>
      </FormSection>

      <section className="rounded-sm card-elev p-6">
        <div className="mb-5">
          <h2 className="m-0 font-serif text-xl font-light text-ink">Giriş paragrafları</h2>
          <p className="m-0 mt-1 font-serif italic text-sm text-ink-mute">
            Paragrafları boş satır ile ayır. Maison sayfasının üst bölümünde görünür.
          </p>
        </div>
        <textarea
          rows={10}
          value={form.introTr}
          onChange={(e) => setForm({ ...form, introTr: e.target.value })}
          className={`${adminTextareaCls} font-serif text-base leading-relaxed`}
        />
      </section>

      <section className="rounded-sm card-elev p-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="m-0 font-serif text-xl font-light text-ink">Süreç adımları</h2>
            <p className="m-0 mt-1 font-serif italic text-sm text-ink-mute">
              Numaralı süreç adımları (01 · 02 · 03 …). Klasik formatta 4 adım.
            </p>
          </div>
          <AdminButton type="button" variant="ghost" size="sm" onClick={addStep}>
            + Adım ekle
          </AdminButton>
        </div>
        <div className="flex flex-col gap-6">
          {form.steps.map((s, i) => (
            <StepRow
              key={i}
              index={i}
              step={s}
              onChange={(patch) => updateStep(i, patch)}
              onChangeTr={(patch) => updateStepTr(i, patch)}
              onRemove={() => removeStep(i)}
            />
          ))}
          {form.steps.length === 0 && (
            <p className="m-0 font-serif italic text-ink-mute">Henüz adım yok.</p>
          )}
        </div>
      </section>

      <section className="rounded-sm card-elev p-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="m-0 font-serif text-xl font-light text-ink">Zanaatkârlar</h2>
            <p className="m-0 mt-1 font-serif italic text-sm text-ink-mute">
              Maison sayfasının altında portreler.
            </p>
          </div>
          <AdminButton type="button" variant="ghost" size="sm" onClick={addArtisan}>
            + Zanaatkâr ekle
          </AdminButton>
        </div>
        <div className="flex flex-col gap-6">
          {form.artisans.map((a, i) => (
            <ArtisanRow
              key={i}
              index={i}
              artisan={a}
              onChange={(patch) => updateArtisan(i, patch)}
              onChangeTr={(patch) => updateArtisanTr(i, patch)}
              onRemove={() => removeArtisan(i)}
            />
          ))}
          {form.artisans.length === 0 && (
            <p className="m-0 font-serif italic text-ink-mute">Henüz zanaatkâr yok.</p>
          )}
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

      <div className="sticky bottom-4 z-10 flex gap-3">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Tüm değişiklikleri kaydet"}
        </AdminButton>
      </div>
    </form>
  );
}

function StepRow({
  index,
  step,
  onChange,
  onChangeTr,
  onRemove,
}: {
  index: number;
  step: StepEntry;
  onChange: (patch: Partial<StepEntry>) => void;
  onChangeTr: (patch: Partial<StepEntry["tr"]>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-sm border border-line bg-paper p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-caps text-[10px] uppercase tracking-[0.28em] text-gold">
          Adım #{String(index + 1).padStart(2, "0")}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="font-caps text-[10px] uppercase tracking-[0.22em] text-red-800 hover:underline"
        >
          kaldır
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[120px_1fr]">
        <FormField label="Sıra">
          <input
            type="number"
            value={step.sortOrder}
            onChange={(e) => onChange({ sortOrder: Number(e.target.value) || 0 })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Başlık">
          <input
            value={step.tr.title}
            onChange={(e) => onChangeTr({ title: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <div />
        <FormField label="Açıklama">
          <textarea
            rows={3}
            value={step.tr.description}
            onChange={(e) => onChangeTr({ description: e.target.value })}
            className={adminTextareaCls}
          />
        </FormField>
      </div>
    </div>
  );
}

function ArtisanRow({
  index,
  artisan,
  onChange,
  onChangeTr,
  onRemove,
}: {
  index: number;
  artisan: ArtisanEntry;
  onChange: (patch: Partial<ArtisanEntry>) => void;
  onChangeTr: (patch: Partial<ArtisanEntry["tr"]>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-sm border border-line bg-paper p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-caps text-[10px] uppercase tracking-[0.28em] text-gold">
          Zanaatkâr #{String(index + 1).padStart(2, "0")}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="font-caps text-[10px] uppercase tracking-[0.22em] text-red-800 hover:underline"
        >
          kaldır
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[120px_1fr_1fr]">
        <FormField label="Sıra">
          <input
            type="number"
            value={artisan.sortOrder}
            onChange={(e) => onChange({ sortOrder: Number(e.target.value) || 0 })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="İsim">
          <input
            value={artisan.tr.name}
            onChange={(e) => onChangeTr({ name: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <FormField label="Rol">
          <input
            value={artisan.tr.role}
            onChange={(e) => onChangeTr({ role: e.target.value })}
            className={adminInputCls}
          />
        </FormField>
        <ImageUploadField
          value={artisan.imageUrl}
          onChange={(url) => onChange({ imageUrl: url })}
          label="Portre görseli"
          previewHeight={160}
        />
        <FormField label="Biyografi" full>
          <textarea
            rows={3}
            value={artisan.tr.bio}
            onChange={(e) => onChangeTr({ bio: e.target.value })}
            className={adminTextareaCls}
          />
        </FormField>
      </div>
    </div>
  );
}
