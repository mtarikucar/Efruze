"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminButton, FormField, adminInputCls, adminTextareaCls } from "./primitives";
import {
  confirmBankTransferAction,
  transitionOrderStatusAction,
  refundOrderAction,
  setAdminNoteAction,
  markOrderPaidAction,
} from "@/app/admin/orders/actions";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

type Props = {
  orderId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  adminNote: string | null;
};

export function OrderActionPanel({
  orderId,
  status,
  paymentMethod,
  paymentStatus,
  trackingCarrier,
  trackingNumber,
  adminNote,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [carrier, setCarrier] = useState(trackingCarrier ?? "");
  const [number, setNumber] = useState(trackingNumber ?? "");
  const [note, setNote] = useState(adminNote ?? "");
  const [error, setError] = useState<string | null>(null);

  function go(action: () => Promise<{ ok: boolean; error?: string } | void>) {
    setError(null);
    startTransition(async () => {
      const r = await action();
      if (r && "ok" in r && !r.ok) setError(r.error ?? "İşlem başarısız oldu");
      else router.refresh();
    });
  }

  const canConfirmBank =
    paymentMethod === "BANK_TRANSFER" && paymentStatus !== "SUCCEEDED";
  // Escape hatch for a non-bank order stuck in PENDING (e.g. an online payment
  // whose provider callback never landed). Bank transfers use "Havaleyi onayla".
  const canMarkPaid = status === "PENDING" && paymentMethod !== "BANK_TRANSFER";
  const canProcess = status === "PAID";
  const canShip = status === "PAID" || status === "PROCESSING";
  const canDeliver = status === "SHIPPED";
  const canCancel = !["DELIVERED", "CANCELLED", "REFUNDED"].includes(status);
  const canRefund = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(status);
  const isRefunded = status === "REFUNDED";

  return (
    <section className="rounded-sm card-elev p-6">
      <h2 className="m-0 mb-5 font-serif text-xl font-light text-ink">İşlemler</h2>

      <div className="flex flex-wrap gap-3">
        {canConfirmBank && (
          <AdminButton
            type="button"
            disabled={pending}
            onClick={() => go(() => confirmBankTransferAction({ orderId }))}
          >
            Havaleyi onayla → Ödendi
          </AdminButton>
        )}

        {canMarkPaid && (
          <AdminButton
            type="button"
            disabled={pending}
            onClick={() => go(() => markOrderPaidAction({ orderId }))}
          >
            Ödendi olarak işaretle
          </AdminButton>
        )}

        {canProcess && (
          <AdminButton
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => go(() => transitionOrderStatusAction({ orderId, next: "PROCESSING" }))}
          >
            Hazırlanıyor olarak işaretle
          </AdminButton>
        )}

        {canDeliver && (
          <AdminButton
            type="button"
            disabled={pending}
            onClick={() => go(() => transitionOrderStatusAction({ orderId, next: "DELIVERED" }))}
          >
            Teslim edildi olarak işaretle
          </AdminButton>
        )}

        {canCancel && (
          <AdminButton
            type="button"
            variant="danger"
            disabled={pending}
            onClick={() =>
              confirm(
                "Bu sipariş iptal edilsin mi? Stok geri eklenir ve müşteriye iptal e-postası gönderilir.",
              ) && go(() => transitionOrderStatusAction({ orderId, next: "CANCELLED" }))
            }
          >
            Siparişi iptal et
          </AdminButton>
        )}

        {canRefund && (
          <AdminButton
            type="button"
            variant="danger"
            disabled={pending}
            onClick={() =>
              confirm(
                "Bu sipariş iade edilsin mi? Stok geri eklenir ve sipariş 'İade edildi' olarak işaretlenir. Gerçek para iadesini ödeme sağlayıcısı panelinden ayrıca yapın.",
              ) && go(() => refundOrderAction({ orderId }))
            }
          >
            İade et
          </AdminButton>
        )}
      </div>

      {isRefunded && (
        <div className="mt-4 rounded-sm border border-red-700/30 bg-red-700/5 p-3 font-serif text-base text-red-900">
          Bu sipariş iade edildi. Gerçek para iadesi ödeme sağlayıcısı / banka
          paneli üzerinden manuel olarak yapılır; bu kayıt muhasebe içindir.
        </div>
      )}

      {canShip && (
        <div className="mt-6 border-t border-line pt-6">
          <h3 className="m-0 mb-4 font-serif text-lg font-light text-ink">Siparişi kargola</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <FormField label="Kargo firması">
              <input
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className={adminInputCls}
                placeholder="Yurtiçi · Aras · DHL"
              />
            </FormField>
            <FormField label="Takip numarası">
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className={adminInputCls}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <AdminButton
              type="button"
              disabled={pending}
              onClick={() =>
                go(() =>
                  transitionOrderStatusAction({
                    orderId,
                    next: "SHIPPED",
                    trackingCarrier: carrier,
                    trackingNumber: number,
                  }),
                )
              }
            >
              Kargoda olarak işaretle ve müşteriye e-posta gönder
            </AdminButton>
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-line pt-6">
        <FormField label="Yönetici notu (özel)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className={adminTextareaCls}
          />
        </FormField>
        <div className="mt-3">
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => go(() => setAdminNoteAction({ orderId, note }))}
          >
            Notu kaydet
          </AdminButton>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-sm border border-red-700/30 bg-red-700/5 p-3 font-serif text-base text-red-900">
          {error}
        </div>
      )}
    </section>
  );
}
