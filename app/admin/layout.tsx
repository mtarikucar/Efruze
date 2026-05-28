import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/admin");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/account");
  }

  return (
    <div className="min-h-screen bg-bg text-ink lg:grid lg:grid-cols-[260px_1fr]">
      <AdminSidebar
        userLabel={session.user.name ?? session.user.email ?? ""}
        role={session.user.role}
      />
      <main id="main" role="main" className="px-6 py-10 sm:px-12">
        {children}
      </main>
    </div>
  );
}
