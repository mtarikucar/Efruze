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
  AdminLinkButton,
} from "@/components/admin/primitives";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Müşteriler · yönetim" };

const PER_PAGE = 30;

type SearchParams = Promise<{ q?: string; page?: string }>;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  let result: Awaited<ReturnType<typeof load>> = { users: [], total: 0 };
  try {
    result = await load(q, page);
  } catch {
    result = { users: [], total: 0 };
  }

  const { users, total } = result;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const baseQ = q ? `q=${encodeURIComponent(q)}&` : "";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Atölye"
        title="Müşteriler"
        sub="Atölyeye kayıt olan herkes."
      />

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex w-full flex-col gap-2 sm:max-w-sm">
          <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
            Ara
          </span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Ad veya e-posta"
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
          <a
            href="/admin/customers"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-transparent px-5 py-2.5 font-caps text-[11px] uppercase tracking-[0.22em] text-ink-2 transition hover:border-ink hover:text-ink"
          >
            Temizle
          </a>
        )}
      </form>

      {users.length === 0 ? (
        <EmptyState
          title={q ? "Eşleşen müşteri bulunamadı." : "Henüz kayıtlı müşteri yok."}
        />
      ) : (
        <>
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
                  <Td>
                    <a
                      href={`/admin/customers/${u.id}`}
                      className="font-serif text-ink hover:text-blue-deep"
                    >
                      {u.email}
                    </a>
                  </Td>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                Sayfa {page} / {totalPages} · {total} kayıt
              </div>
              <div className="flex gap-3">
                {page > 1 && (
                  <AdminLinkButton
                    href={`/admin/customers?${baseQ}page=${page - 1}`}
                    variant="ghost"
                    size="sm"
                  >
                    ← Önceki
                  </AdminLinkButton>
                )}
                {page < totalPages && (
                  <AdminLinkButton
                    href={`/admin/customers?${baseQ}page=${page + 1}`}
                    variant="ghost"
                    size="sm"
                  >
                    Sonraki →
                  </AdminLinkButton>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

async function load(q: string, page: number) {
  // Soft-deleted users (deletedAt) are auto-filtered out by the prisma
  // soft-delete extension on User.findMany / count.
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        orders: { select: { total: true } },
      },
    }),
  ]);

  const users = rows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toLocaleDateString("en-GB"),
    orderCount: u.orders.length,
    lifetime: u.orders.reduce((acc, o) => acc + Number(o.total), 0),
  }));

  return { users, total };
}
