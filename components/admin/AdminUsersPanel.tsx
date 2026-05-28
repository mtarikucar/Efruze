"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminButton,
  FormField,
  Table,
  THead,
  Th,
  TBody,
  Tr,
  Td,
  EmptyState,
  adminInputCls,
} from "./primitives";
import {
  createAdminAction,
  changeRoleAction,
  removeAdminAction,
} from "@/app/admin/users/actions";

type AdminRow = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "SUPER_ADMIN";
  createdAt: string;
  isSelf: boolean;
};

type NewAdmin = {
  email: string;
  name: string;
  password: string;
  role: "ADMIN" | "SUPER_ADMIN";
};

const emptyNew: NewAdmin = {
  email: "",
  name: "",
  password: "",
  role: "ADMIN",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Yönetici",
  SUPER_ADMIN: "Süper yönetici",
  CUSTOMER: "Müşteri",
};

export function AdminUsersPanel({ admins }: { admins: AdminRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<NewAdmin>(emptyNew);

  function create(data: NewAdmin) {
    setError(null);
    startTransition(async () => {
      const r = await createAdminAction(data);
      if (r.ok) {
        setForm(emptyNew);
        setAdding(false);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  function changeRole(userId: string, role: "ADMIN" | "SUPER_ADMIN" | "CUSTOMER") {
    setError(null);
    startTransition(async () => {
      const r = await changeRoleAction({ userId, role });
      if (r.ok) router.refresh();
      else setError(r.error);
    });
  }

  function remove(userId: string, label: string) {
    if (!confirm(`${label} yönetici yetkisi kaldırılsın mı? (Müşteriye dönüştürülür)`))
      return;
    setError(null);
    startTransition(async () => {
      const r = await removeAdminAction({ userId });
      if (r.ok) router.refresh();
      else setError(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-sm border border-red-700/30 bg-red-700/5 p-3 font-serif text-base text-red-900">
          {error}
        </div>
      )}

      {admins.length === 0 ? (
        <EmptyState title="Henüz yönetici yok." />
      ) : (
        <Table>
          <THead>
            <Th>E-posta</Th>
            <Th>Ad</Th>
            <Th>Rol</Th>
            <Th>Katılım</Th>
            <Th className="text-right">İşlem</Th>
          </THead>
          <TBody>
            {admins.map((a) => (
              <Tr key={a.id}>
                <Td>
                  {a.email}
                  {a.isSelf && (
                    <span className="ml-2 font-caps text-[9px] uppercase tracking-[0.22em] text-gold">
                      siz
                    </span>
                  )}
                </Td>
                <Td className="text-ink-2">{a.name ?? "—"}</Td>
                <Td>
                  <select
                    value={a.role}
                    disabled={pending}
                    onChange={(e) =>
                      changeRole(
                        a.id,
                        e.target.value as "ADMIN" | "SUPER_ADMIN" | "CUSTOMER",
                      )
                    }
                    className="border-0 border-b border-line bg-transparent py-1 font-caps text-[10px] uppercase tracking-[0.22em] text-ink outline-none focus:border-ink disabled:opacity-60"
                  >
                    <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                    <option value="SUPER_ADMIN">{ROLE_LABELS.SUPER_ADMIN}</option>
                    <option value="CUSTOMER">{ROLE_LABELS.CUSTOMER}</option>
                  </select>
                </Td>
                <Td className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
                  {a.createdAt}
                </Td>
                <Td className="text-right">
                  {!a.isSelf && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => remove(a.id, a.name ?? a.email)}
                      className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute transition hover:text-red-700 disabled:opacity-60"
                    >
                      Yetkiyi kaldır
                    </button>
                  )}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      {!adding && (
        <AdminButton type="button" onClick={() => setAdding(true)}>
          + Yeni yönetici ekle
        </AdminButton>
      )}

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create(form);
          }}
          className="rounded-sm card-elev p-6"
        >
          <h2 className="m-0 mb-5 font-serif text-xl font-light text-ink">
            Yeni yönetici
          </h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <FormField label="Ad">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={adminInputCls}
              />
            </FormField>
            <FormField label="E-posta">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={adminInputCls}
              />
            </FormField>
            <FormField label="Geçici şifre" hint="En az 8 karakter">
              <input
                required
                type="text"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={adminInputCls}
              />
            </FormField>
            <FormField label="Rol">
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as "ADMIN" | "SUPER_ADMIN" })
                }
                className={adminInputCls}
              >
                <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                <option value="SUPER_ADMIN">{ROLE_LABELS.SUPER_ADMIN}</option>
              </select>
            </FormField>
          </div>

          <div className="mt-6 flex gap-3">
            <AdminButton type="submit" disabled={pending}>
              {pending ? "…" : "Oluştur"}
            </AdminButton>
            <AdminButton
              type="button"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setForm(emptyNew);
                setError(null);
              }}
            >
              Vazgeç
            </AdminButton>
          </div>
        </form>
      )}
    </div>
  );
}
