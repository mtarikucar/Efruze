/**
 * Turkish labels for raw order-status enum values.
 *
 * The storefront previously rendered raw enums (e.g. "AWAITING_PAYMENT") by
 * lower-casing and replacing underscores, which leaked English at the customer.
 * Use {@link orderStatusLabel} everywhere a status is shown to a customer.
 *
 * Note: admin/** keeps its own StatusPill in primitives.tsx — do not couple it
 * to this map.
 */
export const ORDER_STATUS_LABELS_TR: Record<string, string> = {
  PENDING: "Beklemede",
  AWAITING_PAYMENT: "Ödeme bekleniyor",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
  REFUNDED: "İade edildi",
};

/**
 * Map a raw order status to its Turkish customer-facing label. Unknown values
 * fall back to a humanised form of the raw enum so nothing renders blank.
 */
export function orderStatusLabel(status: string): string {
  return (
    ORDER_STATUS_LABELS_TR[status] ??
    status.replaceAll("_", " ").toLowerCase()
  );
}
