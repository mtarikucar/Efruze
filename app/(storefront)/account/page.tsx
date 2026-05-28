import type { Metadata } from "next";
import { auth } from "@/auth";
import { getLocale, getTranslations } from "next-intl/server";
import { OrderService } from "@/server/services/order.service";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { orderStatusLabel } from "@/lib/order-status";
import type { AppLocale } from "@/i18n/routing";
import type { OrderDTO } from "@/server/types/order";

export const metadata: Metadata = { title: "Account · efruze" };

export default async function AccountOverviewPage() {
  const session = await auth();
  if (!session?.user) return null; // layout already redirects
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("account");

  let recent: OrderDTO[] = [];
  try {
    recent = await OrderService.listForUser({
      userId: session.user.id,
      email: session.user.email,
      locale,
    });
  } catch {
    recent = [];
  }
  const top3 = recent.slice(0, 3);

  return (
    <div className="flex flex-col gap-12">
      <header>
        <h1
          className="serif-display m-0 font-serif font-light text-ink"
          style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.04 }}
        >
          {t("overviewTitle")}
        </h1>
        <p className="mt-3 font-serif italic text-lg text-ink-2">{t("overviewSub")}</p>
      </header>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="m-0 font-serif text-2xl font-light text-ink">{t("recentOrders")}</h2>
          {top3.length > 0 && (
            <Link href="/account/orders" className="link-underline">
              {t("viewAll")} →
            </Link>
          )}
        </div>

        {top3.length === 0 ? (
          <EmptyOrders />
        ) : (
          <ul className="flex flex-col">
            {top3.map((o) => (
              <li key={o.id} className="border-t border-line py-5 last:border-b">
                <Link
                  href={`/account/orders/${o.orderNumber}` as never}
                  className="flex flex-wrap items-baseline justify-between gap-3 transition hover:text-blue-deep"
                >
                  <span className="font-serif text-lg text-ink">#{o.orderNumber}</span>
                  <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                    {new Date(o.placedAt).toLocaleDateString("tr-TR")}
                  </span>
                  <StatusPill status={o.status} />
                  <span className="font-serif text-lg text-ink">{formatPrice(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="rounded-sm card-elev p-12 text-center">
      <p className="m-0 font-serif italic text-lg text-ink-2">
        Henüz siparişiniz yok. Atölye açık —{" "}
        <Link href="/shop" className="text-ink underline-offset-4 hover:underline">
          koleksiyona göz atın
        </Link>
        .
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "PAID" || status === "PROCESSING" || status === "SHIPPED" || status === "DELIVERED"
      ? "text-blue-deep border-blue-deep/40 bg-blue-deep/5"
      : status === "AWAITING_PAYMENT" || status === "PENDING"
        ? "text-gold border-gold/40 bg-gold/5"
        : "text-ink-mute border-line bg-bg-deep/40";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-caps text-[9px] uppercase tracking-[0.22em] ${tone}`}
    >
      {orderStatusLabel(status)}
    </span>
  );
}
