import type { Metadata } from "next";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/server/db/client";
import { ProfilePanel } from "@/components/storefront/ProfilePanel";

export const metadata: Metadata = { title: "Profil · efruze" };

export default async function AccountProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null; // layout already redirects
  const t = await getTranslations("account");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, passwordHash: true },
  });

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1
          className="serif-display m-0 font-serif font-light text-ink"
          style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.04 }}
        >
          {t("profileTitle")}
        </h1>
        <p className="mt-3 font-serif italic text-lg text-ink-2">{t("profileSub")}</p>
      </header>

      <ProfilePanel
        name={user?.name ?? ""}
        email={user?.email ?? ""}
        hasPassword={Boolean(user?.passwordHash)}
      />
    </div>
  );
}
