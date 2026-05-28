import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";
import type { CartDTO } from "@/server/types/cart";

export function OrderSummary({ cart, shipping, total }: { cart: CartDTO; shipping?: string; total?: string }) {
  const t = useTranslations("cart");
  const shippingValue = shipping ?? cart.shippingCost;
  const totalValue = total ?? cart.total;

  return (
    <aside className="card-elev sticky top-28 rounded-sm p-8">
      <div className="mb-6 font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
        <span className="mr-1.5 text-gold">—</span> {t("title")}
      </div>

      <ul className="flex flex-col gap-4 border-b border-line pb-6">
        {cart.items.map((it) => (
          <li key={it.id} className="flex gap-3">
            <div className="relative h-16 w-14 flex-none overflow-hidden rounded-sm bg-bg-deep">
              <Image src={it.imageUrl} alt={it.name} fill sizes="56px" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <div className="font-serif text-[15px] leading-tight text-ink">{it.name}</div>
              <div className="mt-1 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                {t("qtyShort")} {it.quantity}
              </div>
            </div>
            <div className="self-center font-serif text-base text-ink">{formatPrice(it.lineTotal)}</div>
          </li>
        ))}
      </ul>

      <dl className="mt-6 flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <dt className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">{t("subtotal")}</dt>
          <dd className="font-serif text-base text-ink">{formatPrice(cart.subtotal)}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">{t("shipping")}</dt>
          <dd className="font-serif text-base text-ink">
            {Number(shippingValue) === 0 ? t("shippingFree") : formatPrice(shippingValue)}
          </dd>
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-caps text-[11px] uppercase tracking-[0.22em] text-ink">{t("total")}</dt>
          <dd className="font-serif text-2xl font-medium text-ink">{formatPrice(totalValue)}</dd>
        </div>
      </dl>
    </aside>
  );
}
