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

// Statuses that count as realized revenue (payment received and onward).
const PAID_STATUSES = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

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

type Analytics = {
  revenue30: number;
  orders30: number;
  avgOrder: number;
  topProducts: Array<{ name: string; qty: number }>;
  dailyTrend: Array<{ label: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
};

const EMPTY_ANALYTICS: Analytics = {
  revenue30: 0,
  orders30: 0,
  avgOrder: 0,
  topProducts: [],
  dailyTrend: [],
  statusBreakdown: [],
};

async function loadAnalytics(): Promise<Analytics> {
  const now = new Date();
  const since30 = new Date(now);
  since30.setDate(since30.getDate() - 30);
  since30.setHours(0, 0, 0, 0);

  const since7 = new Date(now);
  since7.setDate(since7.getDate() - 6); // 7-day window incl. today
  since7.setHours(0, 0, 0, 0);

  try {
    const [paidAgg, topItems, last7Orders, statusGroups] = await Promise.all([
      // Realized revenue + count over the last 30 days (paid+ statuses).
      prisma.order.aggregate({
        where: {
          placedAt: { gte: since30 },
          status: { in: [...PAID_STATUSES] },
        },
        _sum: { total: true },
        _count: { _all: true },
      }),
      // Top 5 products by quantity sold in the last 30 days.
      prisma.orderItem.groupBy({
        by: ["nameSnapshot"],
        where: { order: { placedAt: { gte: since30 } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      // Orders placed in the last 7 days for the daily trend.
      prisma.order.findMany({
        where: { placedAt: { gte: since7 } },
        select: { placedAt: true },
      }),
      // Status distribution across all orders.
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
        orderBy: { _count: { status: "desc" } },
      }),
    ]);

    const revenue30 = Number(paidAgg._sum.total ?? 0);
    const orders30 = paidAgg._count._all;
    const avgOrder = orders30 > 0 ? revenue30 / orders30 : 0;

    const topProducts = topItems.map((t) => ({
      name: t.nameSnapshot,
      qty: t._sum.quantity ?? 0,
    }));

    // Build a 7-bucket daily trend (oldest → today), counting orders per day.
    const buckets = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(since7);
      d.setDate(since7.getDate() + i);
      buckets.set(dayKey(d), 0);
    }
    for (const o of last7Orders) {
      const k = dayKey(o.placedAt);
      if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
    }
    const dailyTrend = Array.from(buckets.entries()).map(([key, count]) => ({
      label: key.slice(5).replace("-", "."), // "MM.DD"
      count,
    }));

    const statusBreakdown = statusGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));

    return { revenue30, orders30, avgOrder, topProducts, dailyTrend, statusBreakdown };
  } catch {
    return EMPTY_ANALYTICS;
  }
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function AdminDashboardPage() {
  const [stats, recent, analytics] = await Promise.all([
    loadStats(),
    loadRecentOrders(),
    loadAnalytics(),
  ]);

  const maxDaily = Math.max(1, ...analytics.dailyTrend.map((d) => d.count));

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
        <a href="/admin/products?lowstock=1" className="block transition hover:opacity-90">
          <StatCard
            label="Stoğu azalan ürünler"
            value={String(stats.lowStock)}
            accent={stats.lowStock > 0 ? "gold" : "ink"}
            sub={stats.lowStock > 0 ? "Stokta ≤ 3 · listeyi gör →" : "Tümü stokta"}
          />
        </a>
      </section>

      {/* ---- 30-day analytics ------------------------------------------- */}
      <section className="flex flex-col gap-6">
        <h2 className="m-0 font-serif text-2xl font-light text-ink">Son 30 gün</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard
            label="Ciro (30 gün)"
            value={formatPrice(analytics.revenue30)}
            accent="blue"
            sub="Ödenen ve sonrası"
          />
          <StatCard label="Sipariş (30 gün)" value={String(analytics.orders30)} />
          <StatCard
            label="Ortalama sepet"
            value={formatPrice(analytics.avgOrder)}
            accent="gold"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* ---- Top products --------------------------------------------- */}
        <section>
          <h2 className="m-0 mb-4 font-serif text-2xl font-light text-ink">
            En çok satılan ürünler
          </h2>
          {analytics.topProducts.length === 0 ? (
            <EmptyState title="Son 30 günde satış yok." />
          ) : (
            <Table>
              <THead>
                <Th>Ürün</Th>
                <Th className="text-right">Adet</Th>
              </THead>
              <TBody>
                {analytics.topProducts.map((p) => (
                  <Tr key={p.name}>
                    <Td>{p.name}</Td>
                    <Td className="text-right font-serif text-ink">{p.qty}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </section>

        {/* ---- 7-day order trend (CSS bars) ----------------------------- */}
        <section>
          <h2 className="m-0 mb-4 font-serif text-2xl font-light text-ink">
            Son 7 gün sipariş trendi
          </h2>
          <div className="rounded-sm card-elev p-6">
            <div className="flex h-40 items-end justify-between gap-2">
              {analytics.dailyTrend.map((d) => (
                <div
                  key={d.label}
                  className="flex flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="font-caps text-[10px] text-ink-2">{d.count}</span>
                  <div
                    className="w-full rounded-t-sm bg-blue-deep/70"
                    style={{
                      height: `${Math.max(4, (d.count / maxDaily) * 100)}%`,
                    }}
                    aria-hidden
                  />
                  <span className="font-caps text-[9px] uppercase tracking-[0.18em] text-ink-mute">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ---- Status breakdown -------------------------------------------- */}
      <section>
        <h2 className="m-0 mb-4 font-serif text-2xl font-light text-ink">
          Durum dağılımı
        </h2>
        {analytics.statusBreakdown.length === 0 ? (
          <EmptyState title="Henüz sipariş yok." />
        ) : (
          <div className="flex flex-wrap gap-3">
            {analytics.statusBreakdown.map((s) => (
              <div
                key={s.status}
                className="flex items-center gap-3 rounded-sm card-elev px-4 py-3"
              >
                <StatusPill status={s.status} />
                <span className="font-serif text-xl font-light text-ink">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Recent orders ----------------------------------------------- */}
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
