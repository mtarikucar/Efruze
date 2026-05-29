import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignInForm } from "@/components/storefront/AuthForms";

export const metadata: Metadata = { title: "Giriş yap" };

type SearchParams = Promise<{ callbackUrl?: string; reset?: string }>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const { callbackUrl, reset } = await searchParams;
  const t = await getTranslations("auth");
  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <section
      className="relative z-[2] mx-auto flex max-w-md flex-col items-center px-6 pb-32"
      style={{ paddingTop: "clamp(80px, 10vw, 140px)" }}
    >
      <header className="mb-10 flex flex-col items-center gap-3 text-center">
        <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-gold">
          {t("signInEyebrow")}
        </div>
        <h1
          className="serif-display m-0 font-serif font-light text-ink"
          style={{ fontSize: "clamp(32px, 4.4vw, 52px)", lineHeight: 1.04 }}
        >
          {t("signInTitleA")}{" "}
          <em className="italic text-blue-deep">{t("signInTitleEm")}</em>
        </h1>
      </header>

      {reset && (
        <p className="mb-6 w-full rounded-sm border border-blue-deep/30 bg-blue-deep/5 p-4 text-center font-serif text-base italic text-blue-deep">
          {t("resetSuccess")}
        </p>
      )}

      <div className="w-full rounded-sm card-elev p-8 sm:p-10">
        <SignInForm callbackUrl={callbackUrl} hasGoogle={hasGoogle} />
      </div>
    </section>
  );
}
