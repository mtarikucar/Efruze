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
  EmptyState,
} from "@/components/admin/primitives";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Havale onayları · yönetim" };

export default async function BankTransfersPage() {
  let pending: Awaited<ReturnType<typeof loadPending>> = [];
  try {
    pending = await loadPending();
  } catch {
    pending = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Atölye"
        title="Havale onayları"
        sub="Ödeme onayı bekleyen siparişler."
      />

      {pending.length === 0 ? (
        <EmptyState
          title="Bekleyen havale yok."
          sub="Müşteriler havale ile sipariş verdiğinde, onay için burada görünecekler."
        />
      ) : (
        <Table>
          <THead>
            <Th>Sipariş</Th>
            <Th>Referans</Th>
            <Th>E-posta</Th>
            <Th>Tarih</Th>
            <Th className="text-right">Tutar</Th>
            <Th>İşlem</Th>
          </THead>
          <TBody>
            {pending.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <a
                    href={`/admin/orders/${p.orderNumber}`}
                    className="font-serif text-ink hover:text-blue-deep"
                  >
                    #{p.orderNumber}
                  </a>
                </Td>
                <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  {p.reference ?? "—"}
                </Td>
                <Td className="text-ink-2">{p.email}</Td>
                <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  {p.placedAt}
                </Td>
                <Td className="text-right">{formatPrice(p.amount)}</Td>
                <Td>
                  <a
                    href={`/admin/orders/${p.orderNumber}`}
                    className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
                  >
                    İncele →
                  </a>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

async function loadPending() {
  const rows = await prisma.order.findMany({
    where: { status: "AWAITING_PAYMENT", payment: { method: "BANK_TRANSFER" } },
    orderBy: { placedAt: "asc" },
    include: { payment: true },
  });
  return rows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    email: o.email,
    reference: o.payment?.reference ?? null,
    placedAt: o.placedAt.toLocaleDateString("en-GB"),
    amount: Number(o.payment?.amount ?? o.total),
  }));
}
