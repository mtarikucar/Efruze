/** Shared constants — imported by both server actions and auth events. */
export const CART_COOKIE = "efruze_cart_token";

/**
 * Short-lived cookie set right after a successful checkout. The /orders/[n]/thanks
 * page reads this to authorise the just-placed order to the same browser — the
 * order number alone is not enough (PII would leak via referer/screenshot).
 * Value = the orderNumber.
 */
export const LAST_ORDER_COOKIE = "efruze_last_order";
