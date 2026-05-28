"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AddressInput } from "@/server/types/order";
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
} from "@/app/(storefront)/account/actions";

type AddressRow = AddressInput & { id: string; type: "SHIPPING" | "BILLING" };

const inputCls =
  "w-full border-0 border-b border-line bg-transparent px-1 py-3 font-serif text-base text-ink outline-none placeholder:italic placeholder:text-ink-mute focus:border-ink";

const empty: AddressRow = {
  id: "",
  type: "SHIPPING",
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  district: "",
  postalCode: "",
  country: "TR",
  phone: "",
};

export function AddressesPanel({ addresses }: { addresses: AddressRow[] }) {
  const t = useTranslations("account");
  const [editing, setEditing] = useState<AddressRow | null>(null);
  const [pending, startTransition] = useTransition();

  function save(row: AddressRow) {
    const isNew = !row.id;
    startTransition(async () => {
      const result = isNew
        ? await createAddressAction({ ...row, id: undefined })
        : await updateAddressAction(row);
      if (result.ok) setEditing(null);
    });
  }

  function remove(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    startTransition(() => {
      void deleteAddressAction({ id });
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {addresses.length === 0 && !editing && (
        <div className="rounded-sm card-elev p-12 text-center">
          <p className="m-0 font-serif italic text-lg text-ink-2">{t("addressesEmpty")}</p>
        </div>
      )}

      {addresses.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-sm card-elev p-6">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-caps text-[10px] uppercase tracking-[0.28em] text-gold">
                  {a.type === "SHIPPING" ? t("typeShipping") : t("typeBilling")}
                </span>
                <button
                  type="button"
                  aria-label={t("delete")}
                  disabled={pending}
                  onClick={() => remove(a.id)}
                  className="text-ink-mute transition hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 size={14} strokeWidth={1.25} />
                </button>
              </div>
              <p className="mt-3 m-0 font-serif text-base leading-relaxed text-ink">
                {a.fullName}
                <br />
                {a.line1}
                {a.line2 && (<><br />{a.line2}</>)}
                <br />
                {a.city}{a.district ? ` · ${a.district}` : ""} · {a.postalCode}
                {a.phone && (<><br /><span className="text-ink-mute">{a.phone}</span></>)}
              </p>
              <button
                type="button"
                onClick={() => setEditing(a)}
                className="mt-4 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute underline-offset-4 hover:text-ink hover:underline"
              >
                {t("edit")}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!editing && (
        <button
          type="button"
          onClick={() => setEditing(empty)}
          className="inline-flex w-full items-center justify-center rounded-full border border-ink bg-ink px-6 py-3 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2 sm:w-auto sm:self-start"
        >
          {t("addAddress")}
        </button>
      )}

      {editing && (
        <AddressEditor
          row={editing}
          pending={pending}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function AddressEditor({
  row,
  pending,
  onCancel,
  onSave,
}: {
  row: AddressRow;
  pending: boolean;
  onCancel: () => void;
  onSave: (next: AddressRow) => void;
}) {
  const t = useTranslations("account");
  const [draft, setDraft] = useState<AddressRow>(row);
  const set = <K extends keyof AddressRow>(k: K, v: AddressRow[K]) =>
    setDraft({ ...draft, [k]: v });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
      className="rounded-sm card-elev p-6 sm:p-8"
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {t("type")}
        </span>
        {(["SHIPPING", "BILLING"] as const).map((tp) => (
          <button
            key={tp}
            type="button"
            onClick={() => set("type", tp)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-caps text-[10px] uppercase tracking-[0.22em] transition",
              draft.type === tp
                ? "border-ink bg-ink text-bg"
                : "border-line text-ink-2 hover:border-ink/60",
            )}
          >
            {tp === "SHIPPING" ? t("typeShipping") : t("typeBilling")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        <Lbl label={t("fullName")}><input className={inputCls} value={draft.fullName} onChange={(e) => set("fullName", e.target.value)} required /></Lbl>
        <Lbl label={t("phone")}><input className={inputCls} value={draft.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Lbl>
        <div className="sm:col-span-2">
          <Lbl label={t("line1")}><input className={inputCls} value={draft.line1} onChange={(e) => set("line1", e.target.value)} required /></Lbl>
        </div>
        <div className="sm:col-span-2">
          <Lbl label={t("line2")}><input className={inputCls} value={draft.line2 ?? ""} onChange={(e) => set("line2", e.target.value)} /></Lbl>
        </div>
        <Lbl label={t("city")}><input className={inputCls} value={draft.city} onChange={(e) => set("city", e.target.value)} required /></Lbl>
        <Lbl label={t("district")}><input className={inputCls} value={draft.district ?? ""} onChange={(e) => set("district", e.target.value)} /></Lbl>
        <Lbl label={t("postalCode")}><input className={inputCls} value={draft.postalCode} onChange={(e) => set("postalCode", e.target.value)} required /></Lbl>
        <Lbl label={t("country")}><input className={inputCls} value={draft.country} maxLength={2} onChange={(e) => set("country", e.target.value)} required /></Lbl>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2 disabled:opacity-60"
        >
          {pending ? "…" : t("save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-full border border-line bg-transparent px-6 py-3 font-caps text-[11px] uppercase tracking-[0.22em] text-ink-2 transition hover:border-ink hover:text-ink"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}

function Lbl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 flex flex-col gap-2">
      <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">{label}</span>
      {children}
    </label>
  );
}
