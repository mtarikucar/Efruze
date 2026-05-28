import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CartService } from "@/server/services/cart.service";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import { OrderSummary } from "@/components/storefront/OrderSummary";
import { CART_COOKIE } from "../layout";
import { isPayTREnabled } from "@/server/payments/registry";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("title") };
}

export default async function CheckoutPage() {
  const locale = (await getLocale()) as AppLocale;
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE)?.value ?? null;

  let cart;
  try {
    cart = await CartService.getDTO(token, locale);
  } catch {
    cart = CartService.emptyDTO();
  }

  // No empty checkouts.
  if (cart.items.length === 0) {
    redirect("/shop");
  }

  const t = await getTranslations("checkout");

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      <header className="mb-12 flex flex-col gap-3">
        <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
          <span className="mr-1.5 text-gold">—</span> {t("eyebrow")}
        </div>
        <h1
          className="serif-display m-0 font-serif font-light text-ink"
          style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.02 }}
        >
          {t("title")}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
        <CheckoutForm cart={cart} hasPayTR={isPayTREnabled()} />
        <OrderSummary cart={cart} />
      </div>
    </section>
  );
}
