import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { formatPrice } from "@/lib/format";
import {
  PageHeader,
  StatCard,
  StatusPill,
  Table,
  THead,
  Th,
  TBody,
  Tr,
  Td,
  AdminLinkButton,
  EmptyState,
} from "@/components/admin/primitives";

export const metadata: Metadata = { title: "Panel · yönetim" };

type DashStats = {
  ordersToday: number;
  revenueToday: number;
  awaitingPayment: number;
  lowStock: number;
};

async function loadStats(): Promise<DashStats> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  try {
    const [todayOrders, awaitingPayment, lowStock] = await Promise.all([
      prisma.order.findMany({
        where: { placedAt: { gte: start } },
        select: { total: true },
      }),
      prisma.order.count({ where: { status: "AWAITING_PAYMENT" } }),
      prisma.productVariant.count({ where: { stock: { lte: 3 } } }),
    ]);
    const revenueToday = todayOrders.reduce((acc, o) => acc + Number(o.total), 0);
    return {
      ordersToday: todayOrders.length,
      revenueToday,
      awaitingPayment,
      lowStock,
    };
  } catch {
    return { ordersToday: 0, revenueToday: 0, awaitingPayment: 0, lowStock: 0 };
  }
}

async function loadRecentOrders() {
  try {
    return await prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      take: 5,
      include: { items: true, payment: true },
    });
  } catch {
    return [];
  }
}

export default async function AdminDashboardPage() {
  const [stats, recent] = await Promise.all([loadStats(), loadRecentOrders()]);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader eyebrow="Atölye" title="Panel" sub="Bugünün atölyesine genel bakış." />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Bugünkü siparişler" value={String(stats.ordersToday)} />
        <StatCard
          label="Bugünkü ciro"
          value={formatPrice(stats.revenueToday)}
          accent="blue"
        />
        <StatCard
          label="Ödeme bekleyen"
          value={String(stats.awaitingPayment)}
          accent="gold"
          sub={stats.awaitingPayment > 0 ? "Havale onaylarından onayla" : undefined}
        />
        <StatCard
          label="Stoğu azalan ürünler"
          value={String(stats.lowStock)}
          accent={stats.lowStock > 0 ? "gold" : "ink"}
          sub={stats.lowStock > 0 ? "Stokta ≤ 3" : undefined}
        />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="m-0 font-serif text-2xl font-light text-ink">Son siparişler</h2>
          <AdminLinkButton href="/admin/orders" variant="ghost" size="sm">
            Tümünü gör
          </AdminLinkButton>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="Henüz sipariş yok."
            sub="Biri sipariş verdiğinde burada görünecek."
          />
        ) : (
          <Table>
            <THead>
              <Th>Sipariş</Th>
              <Th>E-posta</Th>
              <Th>Durum</Th>
              <Th>Tarih</Th>
              <Th className="text-right">Toplam</Th>
            </THead>
            <TBody>
              {recent.map((o) => (
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
                  <Td>
                    <StatusPill status={o.status} />
                  </Td>
                  <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                    {o.placedAt.toLocaleDateString("en-GB")}
                  </Td>
                  <Td className="text-right">{formatPrice(Number(o.total))}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </section>
    </div>
  );
}
