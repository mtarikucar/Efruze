"use client";

import { useState, useTransition } from "react";
import { AdminButton, AdminLinkButton } from "./primitives";
import { adminSendPasswordResetAction } from "@/app/admin/customers/actions";

export function CustomerActions({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function sendReset() {
    setMsg(null);
    if (!window.confirm("Bu müşteriye şifre sıfırlama bağlantısı gönderilsin mi?")) {
      return;
    }
    start(async () => {
      const r = await adminSendPasswordResetAction({ userId });
      if (r.ok) {
        setMsg({
          ok: true,
          text: r.simulated
            ? "Bağlantı oluşturuldu (e-posta servisi kapalı — RESEND_API_KEY ayarlayın)."
            : "Şifre sıfırlama bağlantısı gönderildi.",
        });
      } else {
        setMsg({ ok: false, text: r.error });
      }
    });
  }

  return (
    <div className="rounded-sm card-elev p-6">
      <h2 className="m-0 mb-4 font-serif text-xl font-light text-ink">İşlemler</h2>
      <div className="flex flex-col gap-3">
        <AdminLinkButton href={`mailto:${email}`} variant="ghost" size="md">
          E-posta gönder
        </AdminLinkButton>
        <AdminButton
          type="button"
          variant="ghost"
          size="md"
          disabled={pending}
          onClick={sendReset}
        >
          {pending ? "Gönderiliyor…" : "Şifre sıfırlama bağlantısı gönder"}
        </AdminButton>
      </div>
      {msg && (
        <p
          className={`mt-3 m-0 font-serif text-sm ${
            msg.ok ? "text-emerald-800" : "text-red-800"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
