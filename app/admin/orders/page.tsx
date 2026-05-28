import type { Metadata } from "next";
import { OrderService, type AdminOrderListItem } from "@/server/services/order.service";
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
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Siparişler · yönetim" };

type Search = Promise<{ status?: string; q?: string; page?: string }>;

const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: "Tümü", value: "" },
  { label: "Ödeme bekliyor", value: "AWAITING_PAYMENT" },
  { label: "Ödendi", value: "PAID" },
  { label: "Hazırlanıyor", value: "PROCESSING" },
  { label: "Kargoda", value: "SHIPPED" },
  { label: "Teslim edildi", value: "DELIVERED" },
  { label: "İptal", value: "CANCELLED" },
  { label: "İade", value: "REFUNDED" },
];

/** Build a querystring keeping the active filters, overriding given keys. */
function buildQuery(
  base: { status?: string; q?: string; page?: number },
  overrides: { status?: string; q?: string; page?: number } = {},
): string {
  const merged = { ...base, ...overrides };
  const params = new URLSearchParams();
  if (merged.status) params.set("status", merged.status);
  if (merged.q) params.set("q", merged.q);
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const status = sp.status ?? "";
  const q = sp.q?.trim() ?? "";
  const requestedPage = Number(sp.page ?? "1");
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  let items: AdminOrderListItem[] = [];
  let total = 0;
  let perPage = 30;
  try {
    const result = await OrderService.listForAdmin({ status, q, page, perPage });
    items = result.items;
    total = result.total;
    perPage = result.perPage;
  } catch {
    items = [];
    total = 0;
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const filters = { status: status || undefined, q: q || undefined };
  const exportHref = `/admin/orders/export${buildQuery(filters)}`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Atölye"
        title="Siparişler"
        sub="Tüm siparişler — duruma göre filtreleyin, arayın veya CSV olarak indirin."
        actions={
          <a
            href={exportHref}
            className="inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-5 py-2.5 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2"
          >
            CSV indir
          </a>
        }
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const active = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/admin/orders${buildQuery({ q: q || undefined }, { status: tab.value || undefined })}`}
              className={cn(
                "rounded-full border px-4 py-2 font-caps text-[10px] uppercase tracking-[0.22em] transition",
                active
                  ? "border-ink bg-ink text-bg"
                  : "border-line text-ink-2 hover:border-ink hover:text-ink",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        {status && <input type="hidden" name="status" value={status} />}
        <label className="flex flex-1 flex-col gap-2" style={{ minWidth: "240px" }}>
          <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
            Sipariş no veya e-posta ile ara
          </span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="EFR-2026-… veya e-posta"
            className="w-full border-0 border-b border-line bg-transparent px-1 py-2.5 font-serif text-base text-ink outline-none placeholder:italic placeholder:text-ink-mute focus:border-ink"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-5 py-2.5 font-caps text-[11px] uppercase tracking-[0.22em] text-bg transition hover:bg-ink-2"
        >
          Ara
        </button>
        {q && (
          <Link
            href={`/admin/orders${buildQuery({ status: status || undefined })}`}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-transparent px-5 py-2.5 font-caps text-[11px] uppercase tracking-[0.22em] text-ink-2 transition hover:border-ink hover:text-ink"
          >
            Temizle
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="Eşleşen sipariş yok."
          sub={q ? `"${q}" için sonuç bulunamadı.` : undefined}
        />
      ) : (
        <>
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
              {items.map((o) => (
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

          <div className="flex items-center justify-between gap-4">
            <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
              {total} sipariş · sayfa {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={`/admin/orders${buildQuery(filters, { page: page - 1 })}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-transparent px-4 py-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2 transition hover:border-ink hover:text-ink"
                >
                  ← Önceki
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-transparent px-4 py-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute opacity-40">
                  ← Önceki
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={`/admin/orders${buildQuery(filters, { page: page + 1 })}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-transparent px-4 py-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2 transition hover:border-ink hover:text-ink"
                >
                  Sonraki →
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-transparent px-4 py-2 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute opacity-40">
                  Sonraki →
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
