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

export const metadata: Metadata = { title: "Müşteriler · yönetim" };

export default async function AdminCustomersPage() {
  let users: Awaited<ReturnType<typeof load>> = [];
  try {
    users = await load();
  } catch {
    users = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Atölye"
        title="Müşteriler"
        sub="Atölyeye kayıt olan herkes."
      />

      {users.length === 0 ? (
        <EmptyState title="Henüz kayıtlı müşteri yok." />
      ) : (
        <Table>
          <THead>
            <Th>E-posta</Th>
            <Th>Ad</Th>
            <Th>Rol</Th>
            <Th>Katılım</Th>
            <Th>Siparişler</Th>
            <Th className="text-right">Toplam harcama</Th>
          </THead>
          <TBody>
            {users.map((u) => (
              <Tr key={u.id}>
                <Td>{u.email}</Td>
                <Td className="text-ink-2">{u.name ?? "—"}</Td>
                <Td className="font-caps text-[9px] uppercase tracking-[0.22em] text-ink-mute">
                  {u.role.toLowerCase().replaceAll("_", " ")}
                </Td>
                <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  {u.createdAt}
                </Td>
                <Td>{u.orderCount}</Td>
                <Td className="text-right">{formatPrice(u.lifetime)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

async function load() {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      orders: { select: { total: true } },
    },
  });
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toLocaleDateString("en-GB"),
    orderCount: u.orders.length,
    lifetime: u.orders.reduce((acc, o) => acc + Number(o.total), 0),
  }));
}
