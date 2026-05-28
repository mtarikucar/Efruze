"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  AdminButton,
  FormField,
  adminInputCls,
  adminCheckboxCls,
} from "./primitives";
import { upsertBankAction, deleteBankAction } from "@/app/admin/banks/actions";

type Bank = {
  id?: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  swift: string;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

const empty: Bank = {
  bankName: "",
  accountHolder: "",
  iban: "",
  swift: "",
  currency: "TRY",
  isActive: true,
  sortOrder: 0,
};

export function BanksPanel({ banks }: { banks: Bank[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Bank | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save(b: Bank) {
    setError(null);
    startTransition(async () => {
      const r = await upsertBankAction(b);
      if (r.ok) {
        setEditing(null);
        router.refresh();
      } else setError(r.error);
    });
  }

  function remove(id: string) {
    if (!confirm("Bu banka hesabı silinsin mi?")) return;
    startTransition(async () => {
      const r = await deleteBankAction({ id });
      if (r.ok) router.refresh();
      else setError(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {banks.map((b) => (
          <li key={b.id} className="rounded-sm card-elev p-5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-caps text-[10px] uppercase tracking-[0.28em] text-gold">
                {b.bankName}
              </span>
              <button
                type="button"
                aria-label="Sil"
                onClick={() => remove(b.id!)}
                className="text-ink-mute transition hover:text-red-700"
              >
                <Trash2 size={14} strokeWidth={1.25} />
              </button>
            </div>
            <div className="mt-2 font-serif text-base text-ink">{b.accountHolder}</div>
            <div className="mt-1 font-serif text-base tracking-[0.04em] text-ink">
              IBAN {b.iban}
            </div>
            {b.swift && (
              <div className="mt-1 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                SWIFT · {b.swift}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
              <span>{b.isActive ? "aktif" : "pasif"}</span>
              <button
                type="button"
                onClick={() => setEditing(b)}
                className="text-ink underline-offset-4 hover:underline"
              >
                Düzenle
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!editing && (
        <AdminButton type="button" onClick={() => setEditing(empty)}>
          + Banka hesabı ekle
        </AdminButton>
      )}

      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(editing);
          }}
          className="rounded-sm card-elev p-6"
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <FormField label="Banka adı">
              <input
                required
                value={editing.bankName}
                onChange={(e) => setEditing({ ...editing, bankName: e.target.value })}
                className={adminInputCls}
              />
            </FormField>
            <FormField label="Hesap sahibi">
              <input
                required
                value={editing.accountHolder}
                onChange={(e) =>
                  setEditing({ ...editing, accountHolder: e.target.value })
                }
                className={adminInputCls}
              />
            </FormField>
            <FormField label="IBAN">
              <input
                required
                value={editing.iban}
                onChange={(e) => setEditing({ ...editing, iban: e.target.value })}
                className={adminInputCls}
              />
            </FormField>
            <FormField label="SWIFT (isteğe bağlı)">
              <input
                value={editing.swift}
                onChange={(e) => setEditing({ ...editing, swift: e.target.value })}
                className={adminInputCls}
              />
            </FormField>
            <FormField label="Para birimi">
              <input
                value={editing.currency}
                onChange={(e) => setEditing({ ...editing, currency: e.target.value })}
                className={adminInputCls}
                maxLength={3}
              />
            </FormField>
            <FormField label="Sıra">
              <input
                type="number"
                value={editing.sortOrder}
                onChange={(e) =>
                  setEditing({ ...editing, sortOrder: Number(e.target.value) || 0 })
                }
                className={adminInputCls}
              />
            </FormField>
            <FormField label="Aktif">
              <label className="inline-flex items-center gap-2 pt-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) =>
                    setEditing({ ...editing, isActive: e.target.checked })
                  }
                  className={adminCheckboxCls}
                />
                Ödeme adımında görünür
              </label>
            </FormField>
          </div>

          {error && (
            <div className="mt-4 rounded-sm border border-red-700/30 bg-red-700/5 p-3 font-serif text-base text-red-900">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <AdminButton type="submit" disabled={pending}>
              {pending ? "…" : "Kaydet"}
            </AdminButton>
            <AdminButton type="button" variant="ghost" onClick={() => setEditing(null)}>
              Vazgeç
            </AdminButton>
          </div>
        </form>
      )}
    </div>
  );
}
