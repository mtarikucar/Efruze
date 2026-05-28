import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignUpForm } from "@/components/storefront/AuthForms";

export const metadata: Metadata = { title: "Sign up · efruze" };

export default async function SignUpPage() {
  const t = await getTranslations("auth");
  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <section
      className="relative z-[2] mx-auto flex max-w-md flex-col items-center px-6 pb-32"
      style={{ paddingTop: "clamp(80px, 10vw, 140px)" }}
    >
      <header className="mb-10 flex flex-col items-center gap-3 text-center">
        <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-gold">
          {t("signUpEyebrow")}
        </div>
        <h1
          className="serif-display m-0 font-serif font-light text-ink"
          style={{ fontSize: "clamp(32px, 4.4vw, 52px)", lineHeight: 1.04 }}
        >
          {t("signUpTitleA")}{" "}
          <em className="italic text-blue-deep">{t("signUpTitleEm")}</em>
        </h1>
      </header>

      <div className="w-full rounded-sm card-elev p-8 sm:p-10">
        <SignUpForm hasGoogle={hasGoogle} />
      </div>
    </section>
  );
}
