import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { PageHeader } from "@/components/admin/primitives";
import { SettingsForm, type SettingsFormInitial } from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Ayarlar · yönetim" };

const fallback: SettingsFormInitial = {
  brandName: "efruze",
  taglineTr: "Su üstüne çizilen",
  taglineEn: "Drawn upon water",
  contactEmail: "atelier@efruze.com",
  whatsapp: "",
  instagram: "@efruze",
  defaultCurrency: "TRY",
  shippingFlatRate: "80",
  freeShippingThreshold: "2500",
  addressTr: "Atölye\nAlanya / Antalya",
  addressEn: "Atelier\nAlanya / Antalya",
  hoursTr: "Sal–Cum · 10:00 – 18:00\nCmt · 12:00 – 17:00 · randevu ile",
  hoursEn: "Tue–Fri · 10:00 – 18:00\nSat · 12:00 – 17:00 · by appointment",
};

export default async function AdminSettingsPage() {
  let initial: SettingsFormInitial = fallback;
  try {
    const s = await prisma.storeSettings.findUnique({ where: { id: "singleton" } });
    if (s) {
      const tagline = (s.tagline as { tr?: string; en?: string } | null) ?? {};
      initial = {
        brandName: s.brandName,
        taglineTr: tagline.tr ?? fallback.taglineTr,
        taglineEn: tagline.en ?? fallback.taglineEn,
        contactEmail: s.contactEmail,
        whatsapp: s.whatsapp ?? "",
        instagram: s.instagram ?? "",
        defaultCurrency: s.defaultCurrency,
        shippingFlatRate: s.shippingFlatRate.toString(),
        freeShippingThreshold: s.freeShippingThreshold
          ? s.freeShippingThreshold.toString()
          : "",
        addressTr: s.addressTr ?? fallback.addressTr,
        addressEn: s.addressEn ?? fallback.addressEn,
        hoursTr: s.hoursTr ?? fallback.hoursTr,
        hoursEn: s.hoursEn ?? fallback.hoursEn,
      };
    }
  } catch {
    /* fall back to defaults */
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Atölye"
        title="Ayarlar"
        sub="Marka, iletişim ve kargo yapılandırması."
      />
      <SettingsForm initial={initial} />
    </div>
  );
}
