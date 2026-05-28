"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  /** Min height of the preview area in px. Defaults to 200. */
  previewHeight?: number;
};

/**
 * Drag-drop / click image upload field. POSTs to /api/upload/local, gets back
 * { url }, then calls onChange(url) so the parent form holds the path.
 *
 * Preview shows the current value (whether a freshly uploaded /uploads/<id>
 * or an externally-set URL the admin pasted).
 */
export function ImageUploadField({
  value,
  onChange,
  label,
  hint,
  previewHeight = 200,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
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
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "UPLOAD_FAILED");
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void upload(file);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {label}
        </span>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        style={{ minHeight: previewHeight }}
        className={cn(
          "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-dashed transition",
          dragOver ? "border-ink bg-bg-deep/40" : "border-line bg-paper hover:border-ink",
        )}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="preview"
              className="h-full w-full object-cover"
              style={{ minHeight: previewHeight }}
            />
            <div className="pointer-events-none absolute inset-0 bg-ink/0 transition group-hover:bg-ink/20" />
            <div className="absolute right-2 top-2 flex gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="rounded-full bg-ink/85 px-3 py-1 font-caps text-[9px] uppercase tracking-[0.22em] text-bg backdrop-blur-md transition hover:bg-ink"
              >
                kaldır
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="rounded-full bg-ink/85 px-3 py-1 font-caps text-[9px] uppercase tracking-[0.22em] text-bg backdrop-blur-md transition hover:bg-ink"
              >
                değiştir
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <div className="font-caps text-[11px] uppercase tracking-[0.28em] text-ink-2">
              {uploading ? "Yükleniyor…" : "Görsel sürükle veya tıkla"}
            </div>
            <div className="font-serif italic text-sm text-ink-mute">
              JPG · PNG · WebP · GIF · max 8 MB
            </div>
          </div>
        )}
      </div>
      {error && (
        <span className="font-serif text-sm text-red-800">Hata: {error}</span>
      )}
      {hint && !error && (
        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute opacity-70">
          {hint}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
