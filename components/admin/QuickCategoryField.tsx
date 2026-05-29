"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { quickCreateCategoryAction } from "@/app/admin/categories/actions";
import { AdminButton, adminInputCls } from "./primitives";

type ParentOption = { id: string; name: string };

/**
 * Inline "+ Yeni kategori" used inside the product form so the admin can create
 * a category without leaving the page (kills the products↔categories shuttle).
 * On success it hands the new category back to the parent form via onCreated.
 */
export function QuickCategoryField({
  parents,
  onCreated,
}: {
  parents: ParentOption[];
  onCreated: (cat: { id: string; name: string; parentId?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Kategori adı gerekli");
      return;
    }
    startTransition(async () => {
      const r = await quickCreateCategoryAction({ name: trimmed, parentId });
      if (r.ok) {
        onCreated({ id: r.id, name: r.name, parentId: parentId || undefined });
        setName("");
        setParentId("");
        setOpen(false);
      } else {
        setError(r.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 self-start font-caps text-[10px] uppercase tracking-[0.22em] text-blue-deep transition hover:text-ink"
      >
        <Plus size={12} strokeWidth={1.5} /> Yeni kategori
      </button>
    );
  }

  return (
    <div className="rounded-sm border border-line bg-bg-deep/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-caps text-[10px] uppercase tracking-[0.28em] text-gold">
          Yeni kategori
        </span>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          aria-label="Kapat"
          className="text-ink-mute transition hover:text-ink"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kategori adı"
          className={adminInputCls}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className={adminInputCls}
        >
          <option value="">Üst kategori yok</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="mt-2 m-0 font-serif text-sm text-red-800">{error}</p>
      )}
      <div className="mt-3">
        <AdminButton type="button" size="sm" onClick={submit} disabled={pending}>
          {pending ? "Ekleniyor…" : "Kategori ekle"}
        </AdminButton>
      </div>
    </div>
  );
}
