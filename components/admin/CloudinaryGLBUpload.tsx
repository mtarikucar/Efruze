"use client";

import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { AdminButton, FormField, adminInputCls } from "./primitives";

export type Model3DItem = {
  glbUrl: string;
  usdzUrl: string;
  posterUrl: string;
  publicId: string;
};

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export function CloudinaryGLBUpload({
  value,
  onChange,
}: {
  value: Model3DItem | null;
  onChange: (next: Model3DItem | null) => void;
}) {
  const glbInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadGLB(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!/\.(glb|gltf)$/i.test(file.name)) {
      setError(`.glb / .gltf bekleniyordu, "${file.name}" geldi`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Dosya 25 MB üzeri`);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/local", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `UPLOAD_FAILED_${res.status}`);
      }
      const { url } = (await res.json()) as { url: string };
      onChange({
        glbUrl: url,
        usdzUrl: value?.usdzUrl ?? "",
        posterUrl: value?.posterUrl ?? "",
        publicId: url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "UPLOAD_FAILED");
    } finally {
      setUploading(false);
    }
  }

  if (!value?.glbUrl) {
    return (
      <div className="flex flex-col gap-3">
        <input
          ref={glbInputRef}
          type="file"
          accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
          className="hidden"
          onChange={(e) => {
            void uploadGLB(e.target.files?.[0]);
            if (glbInputRef.current) glbInputRef.current.value = "";
          }}
        />
        <AdminButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => glbInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={12} /> {uploading ? "Yükleniyor…" : "GLB / GLTF yükle"}
        </AdminButton>
        {error && <p className="m-0 font-serif italic text-base text-red-800">{error}</p>}
        <p className="m-0 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          Maks 25 MB. Draco ile sıkıştırılmış GLB tercih edilir.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-sm border border-line bg-bg-deep/30 p-3">
        <div className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
          GLB yüklendi
        </div>
        <button
          type="button"
          aria-label="GLB kaldır"
          onClick={() => onChange(null)}
          className="text-ink-mute transition hover:text-red-700"
        >
          <Trash2 size={14} strokeWidth={1.25} />
        </button>
      </div>

      <FormField label="Poster görsel URL (3D yüklenmeden önce gösterilir)">
        <input
          value={value.posterUrl}
          onChange={(e) => onChange({ ...value, posterUrl: e.target.value })}
          placeholder="/uploads/..."
          className={adminInputCls}
        />
      </FormField>

      <FormField label="USDZ URL (iOS AR için) — opsiyonel">
        <input
          value={value.usdzUrl}
          onChange={(e) => onChange({ ...value, usdzUrl: e.target.value })}
          placeholder="https://..."
          className={adminInputCls}
        />
      </FormField>
    </div>
  );
}
