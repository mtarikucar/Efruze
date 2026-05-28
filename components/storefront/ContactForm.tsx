"use client";

import { useState, useTransition } from "react";
import { contactInquiryAction } from "@/app/(storefront)/checkout/actions";
import type { AppLocale } from "@/i18n/routing";

const labels = {
  name: "Adınız",
  email: "E-posta",
  message: "Mesajınız",
  submit: "Gönder",
  sending: "Gönderiliyor…",
  thanks: "Teşekkürler — kısa süre içinde yanıt yazacağız.",
  placeholder: "Atölyeye yazın…",
} as const;

export function ContactForm({ locale: _locale }: { locale: AppLocale }) {
  const l = labels;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-sm card-elev p-12 text-center font-serif italic text-lg text-ink">
        {l.thanks}
      </div>
    );
  }

  const cls =
    "w-full rounded-sm border border-line bg-paper px-3.5 py-3 font-serif text-base text-ink outline-none placeholder:italic placeholder:text-ink-mute transition focus:border-ink focus:ring-2 focus:ring-ink/15";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r = await contactInquiryAction({ name, email, message });
          if (r.ok) setDone(true);
        });
      }}
      className="rounded-sm card-elev p-8 sm:p-12"
    >
      <label className="flex flex-col gap-2">
        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">{l.name}</span>
        <input className={cls} value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="mt-5 flex flex-col gap-2">
        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">{l.email}</span>
        <input type="email" className={cls} value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className="mt-5 flex flex-col gap-2">
        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">{l.message}</span>
        <textarea
          className={`${cls} h-auto py-3`}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          placeholder={l.placeholder}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-8 inline-flex items-center justify-center rounded-full border border-ink bg-ink px-6 py-3 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2 disabled:opacity-60"
      >
        {pending ? l.sending : l.submit}
      </button>
    </form>
  );
}
