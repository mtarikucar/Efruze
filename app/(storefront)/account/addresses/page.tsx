import type { Metadata } from "next";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/server/db/client";
import { AddressesPanel } from "@/components/storefront/AddressesPanel";

type AddressRow = {
  id: string;
  type: "SHIPPING" | "BILLING";
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  phone: string;
};

export const metadata: Metadata = { title: "Addresses · efruze" };

export default async function AccountAddressesPage() {
  const session = await auth();
  if (!session?.user) return null;
  const t = await getTranslations("account");

  let addresses: AddressRow[] = [];
  try {
    const rows = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    addresses = rows.map((a) => ({
      id: a.id,
      type: a.type,
      fullName: a.fullName,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      district: a.district ?? "",
      postalCode: a.postalCode,
      country: a.country,
      phone: a.phone ?? "",
    }));
  } catch {
    addresses = [];
  }

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1
          className="serif-display m-0 font-serif font-light text-ink"
          style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.04 }}
        >
          {t("addressesTitle")}
        </h1>
        <p className="mt-3 font-serif italic text-lg text-ink-2">{t("addressesSub")}</p>
      </header>

      <AddressesPanel addresses={addresses} />
    </div>
  );
}
