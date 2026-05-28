import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLocale, getTranslations } from "next-intl/server";
import { OrderService } from "@/server/services/order.service";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel } from "@/lib/order-status";
import type { AppLocale } from "@/i18n/routing";
import type { OrderDTO } from "@/server/types/order";

export const metadata: Metadata = { title: "Orders · efruze" };

export default async function AccountOrdersPage() {
  const session = await auth();
  // Render-null on missing session shows a blank page; redirect so the user
  // lands on sign-in (and comes back here after).
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/account/orders");
  }
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("account");

  let orders: OrderDTO[] = [];
  try {
    orders = await OrderService.listForUser({
      userId: session.user.id,
      // Guard against missing email — Prisma treats `email: undefined` as
      // "no filter", which would collapse the guest-order branch into
      // `{ userId: null }` and leak every guest order to this user.
      email: session.user.email ?? "",
      locale,
    });
  } catch {
    orders = [];
  }

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1
          className="serif-display m-0 font-serif font-light text-ink"
          style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.04 }}
        >
          {t("ordersTitle")}
        </h1>
        <p className="mt-3 font-serif italic text-lg text-ink-2">{t("ordersSub")}</p>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-sm card-elev p-12 text-center">
          <p className="m-0 font-serif italic text-lg text-ink-2">{t("ordersEmpty")}</p>
        </div>
      ) : (
        <ul className="flex flex-col border-t border-line">
          {orders.map((o) => (
            <li key={o.id} className="border-b border-line py-6">
              <Link
                href={`/account/orders/${o.orderNumber}` as never}
                className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-baseline sm:gap-6"
              >
                <span className="font-serif text-lg text-ink">#{o.orderNumber}</span>
                <span className="font-serif text-base text-ink-2">
                  {o.items.length} parça ·{" "}
                  {new Date(o.placedAt).toLocaleDateString("tr-TR")}
                </span>
                <span className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  {orderStatusLabel(o.status)}
                </span>
                <span className="font-serif text-lg font-medium text-ink">
                  {formatPrice(o.total)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
