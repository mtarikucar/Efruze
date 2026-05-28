import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/storefront/PasswordResetForms";

export const metadata: Metadata = { title: "Şifremi unuttum · efruze" };

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <section
      className="relative z-[2] mx-auto flex max-w-md flex-col items-center px-6 pb-32"
      style={{ paddingTop: "clamp(80px, 10vw, 140px)" }}
    >
      <header className="mb-10 flex flex-col items-center gap-3 text-center">
        <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-gold">
          {t("forgotEyebrow")}
        </div>
        <h1
          className="serif-display m-0 font-serif font-light text-ink"
          style={{ fontSize: "clamp(32px, 4.4vw, 52px)", lineHeight: 1.04 }}
        >
          {t("forgotTitleA")} <em className="italic text-blue-deep">{t("forgotTitleEm")}</em>
        </h1>
        <p className="mt-1 font-serif italic text-lg text-ink-2">{t("forgotSub")}</p>
      </header>

      <div className="w-full rounded-sm card-elev p-8 sm:p-10">
        <ForgotPasswordForm />
      </div>
    </section>
  );
}
