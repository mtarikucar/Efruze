import { z } from "zod";
import { PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";

/* --- Address ----------------------------------------------------------- */

export const addressSchema = z.object({
  fullName: z.string().min(2, "Required").max(120),
  line1: z.string().min(2, "Required").max(200),
  line2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(2, "Required").max(80),
  district: z.string().max(80).optional().or(z.literal("")),
  postalCode: z.string().min(3, "Required").max(20),
  country: z.string().min(2).max(2).default("TR"),
  phone: z.string().min(6).max(40).optional().or(z.literal("")),
});
export type AddressInput = z.infer<typeof addressSchema>;

/* --- Checkout submission ----------------------------------------------- */

export const checkoutInput = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  shipping: addressSchema,
  // billing: same-as-shipping flag handled in UI; server receives the chosen address.
  billing: addressSchema,
  paymentMethod: z.enum(["BANK_TRANSFER", "PAYTR"]),
  customerNote: z.string().max(1000).optional().or(z.literal("")),
  couponCode: z.string().max(40).optional().or(z.literal("")),
});
export type CheckoutInput = z.infer<typeof checkoutInput>;

/* --- DTOs surfaced to UI ---------------------------------------------- */

export type OrderLineDTO = {
  id: string;
  nameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPrice: string; // Decimal stringified
  lineTotal: string;
};

export type BankTransferInstructionsDTO = {
  reference: string;
  amount: string;
  currency: string;
  deadlineHours: number;
  accounts: Array<{
    bankName: string;
    accountHolder: string;
    iban: string;
    swift: string | null;
  }>;
};

export type OrderDTO = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  email: string;
  subtotal: string;
  shippingCost: string;
  discountTotal: string;
  total: string;
  currency: string;
  items: OrderLineDTO[];
  shipping: AddressInput | null;
  billing: AddressInput | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  customerNote: string | null;
  bankInstructions: BankTransferInstructionsDTO | null;
  placedAt: string;
};
