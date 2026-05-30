import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db/client";
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
  EmptyState,
  AdminLinkButton,
} from "@/components/admin/primitives";
import { CustomerActions } from "@/components/admin/CustomerActions";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Müşteri · yönetim" };

type Params = Promise<{ id: string }>;

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const customer = await load(id);
  if (!customer) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Müşteri"
        title={customer.name ?? customer.email}
        sub={customer.name ? customer.email : undefined}
        actions={
          <AdminLinkButton href="/admin/customers" variant="ghost" size="sm">
            ← Müşteriler
          </AdminLinkButton>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Toplam sipariş" value={String(customer.orderCount)} />
        <StatCard
          label="Toplam harcama"
          value={formatPrice(customer.lifetime)}
          accent="blue"
        />
        <StatCard
          label="Bülten"
          value={customer.newsletter ? "Kayıtlı" : "Hayır"}
          accent={customer.newsletter ? "gold" : "ink"}
        />
        <StatCard label="Kayıt" value={customer.createdAt} />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section className="flex flex-col gap-8">
          <div className="rounded-sm card-elev p-6">
            <h2 className="m-0 mb-5 font-serif text-xl font-light text-ink">
              Sipariş geçmişi
            </h2>
            {customer.orders.length === 0 ? (
              <EmptyState title="Bu müşterinin henüz siparişi yok." />
            ) : (
              <Table>
                <THead>
                  <Th>Sipariş</Th>
                  <Th>Tarih</Th>
                  <Th>Durum</Th>
                  <Th className="text-right">Tutar</Th>
                </THead>
                <TBody>
                  {customer.orders.map((o) => (
                    <Tr key={o.id}>
                      <Td>
                        <a
                          href={`/admin/orders/${o.orderNumber}`}
                          className="font-serif text-ink hover:text-blue-deep"
                        >
                          #{o.orderNumber}
                        </a>
                      </Td>
                      <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                        {o.placedAt}
                      </Td>
                      <Td>
                        <StatusPill status={o.status} />
                      </Td>
                      <Td className="text-right">{formatPrice(o.total)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-8">
          <CustomerActions userId={customer.id} email={customer.email} />

          <div className="rounded-sm card-elev p-6">
            <h2 className="m-0 mb-3 font-serif text-xl font-light text-ink">
              Hesap
            </h2>
            <dl className="flex flex-col gap-3">
              <Row label="E-posta" value={customer.email} />
              <Row label="Telefon" value={customer.phone ?? "—"} />
              <Row
                label="Rol"
                value={customer.role.toLowerCase().replaceAll("_", " ")}
              />
              <Row
                label="Bülten"
                value={customer.newsletter ? "Kayıtlı" : "Kayıtlı değil"}
              />
              <Row label="Kayıt tarihi" value={customer.createdAt} />
            </dl>
          </div>

          <div className="rounded-sm card-elev p-6">
            <h2 className="m-0 mb-3 font-serif text-xl font-light text-ink">
              Adresler
            </h2>
            {customer.addresses.length === 0 ? (
              <p className="m-0 font-serif italic text-base text-ink-mute">
                Kayıtlı adres yok.
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {customer.addresses.map((a) => (
                  <li
                    key={a.id}
                    className="border-b border-line pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="font-caps text-[9px] uppercase tracking-[0.22em] text-gold">
                      {a.type === "SHIPPING" ? "Teslimat" : "Fatura"}
                    </div>
                    <address className="mt-1 m-0 not-italic font-serif text-base leading-relaxed text-ink">
                      {a.fullName}
                      <br />
                      {a.line1}
                      {a.line2 && (
                        <>
                          <br />
                          {a.line2}
                        </>
                      )}
                      <br />
                      {a.city}
                      {a.district && ` · ${a.district}`} · {a.postalCode}
                      {a.phone && (
                        <>
                          <br />
                          {a.phone}
                        </>
                      )}
                    </address>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
        {label}
      </dt>
      <dd className="m-0 text-right font-serif text-base text-ink">{value}</dd>
    </div>
  );
}

async function load(id: string) {
  // findUnique on User auto-filters soft-deleted rows via the prisma extension,
  // so deleted customers resolve to null → notFound().
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      customer: { select: { phone: true, newsletter: true } },
      addresses: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          fullName: true,
          line1: true,
          line2: true,
          city: true,
          district: true,
          postalCode: true,
          phone: true,
        },
      },
      orders: {
        orderBy: { placedAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          placedAt: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.customer?.phone ?? null,
    newsletter: user.customer?.newsletter ?? false,
    createdAt: user.createdAt.toLocaleDateString("en-GB"),
    addresses: user.addresses,
    orders: user.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total),
      placedAt: o.placedAt.toLocaleDateString("en-GB"),
    })),
    orderCount: user.orders.length,
    lifetime: user.orders.reduce((acc, o) => acc + Number(o.total), 0),
  };
}
