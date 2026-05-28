import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db/client";
import { PageHeader, AdminButton } from "@/components/admin/primitives";
import { CouponForm, type CouponFormInitial } from "@/components/admin/CouponForm";
import { deleteCouponAction } from "@/app/admin/coupons/actions";

export const metadata: Metadata = { title: "Kuponu düzenle · yönetim" };

type Params = Promise<{ id: string }>;

function toLocalInput(d: Date | null): string {
  if (!d) return "";
  // datetime-local expects "YYYY-MM-DDTHH:mm"
  const iso = d.toISOString();
  return iso.slice(0, 16);
}

export default async function EditCouponPage({ params }: { params: Params }) {
  const { id } = await params;
  let initial: CouponFormInitial | null = null;
  try {
    const c = await prisma.coupon.findUnique({ where: { id } });
    if (!c) notFound();
    initial = {
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value.toString(),
      minSubtotal: c.minSubtotal ? c.minSubtotal.toString() : "",
      startsAt: toLocalInput(c.startsAt),
      endsAt: toLocalInput(c.endsAt),
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
      isActive: c.isActive,
    };
  } catch {
    notFound();
  }
  if (!initial) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Pazarlama"
        title="Kuponu düzenle"
        sub={initial.code}
        actions={
          <form action={async () => {
            "use server";
            await deleteCouponAction({ id: initial!.id! });
          }}>
            <AdminButton type="submit" variant="danger" size="md">
              Sil
            </AdminButton>
          </form>
        }
      />
      <CouponForm initial={initial} />
    </div>
  );
}
