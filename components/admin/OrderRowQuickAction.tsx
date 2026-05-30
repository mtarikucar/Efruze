"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  confirmBankTransferAction,
  markOrderPaidAction,
  transitionOrderStatusAction,
} from "@/app/admin/orders/actions";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

/**
 * One contextual quick action per order row — the obvious next step that needs
 * no extra input. Shipping (needs tracking) and cancel/refund stay on the order
 * detail page.
 */
export function OrderRowQuickAction({
  orderId,
  status,
  paymentMethod,
  paymentStatus,
}: {
  orderId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState(false);

  const action = (() => {
    if (
      status === "AWAITING_PAYMENT" &&
      paymentMethod === "BANK_TRANSFER" &&
      paymentStatus !== "SUCCEEDED"
    ) {
      return { label: "Havaleyi onayla", run: () => confirmBankTransferAction({ orderId }) };
    }
    if (status === "PENDING" && paymentMethod !== "BANK_TRANSFER") {
      return { label: "Ödendi", run: () => markOrderPaidAction({ orderId }) };
    }
    if (status === "PAID") {
      return {
        label: "Hazırla →",
        run: () => transitionOrderStatusAction({ orderId, next: "PROCESSING" }),
      };
    }
    if (status === "SHIPPED") {
      return {
        label: "Teslim →",
        run: () => transitionOrderStatusAction({ orderId, next: "DELIVERED" }),
      };
    }
    return null;
  })();

  if (!action) return <span className="text-ink-mute">—</span>;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setErr(false);
        start(async () => {
          const r = await action.run();
          if (r && "ok" in r && !r.ok) setErr(true);
          else router.refresh();
        });
      }}
      className="inline-flex items-center whitespace-nowrap rounded-full border border-ink bg-transparent px-3 py-1.5 font-caps text-[9px] uppercase tracking-[0.18em] text-ink transition hover:bg-ink hover:text-bg disabled:opacity-50"
    >
      {pending ? "…" : err ? "Hata" : action.label}
    </button>
  );
}
