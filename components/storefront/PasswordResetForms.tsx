"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/app/(auth)/actions";

const inputCls =
  "w-full border-0 border-b border-line bg-transparent px-1 py-3 font-serif text-base text-ink outline-none placeholder:italic placeholder:text-ink-mute focus:border-ink";

function errorLabel(err: string, t: (k: string) => string): string {
  if (err === "TOO_MANY_ATTEMPTS") return t("errors.tooManyAttempts");
  if (err === "INVALID_TOKEN") return t("errors.invalidToken");
  return err;
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <p className="m-0 font-serif text-lg leading-relaxed text-ink">{t("forgotSent")}</p>
        <Link
          href="/sign-in"
          className="font-caps text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
        >
          {t("backToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await requestPasswordResetAction({ email });
          if (result.ok) setSent(true);
          else setError(result.error);
        });
      }}
      className="flex flex-col gap-5"
    >
      <label className="flex flex-col gap-2">
        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {t("email")}
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </label>

      {error && (
        <p className="rounded-sm border border-red-700/20 bg-red-700/5 p-3 font-serif text-base italic text-red-900">
          {errorLabel(error, t)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2 disabled:opacity-60"
      >
        {pending ? "…" : t("sendResetLink")}
      </button>

      <p className="text-center font-caps text-[11px] uppercase tracking-[0.22em] text-ink-mute">
        <Link href="/sign-in" className="text-ink underline-offset-4 hover:underline">
          {t("backToSignIn")}
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <p className="m-0 font-serif text-lg italic text-red-900">{t("errors.invalidToken")}</p>
        <Link
          href="/forgot-password"
          className="font-caps text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
        >
          {t("requestNewLink")}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (password !== confirm) {
          setError("PASSWORD_MISMATCH");
          return;
        }
        startTransition(async () => {
          const result = await resetPasswordAction({ token, password });
          if (result.ok) {
            router.push("/sign-in?reset=1");
          } else {
            setError(result.error);
          }
        });
      }}
      className="flex flex-col gap-5"
    >
      <label className="flex flex-col gap-2">
        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {t("newPassword")}
        </span>
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {t("confirmPassword")}
        </span>
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputCls}
        />
      </label>

      {error && (
        <p className="rounded-sm border border-red-700/20 bg-red-700/5 p-3 font-serif text-base italic text-red-900">
          {error === "PASSWORD_MISMATCH" ? t("errors.passwordMismatch") : errorLabel(error, t)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2 disabled:opacity-60"
      >
        {pending ? "…" : t("updatePassword")}
      </button>

      {error === "INVALID_TOKEN" && (
        <p className="text-center font-caps text-[11px] uppercase tracking-[0.22em] text-ink-mute">
          <Link href="/forgot-password" className="text-ink underline-offset-4 hover:underline">
            {t("requestNewLink")}
          </Link>
        </p>
      )}
    </form>
  );
}
