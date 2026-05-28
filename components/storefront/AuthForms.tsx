"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signInAction, signUpAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/cn";

const inputCls =
  "w-full border-0 border-b border-line bg-transparent px-1 py-3 font-serif text-base text-ink outline-none placeholder:italic placeholder:text-ink-mute focus:border-ink";

function errorLabel(err: string, t: (k: string) => string): string {
  if (err === "INVALID_CREDENTIALS") return t("errors.invalidCredentials");
  if (err === "EMAIL_TAKEN") return t("errors.emailTaken");
  return err;
}

export function SignInForm({
  callbackUrl,
  hasGoogle,
}: {
  callbackUrl?: string;
  hasGoogle: boolean;
}) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await signInAction({ email, password, callbackUrl });
          if (result && "ok" in result && !result.ok) setError(result.error);
        });
      }}
      className="flex flex-col gap-5"
    >
      <Field label={t("email")}>
        <input
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label={t("password")}>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
      </Field>

      <div className="-mt-2 text-right">
        <Link
          href="/forgot-password"
          className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute underline-offset-4 hover:text-ink hover:underline"
        >
          {t("forgotPassword")}
        </Link>
      </div>

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
        {pending ? "…" : t("signIn")}
      </button>

      {hasGoogle && <GoogleButton label={t("signInGoogle")} />}

      <p className="text-center font-caps text-[11px] uppercase tracking-[0.22em] text-ink-mute">
        {t("noAccount")}{" "}
        <Link href="/sign-up" className="text-ink underline-offset-4 hover:underline">
          {t("signUpHere")}
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm({ hasGoogle }: { hasGoogle: boolean }) {
  const t = useTranslations("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await signUpAction({ name, email, password, newsletter });
          if (result && "ok" in result && !result.ok) setError(result.error);
        });
      }}
      className="flex flex-col gap-5"
    >
      <Field label={t("name")}>
        <input
          required
          autoComplete="name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label={t("email")}>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label={t("password")}>
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
      </Field>

      <label className="mt-1 flex items-start gap-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2">
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
          className="mt-0.5 accent-ink"
        />
        {t("newsletterOptIn")}
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
        {pending ? "…" : t("createAccount")}
      </button>

      {hasGoogle && <GoogleButton label={t("signUpGoogle")} />}

      <p className="text-center font-caps text-[11px] uppercase tracking-[0.22em] text-ink-mute">
        {t("haveAccount")}{" "}
        <Link href="/sign-in" className="text-ink underline-offset-4 hover:underline">
          {t("signInHere")}
        </Link>
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">{label}</span>
      {children}
    </label>
  );
}

function GoogleButton({ label }: { label: string }) {
  return (
    <form action="/api/auth/signin/google" method="post" className="m-0">
      <button
        type="submit"
        className={cn(
          "inline-flex w-full items-center justify-center gap-3 rounded-full border border-ink bg-paper px-6 py-3.5 font-caps text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-bg-deep",
        )}
      >
        <span aria-hidden="true" className="text-base">G</span>
        {label}
      </button>
    </form>
  );
}
