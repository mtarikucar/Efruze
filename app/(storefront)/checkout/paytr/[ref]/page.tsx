import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/server/db/client";
import { PayTRIframe } from "@/components/storefront/PayTRIframe";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { LAST_ORDER_COOKIE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Ödeme · efruze",
  robots: { index: false, follow: false },
};

type Params = Promise<{ ref: string }>;

type StoredRedirect = {
  redirect?: { type: "url" | "iframe-token"; value: string };
  issuedAt?: string;
};

export default async function PayTRCheckoutPage({ params }: { params: Params }) {
  const { ref } = await params;

  let payment;
  try {
    payment = await prisma.payment.findFirst({
      where: { reference: ref },
      include: { order: { include: { items: true } } },
    });
  } catch {
    payment = null;
  }
  if (!payment || !payment.order) notFound();

  // Authorize: this page exposes the order's items, totals and a live PayTR
  // iframe token. Same two-path rule as /orders/[n]/thanks — either the
  // browser just placed this order (LAST_ORDER_COOKIE) or it's the signed-in
  // user whose email matches. Anyone with just the payment.reference is
  // rejected.
  const [cookieStore, session] = await Promise.all([cookies(), auth().catch(() => null)]);
  const cookieMatch = cookieStore.get(LAST_ORDER_COOKIE)?.value === payment.order.orderNumber;
  const sessionMatch =
    !!session?.user?.email && session.user.email === payment.order.email;
  if (!cookieMatch && !sessionMatch) notFound();

  // Already paid — short-circuit to thanks
  if (payment.status === "SUCCEEDED") {
    redirect(`/orders/${payment.order.orderNumber}/thanks?paytr=ok`);
  }
  // Hard-failed — back to checkout
  if (payment.status === "FAILED") {
    redirect(`/checkout?paymentFailed=1`);
  }

  const payload = payment.providerPayload as StoredRedirect | null;
  const token = payload?.redirect?.value;

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      <header className="mb-12 flex flex-col gap-3 text-center">
        <div className="font-caps text-[11px] uppercase tracking-[0.32em] text-gold">
          Ödeme
        </div>
        <h1
          className="serif-display m-0 font-serif font-light text-ink"
          style={{ fontSize: "clamp(28px, 4.4vw, 44px)", lineHeight: 1.04 }}
        >
          PayTR ile ödemenizi güvenle tamamlayın
        </h1>
        <p className="m-0 font-serif italic text-base text-ink-2">
          Sipariş #{payment.order.orderNumber} · {formatPrice(Number(payment.order.total))}
        </p>
      </header>

      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          {token ? (
            <PayTRIframe reference={ref} token={token} />
          ) : (
            <div className="rounded-sm card-elev p-12 text-center">
              <p className="m-0 mb-4 font-serif italic text-lg text-ink-2">
                Ödeme oturumunun süresi doldu veya başlatılamadı.
              </p>
              <Link href="/checkout" className="link-underline">
                Ödemeye geri dön
              </Link>
            </div>
          )}

          <p className="m-0 text-center font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
            Bu pencereyi kapatmak ödemeyi iptal eder.{" "}
            <Link href="/checkout" className="text-ink underline-offset-4 hover:underline">
              Ödemeye geri dön
            </Link>
          </p>
        </div>

        <aside className="rounded-sm card-elev p-8 self-start">
          <div className="mb-5 font-caps text-[11px] uppercase tracking-[0.32em] text-ink-2">
            <span className="mr-1.5 text-gold">—</span> Sipariş özeti
          </div>
          <ul className="flex flex-col gap-3 border-b border-line pb-4">
            {payment.order.items.map((it) => (
              <li key={it.id} className="flex items-baseline justify-between gap-3">
                <span className="flex-1 font-serif text-base text-ink">
                  {it.nameSnapshot}{" "}
                  <span className="text-ink-mute">× {it.quantity}</span>
                </span>
                <span className="font-serif text-base text-ink">
                  {formatPrice(Number(it.lineTotal))}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-caps text-[11px] uppercase tracking-[0.22em] text-ink">
              Toplam
            </span>
            <span className="font-serif text-2xl font-medium text-ink">
              {formatPrice(Number(payment.order.total))}
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}
