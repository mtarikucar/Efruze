"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  updateProfileAction,
  changePasswordAction,
} from "@/app/(storefront)/account/actions";
import { deleteAccountAction } from "@/app/(auth)/actions";

const inputCls =
  "w-full rounded-sm border border-line bg-paper px-3.5 py-3 font-serif text-base text-ink outline-none placeholder:italic placeholder:text-ink-mute transition focus:border-ink focus:ring-2 focus:ring-ink/15";

function profileError(err: string, t: (k: string) => string): string {
  if (err === "EMAIL_TAKEN") return t("errors.emailTaken");
  if (err === "UNAUTHORIZED") return t("errors.unauthorized");
  return err;
}

function passwordError(err: string, t: (k: string) => string): string {
  if (err === "WRONG_PASSWORD") return t("errors.wrongPassword");
  if (err === "NO_PASSWORD") return t("errors.noPassword");
  if (err === "UNAUTHORIZED") return t("errors.unauthorized");
  return err;
}

export function ProfilePanel({
  name: initialName,
  email: initialEmail,
  hasPassword,
}: {
  name: string;
  email: string;
  hasPassword: boolean;
}) {
  const t = useTranslations("account");
  const router = useRouter();

  // Profile section
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [profilePending, startProfile] = useTransition();
  const [profileError_, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password section
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwPending, startPassword] = useTransition();
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);

  // Delete section
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deletePending, startDelete] = useTransition();

  return (
    <div className="flex flex-col gap-12">
      {/* — Profile details — */}
      <section className="rounded-sm card-elev p-6 sm:p-8">
        <h2 className="m-0 font-serif text-2xl font-light text-ink">{t("profileDetails")}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setProfileError(null);
            setProfileSaved(false);
            startProfile(async () => {
              const result = await updateProfileAction({ name, email });
              if (result.ok) {
                setProfileSaved(true);
                router.refresh();
              } else {
                setProfileError(result.error);
              }
            });
          }}
          className="mt-6 flex flex-col gap-5"
        >
          <label className="flex flex-col gap-2">
            <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
              {t("fullName")}
            </span>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
              {t("email")}
            </span>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {profileError_ && (
            <p className="rounded-sm border border-red-700/20 bg-red-700/5 p-3 font-serif text-base italic text-red-900">
              {profileError(profileError_, t)}
            </p>
          )}
          {profileSaved && !profileError_ && (
            <p className="rounded-sm border border-blue-deep/30 bg-blue-deep/5 p-3 font-serif text-base italic text-blue-deep">
              {t("profileSaved")}
            </p>
          )}

          <button
            type="submit"
            disabled={profilePending}
            className="inline-flex items-center justify-center self-start rounded-full bg-ink px-6 py-3 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2 disabled:opacity-60"
          >
            {profilePending ? "…" : t("save")}
          </button>
        </form>
      </section>

      {/* — Change password — */}
      <section className="rounded-sm card-elev p-6 sm:p-8">
        <h2 className="m-0 font-serif text-2xl font-light text-ink">{t("changePassword")}</h2>
        {hasPassword ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPwError(null);
              setPwSaved(false);
              if (newPassword !== confirmPassword) {
                setPwError("PASSWORD_MISMATCH");
                return;
              }
              startPassword(async () => {
                const result = await changePasswordAction({ currentPassword, newPassword });
                if (result.ok) {
                  setPwSaved(true);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                } else {
                  setPwError(result.error);
                }
              });
            }}
            className="mt-6 flex flex-col gap-5"
          >
            <label className="flex flex-col gap-2">
              <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                {t("currentPassword")}
              </span>
              <input
                type="password"
                autoComplete="current-password"
                className={inputCls}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                {t("newPassword")}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                className={inputCls}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                {t("confirmPassword")}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                className={inputCls}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            {pwError && (
              <p className="rounded-sm border border-red-700/20 bg-red-700/5 p-3 font-serif text-base italic text-red-900">
                {pwError === "PASSWORD_MISMATCH"
                  ? t("errors.passwordMismatch")
                  : passwordError(pwError, t)}
              </p>
            )}
            {pwSaved && !pwError && (
              <p className="rounded-sm border border-blue-deep/30 bg-blue-deep/5 p-3 font-serif text-base italic text-blue-deep">
                {t("passwordSaved")}
              </p>
            )}

            <button
              type="submit"
              disabled={pwPending}
              className="inline-flex items-center justify-center self-start rounded-full bg-ink px-6 py-3 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2 disabled:opacity-60"
            >
              {pwPending ? "…" : t("updatePassword")}
            </button>
          </form>
        ) : (
          <p className="mt-6 m-0 font-serif italic text-lg text-ink-2">{t("noPasswordHint")}</p>
        )}
      </section>

      {/* — Danger zone: account deletion (KVKK) — */}
      <section className="rounded-sm border border-red-700/30 bg-red-700/5 p-6 sm:p-8">
        <h2 className="m-0 font-serif text-2xl font-light text-red-900">{t("deleteTitle")}</h2>
        <p className="mt-3 font-serif text-base leading-relaxed text-ink-2">{t("deleteSub")}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startDelete(async () => {
              await deleteAccountAction();
            });
          }}
          className="mt-6 flex flex-col gap-4"
        >
          <label className="flex flex-col gap-2">
            <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
              {t("deleteConfirmLabel")}
            </span>
            <input
              className={inputCls}
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder={t("deleteConfirmWord")}
            />
          </label>
          <button
            type="submit"
            disabled={deletePending || confirmDelete.trim().toUpperCase() !== t("deleteConfirmWord")}
            className="inline-flex items-center justify-center self-start rounded-full border border-red-700 bg-red-700 px-6 py-3 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletePending ? "…" : t("deleteButton")}
          </button>
        </form>
      </section>
    </div>
  );
}
