"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CartDTO } from "@/server/types/cart";
import { updateCartItemQtyAction, removeCartItemAction } from "@/app/(storefront)/actions";

export function CartDrawer({
  cart,
  open,
  onOpenChange,
}: {
  cart: CartDTO;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const t = useTranslations("cart");
  const [pending, startTransition] = useTransition();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-line px-8 pt-10 pb-6">
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription className="mt-1 text-sm">
              {cart.itemCount > 0
                ? `${cart.itemCount} ürün`
                : t("empty")}
            </SheetDescription>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {cart.items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                <p className="font-serif text-lg text-ink-2">{t("empty")}</p>
                <Link
                  href="/shop"
                  onClick={() => onOpenChange(false)}
                  className="link-underline"
                >
                  {t("emptyCta")}
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-6">
                {cart.items.map((line) => (
                  <li key={line.id} className="flex gap-4">
                    <div className="relative h-24 w-20 flex-none overflow-hidden rounded-sm bg-bg-deep">
                      <Image
                        src={line.imageUrl}
                        alt={line.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Link
                        href={`/shop/${line.slug}` as never}
                        onClick={() => onOpenChange(false)}
                        className="font-serif text-[15px] leading-tight text-ink hover:text-blue-deep"
                      >
                        {line.name}
                      </Link>
                      {line.variantLabel && (
                        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                          {line.variantLabel}
                        </span>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <QtyStepper
                          qty={line.quantity}
                          disabled={pending}
                          onDec={() =>
                            startTransition(() => {
                              void updateCartItemQtyAction({
                                itemId: line.id,
                                quantity: line.quantity - 1,
                              });
                            })
                          }
                          onInc={() =>
                            startTransition(() => {
                              void updateCartItemQtyAction({
                                itemId: line.id,
                                quantity: line.quantity + 1,
                              });
                            })
                          }
                        />
                        <span className="font-serif text-base text-ink">
                          {formatPrice(line.lineTotal)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(() => {
                            void removeCartItemAction({ itemId: line.id });
                          })
                        }
                        className="self-start font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute underline-offset-4 transition hover:text-ink hover:underline disabled:opacity-50"
                        disabled={pending}
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Totals + checkout */}
          {cart.items.length > 0 && (
            <div className="border-t border-line px-8 py-6">
              <div className="flex items-center justify-between font-caps text-[11px] uppercase tracking-[0.22em] text-ink-2">
                <span>{t("subtotal")}</span>
                <span className="font-serif text-base normal-case tracking-normal text-ink">
                  {formatPrice(cart.subtotal)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between font-caps text-[11px] uppercase tracking-[0.22em] text-ink-mute">
                <span>{t("shipping")}</span>
                <span>{t("shippingCalc")}</span>
              </div>
              <Link
                href="/checkout"
                onClick={() => onOpenChange(false)}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-ink px-7 py-4 font-caps text-[11.5px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2"
              >
                {t("checkout")}
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function QtyStepper({
  qty,
  onDec,
  onInc,
  disabled,
}: {
  qty: number;
  onDec: () => void;
  onInc: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-full border border-line px-3 py-1 font-serif text-sm text-ink",
        disabled && "opacity-60",
      )}
    >
      <button
        type="button"
        aria-label="Azalt"
        onClick={onDec}
        disabled={disabled}
        className="inline-flex h-5 w-5 items-center justify-center text-ink-mute transition hover:text-ink"
      >
        <Minus size={12} strokeWidth={1.5} />
      </button>
      <span className="min-w-[1.5ch] text-center tabular-nums">{qty}</span>
      <button
        type="button"
        aria-label="Artır"
        onClick={onInc}
        disabled={disabled}
        className="inline-flex h-5 w-5 items-center justify-center text-ink-mute transition hover:text-ink"
      >
        <Plus size={12} strokeWidth={1.5} />
      </button>
    </div>
  );
}
