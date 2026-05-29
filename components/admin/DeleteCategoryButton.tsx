"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminButton } from "./primitives";
import { deleteCategoryAction } from "@/app/admin/categories/actions";

/**
 * Client delete control for a category. Unlike a bare server-action form it
 * surfaces the guard error ("N ürün var…") instead of silently no-op'ing, and
 * is disabled up-front when the category still holds products.
 */
export function DeleteCategoryButton({
  id,
  productCount,
}: {
  id: string;
  productCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const blocked = productCount > 0;

  function handleDelete() {
    setError(null);
    if (blocked) return;
    if (!window.confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      const result = await deleteCategoryAction({ id });
      if (result && !result.ok) {
        setError(result.error);
      } else {
        router.push("/admin/categories");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <AdminButton
        type="button"
        variant="danger"
        size="md"
        onClick={handleDelete}
        disabled={pending || blocked}
        title={blocked ? "Önce ürünleri taşıyın veya silin" : undefined}
      >
        {pending ? "Siliniyor…" : "Sil"}
      </AdminButton>
      {blocked && (
        <p className="m-0 max-w-[14rem] text-right font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {productCount} ürün var; önce taşıyın veya silin
        </p>
      )}
      {error && (
        <p className="m-0 max-w-[18rem] text-right font-serif text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
