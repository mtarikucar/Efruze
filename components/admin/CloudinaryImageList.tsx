"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { GripVertical, Trash2, Star, Upload } from "lucide-react";
import { AdminButton, adminInputCls } from "./primitives";
import { cn } from "@/lib/cn";

export type ImageItem = { url: string; alt?: string; publicId?: string };

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export function CloudinaryImageList({
  value,
  onChange,
}: {
  value: ImageItem[];
  onChange: (next: ImageItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const accepted = Array.from(files).filter((f) => {
        if (!/^image\//.test(f.type)) {
          setError(`Görsel olmayan dosya atlandı: ${f.name}`);
          return false;
        }
        if (f.size > MAX_BYTES) {
          setError(`${f.name} atlandı — 8 MB üzeri`);
          return false;
        }
        return true;
      });
      const next: ImageItem[] = [...value];
      for (const file of accepted) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload/local", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `UPLOAD_FAILED_${res.status}`);
        }
        const { url } = (await res.json()) as { url: string };
        next.push({ url, alt: "" });
      }
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "UPLOAD_FAILED");
    } finally {
      setUploading(false);
    }
  }

  function update(i: number, patch: Partial<ImageItem>) {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function move(from: number, to: number) {
    if (from === to) return;
    const next = value.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {value.length === 0 ? (
        <DropZone
          onFiles={handleFiles}
          uploading={uploading}
          onPick={() => inputRef.current?.click()}
        >
          Görselleri buraya sürükle ya da tıkla. İlk görsel ana görsel olur.
        </DropZone>
      ) : (
        <ul className="flex flex-col gap-2">
          {value.map((img, i) => (
            <li
              key={`${img.url}-${i}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex != null) move(dragIndex, i);
                setDragIndex(null);
              }}
              className={cn(
                "grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-3 rounded-sm border bg-bg-deep/30 p-3 transition",
                dragIndex === i ? "border-ink opacity-50" : "border-line",
              )}
            >
              <GripVertical
                size={16}
                strokeWidth={1.25}
                className="cursor-grab text-ink-mute"
              />
              <div className="relative h-16 w-16 flex-none overflow-hidden rounded-sm bg-paper">
                <Image
                  src={img.url}
                  alt={img.alt ?? ""}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <input
                value={img.alt ?? ""}
                onChange={(e) => update(i, { alt: e.target.value })}
                placeholder="Alt metin"
                className={`${adminInputCls} border-b-0 py-1.5`}
              />
              {i === 0 ? (
                <span className="inline-flex items-center gap-1 font-caps text-[9px] uppercase tracking-[0.22em] text-gold">
                  <Star size={11} strokeWidth={1.5} /> ana görsel
                </span>
              ) : (
                <span className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  #{i + 1}
                </span>
              )}
              <button
                type="button"
                aria-label="Görseli kaldır"
                onClick={() => remove(i)}
                className="text-ink-mute transition hover:text-red-700"
              >
                <Trash2 size={14} strokeWidth={1.25} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
        <AdminButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={12} /> {uploading ? "Yükleniyor…" : "Görsel ekle"}
        </AdminButton>
        {error && (
          <span className="font-serif italic text-base text-red-800">{error}</span>
        )}
      </div>
    </div>
  );
}

function DropZone({
  onFiles,
  uploading,
  onPick,
  children,
}: {
  onFiles: (files: FileList | null) => Promise<void>;
  uploading: boolean;
  onPick: () => void;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        void onFiles(e.dataTransfer.files);
      }}
      onClick={onPick}
      role="button"
      tabIndex={0}
      className={cn(
        "cursor-pointer rounded-sm border border-dashed bg-bg-deep/20 p-10 text-center font-serif italic text-ink-mute transition",
        hover && "border-ink bg-bg-deep/40",
        !hover && "border-line",
        uploading && "opacity-60",
      )}
    >
      {children}
    </div>
  );
}
