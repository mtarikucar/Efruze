import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link } from "@/i18n/navigation";
import { signOutAction } from "@/app/(auth)/actions";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/account");
  const t = await getTranslations("account");

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-2 border-b border-line pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-12">
          <div className="mb-6">
            <div className="font-caps text-[10px] uppercase tracking-[0.32em] text-gold">
              {t("welcomeEyebrow")}
            </div>
            <div className="mt-2 font-serif text-2xl italic text-ink">
              {session.user.name ?? session.user.email}
            </div>
            <div className="mt-1 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
              {session.user.email}
            </div>
          </div>

          <NavLink href="/account">{t("overview")}</NavLink>
          <NavLink href="/account/orders">{t("orders")}</NavLink>
          <NavLink href="/account/addresses">{t("addresses")}</NavLink>
          <NavLink href="/account/profile">{t("profile")}</NavLink>

          <form action={signOutAction} className="mt-6">
            <button
              type="submit"
              className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute transition hover:text-ink"
            >
              {t("signOut")}
            </button>
          </form>
        </aside>

        <div>{children}</div>
      </div>
    </section>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href as never}
      className="font-serif text-lg text-ink-2 transition hover:text-ink"
    >
      {children}
    </Link>
  );
}
