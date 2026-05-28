import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { requireSuperAdmin } from "@/server/auth/guards";
import { PageHeader } from "@/components/admin/primitives";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";

export const metadata: Metadata = { title: "Yöneticiler · yönetim" };

export default async function AdminUsersPage() {
  const session = await requireSuperAdmin();

  let admins: Array<{
    id: string;
    email: string;
    name: string | null;
    role: "ADMIN" | "SUPER_ADMIN";
    createdAt: string;
    isSelf: boolean;
  }> = [];
  try {
    const rows = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    admins = rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as "ADMIN" | "SUPER_ADMIN",
      createdAt: u.createdAt.toLocaleDateString("en-GB"),
      isSelf: u.id === session.user.id,
    }));
  } catch {
    admins = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Atölye"
        title="Yöneticiler"
        sub="Yönetici hesaplarını oluştur, rollerini değiştir veya yetkilerini kaldır."
      />
      <AdminUsersPanel admins={admins} />
    </div>
  );
}
