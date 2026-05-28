"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

export function ProductGallery({
  images,
  alt,
}: {
  images: Array<{ id: string; url: string; alt?: string | null }>;
  alt: string;
}) {
  const safe = images.length > 0 ? images : [{ id: "fallback", url: "/ebru-detail.png", alt }];
  const [active, setActive] = useState(0);
  const current = safe[Math.min(active, safe.length - 1)];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-paper">
        <Image
          src={current.url}
          alt={current.alt ?? alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="object-cover"
        />
      </div>
      {safe.length > 1 && (
        <div className="flex gap-3 overflow-x-auto">
          {safe.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Görsel ${i + 1}`}
              className={cn(
                "relative h-20 w-20 flex-none overflow-hidden rounded-sm border bg-paper transition",
                i === active
                  ? "border-ink"
                  : "border-line opacity-70 hover:opacity-100",
              )}
            >
              <Image src={img.url} alt={img.alt ?? alt} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
