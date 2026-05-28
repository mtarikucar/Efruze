import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { PageHeader } from "@/components/admin/primitives";
import { BanksPanel } from "@/components/admin/BanksPanel";

export const metadata: Metadata = { title: "Banka hesapları · yönetim" };

export default async function AdminBanksPage() {
  let banks: Array<{
    id: string;
    bankName: string;
    accountHolder: string;
    iban: string;
    swift: string;
    currency: string;
    isActive: boolean;
    sortOrder: number;
  }> = [];
  try {
    const rows = await prisma.bankAccount.findMany({ orderBy: { sortOrder: "asc" } });
    banks = rows.map((b) => ({
      id: b.id,
      bankName: b.bankName,
      accountHolder: b.accountHolder,
      iban: b.iban,
      swift: b.swift ?? "",
      currency: b.currency,
      isActive: b.isActive,
      sortOrder: b.sortOrder,
    }));
  } catch {
    banks = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Atölye"
        title="Banka hesapları"
        sub="Havale ile ödeme yapan müşterilere ödeme adımında gösterilir."
      />
      <BanksPanel banks={banks} />
    </div>
  );
}
