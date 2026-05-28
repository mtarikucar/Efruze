import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { OrderStatus } from "@prisma/client";
import {
  PageHeader,
  StatusPill,
  Table,
  THead,
  Th,
  TBody,
  Tr,
  Td,
  EmptyState,
} from "@/components/admin/primitives";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Siparişler · yönetim" };

type Search = Promise<{ status?: string }>;

const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: "Tümü", value: "" },
  { label: "Ödeme bekliyor", value: "AWAITING_PAYMENT" },
  { label: "Ödendi", value: "PAID" },
  { label: "Hazırlanıyor", value: "PROCESSING" },
  { label: "Kargoda", value: "SHIPPED" },
  { label: "Teslim edildi", value: "DELIVERED" },
  { label: "İptal", value: "CANCELLED" },
];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Search }) {
  const { status } = await searchParams;
  const where = status && status in OrderStatus ? { status: status as OrderStatus } : {};

  let orders: Awaited<ReturnType<typeof load>> = [];
  try {
    orders = await load(where);
  } catch {
    orders = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Atölye" title="Siparişler" sub="Tüm siparişler, duruma göre filtrelenebilir." />

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const active = (status ?? "") === tab.value;
          return (
            <a
              key={tab.value}
              href={tab.value ? `/admin/orders?status=${tab.value}` : "/admin/orders"}
              className={cn(
                "rounded-full border px-4 py-2 font-caps text-[10px] uppercase tracking-[0.22em] transition",
                active
                  ? "border-ink bg-ink text-bg"
                  : "border-line text-ink-2 hover:border-ink hover:text-ink",
              )}
            >
              {tab.label}
            </a>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <EmptyState title="Eşleşen sipariş yok." />
      ) : (
        <Table>
          <THead>
            <Th>Sipariş</Th>
            <Th>E-posta</Th>
            <Th>Ürünler</Th>
            <Th>Durum</Th>
            <Th>Ödeme</Th>
            <Th>Tarih</Th>
            <Th className="text-right">Toplam</Th>
          </THead>
          <TBody>
            {orders.map((o) => (
              <Tr key={o.id}>
                <Td>
                  <a
                    href={`/admin/orders/${o.orderNumber}`}
                    className="font-serif text-ink hover:text-blue-deep"
                  >
                    #{o.orderNumber}
                  </a>
                </Td>
                <Td className="text-ink-2">{o.email}</Td>
                <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  {o.itemCount} adet
                </Td>
                <Td>
                  <StatusPill status={o.status} />
                </Td>
                <Td>
                  <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                    {o.paymentMethod ?? "—"}{" "}
                    {o.paymentStatus && (
                      <span className="text-ink-2">· {o.paymentStatus.toLowerCase()}</span>
                    )}
                  </span>
                </Td>
                <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  {o.placedAt}
                </Td>
                <Td className="text-right">{formatPrice(o.total)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

async function load(where: Record<string, unknown>) {
  const rows = await prisma.order.findMany({
    where,
    orderBy: { placedAt: "desc" },
    include: {
      items: { select: { quantity: true } },
      payment: { select: { method: true, status: true } },
    },
    take: 200,
  });
  return rows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    email: o.email,
    status: o.status,
    paymentMethod: o.payment?.method ?? null,
    paymentStatus: o.payment?.status ?? null,
    total: Number(o.total),
    itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
    placedAt: o.placedAt.toLocaleDateString("en-GB"),
  }));
}
