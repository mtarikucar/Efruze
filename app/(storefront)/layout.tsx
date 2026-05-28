import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { ParallaxBg } from "@/components/storefront/ParallaxBg";
import { NavShell } from "@/components/storefront/NavShell";
import { Footer } from "@/components/storefront/Footer";
import { CartService } from "@/server/services/cart.service";
import { auth } from "@/auth";
import type { AppLocale } from "@/i18n/routing";
import { CART_COOKIE } from "@/lib/constants";

// Re-export for backwards compatibility with action files that import from this layout.
export { CART_COOKIE };

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = (await getLocale()) as AppLocale;
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE)?.value ?? null;

  let cart;
  try {
    cart = await CartService.getDTO(token, locale);
  } catch {
    cart = CartService.emptyDTO();
  }

  let session;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  const user = session?.user
    ? { name: session.user.name ?? session.user.email, email: session.user.email }
    : null;

  return (
    <>
      <ParallaxBg />
      <NavShell cart={cart} user={user} />
      <main id="main" role="main" className="relative z-[2] pt-[80px]">
        {children}
      </main>
      <Footer />
    </>
  );
}
