import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/primitives";
import { FaqForm } from "@/components/admin/FaqForm";

export const metadata: Metadata = { title: "Yeni SSS · yönetim" };

export default function NewFaqPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Yardım" title="Yeni SSS" />
      <FaqForm initial={null} />
    </div>
  );
}
