"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";
import type { BankTransferInstructionsDTO } from "@/server/types/order";
import { cn } from "@/lib/cn";

export function BankInstructionsPanel({
  instructions,
}: {
  instructions: BankTransferInstructionsDTO;
}) {
  const t = useTranslations("thanks");
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    });
  }

  return (
    <section className="card-elev rounded-sm p-8">
      <div className="mb-6 font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
        <span className="mr-1.5 text-gold">—</span> {t("bankInstructionsTitle")}
      </div>

      <div className="mb-6 flex flex-col gap-2 rounded-sm border border-dashed border-gold/50 bg-bg p-5 text-center">
        <div className="font-caps text-[10px] uppercase tracking-[0.32em] text-gold">
          {t("reference")}
        </div>
        <div className="flex items-center justify-center gap-3">
          <span className="font-serif text-2xl tracking-[0.05em] text-ink">
            {instructions.reference}
          </span>
          <button
            type="button"
            aria-label="Referansı kopyala"
            onClick={() => copy(instructions.reference, "ref")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition hover:text-ink"
          >
            {copied === "ref" ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <div className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {t("amount")} · {formatPrice(instructions.amount)}
        </div>
      </div>

      <p className="mb-6 font-serif text-base leading-relaxed text-ink-2">
        {t("instructionsBody", { hours: instructions.deadlineHours })}
      </p>

      <div className="flex flex-col gap-4">
        {instructions.accounts.map((a, i) => (
          <div key={i} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
            <div className="mb-2 font-caps text-[10px] uppercase tracking-[0.28em] text-gold">
              {a.bankName}
            </div>
            <div className="font-serif text-base text-ink">{a.accountHolder}</div>
            <div className="mt-2 flex flex-wrap items-center gap-3 font-serif text-base tracking-[0.04em] text-ink">
              <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                IBAN
              </span>
              <span>{a.iban}</span>
              <button
                type="button"
                aria-label="IBAN'ı kopyala"
                onClick={() => copy(a.iban.replace(/\s/g, ""), `iban-${i}`)}
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink-2 transition hover:text-ink",
                )}
              >
                {copied === `iban-${i}` ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
            {a.swift && (
              <div className="mt-1 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                SWIFT · {a.swift}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
