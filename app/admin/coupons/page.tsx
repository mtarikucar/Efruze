import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import {
  PageHeader,
  Table,
  THead,
  Th,
  TBody,
  Tr,
  Td,
  AdminLinkButton,
  EmptyState,
} from "@/components/admin/primitives";

export const metadata: Metadata = { title: "Kuponlar · yönetim" };

export default async function AdminCouponsPage() {
  let coupons: Array<{
    id: string;
    code: string;
    type: string;
    value: string;
    minSubtotal: string | null;
    startsAt: string | null;
    endsAt: string | null;
    usedCount: number;
    usageLimit: number | null;
    isActive: boolean;
  }> = [];
  try {
    const rows = await prisma.coupon.findMany({ orderBy: { code: "asc" } });
    coupons = rows.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value.toString(),
      minSubtotal: c.minSubtotal ? c.minSubtotal.toString() : null,
      startsAt: c.startsAt?.toISOString() ?? null,
      endsAt: c.endsAt?.toISOString() ?? null,
      usedCount: c.usedCount,
      usageLimit: c.usageLimit,
      isActive: c.isActive,
    }));
  } catch {
    coupons = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Pazarlama"
        title="Kuponlar"
        sub="Mağaza ödeme adımı için indirim kodları."
        actions={<AdminLinkButton href="/admin/coupons/new">+ Yeni kupon</AdminLinkButton>}
      />

      {coupons.length === 0 ? (
        <EmptyState
          title="Henüz kupon yok."
          sub="Ödeme adımında yüzde veya sabit indirim sunmak için bir kupon oluşturun."
        />
      ) : (
        <Table>
          <THead>
            <Th>Kod</Th>
            <Th>Tür</Th>
            <Th>Değer</Th>
            <Th>Min. tutar</Th>
            <Th>Geçerlilik</Th>
            <Th>Kullanım</Th>
            <Th>Durum</Th>
          </THead>
          <TBody>
            {coupons.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <a
                    href={`/admin/coupons/${c.id}`}
                    className="font-serif text-ink hover:text-blue-deep"
                  >
                    {c.code}
                  </a>
                </Td>
                <Td className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  {c.type === "PERCENT" ? "yüzde" : "sabit"}
                </Td>
                <Td>{c.type === "PERCENT" ? `${c.value}%` : `₺ ${c.value}`}</Td>
                <Td>{c.minSubtotal ? `₺ ${c.minSubtotal}` : "—"}</Td>
                <Td className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  {c.startsAt ? new Date(c.startsAt).toLocaleDateString("en-GB") : "—"} —{" "}
                  {c.endsAt ? new Date(c.endsAt).toLocaleDateString("en-GB") : "∞"}
                </Td>
                <Td>
                  {c.usedCount} / {c.usageLimit ?? "∞"}
                </Td>
                <Td className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  {c.isActive ? "aktif" : "pasif"}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
