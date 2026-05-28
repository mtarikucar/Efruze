import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/primitives";
import { CouponForm } from "@/components/admin/CouponForm";

export const metadata: Metadata = { title: "Yeni kupon · yönetim" };

export default function NewCouponPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Pazarlama" title="Yeni kupon" />
      <CouponForm initial={null} />
    </div>
  );
}
