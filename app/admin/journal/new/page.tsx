import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/primitives";
import { JournalForm } from "@/components/admin/JournalForm";

export const metadata: Metadata = { title: "Yeni yazı · yönetim" };

export default function NewJournalPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Atölye güncesi" title="Yeni günce yazısı" />
      <JournalForm initial={null} />
    </div>
  );
}
