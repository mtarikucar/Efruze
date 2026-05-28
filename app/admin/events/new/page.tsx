import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/primitives";
import { EventForm } from "@/components/admin/EventForm";

export const metadata: Metadata = { title: "Yeni etkinlik · yönetim" };

export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Atölye güncesi" title="Yeni etkinlik" />
      <EventForm initial={null} />
    </div>
  );
}
