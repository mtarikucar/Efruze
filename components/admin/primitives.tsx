import * as React from "react";
import { cn } from "@/lib/cn";

/* ---- Page header ------------------------------------------------------- */

export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        {eyebrow && (
          <div className="font-caps text-[10px] uppercase tracking-[0.32em] text-gold">{eyebrow}</div>
        )}
        <h1
          className="serif-display m-0 mt-2 font-serif font-light text-ink"
          style={{ fontSize: "clamp(28px, 3.4vw, 40px)", lineHeight: 1.05 }}
        >
          {title}
        </h1>
        {sub && <p className="mt-2 font-serif italic text-base text-ink-2">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

/* ---- Buttons ----------------------------------------------------------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ink" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function AdminButton({
  variant = "ink",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const variants = {
    ink: "border border-ink bg-ink text-bg hover:bg-ink-2",
    ghost:
      "border border-line bg-transparent text-ink-2 hover:border-ink hover:text-ink",
    danger:
      "border border-red-700/40 bg-transparent text-red-800 hover:bg-red-700/10",
  } as const;
  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-5 py-2.5 text-[11px]",
  } as const;
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-caps uppercase tracking-[0.22em] transition disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
    />
  );
}

export function AdminLinkButton({
  href,
  variant = "ink",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: "ink" | "ghost";
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}) {
  const variants = {
    ink: "border border-ink bg-ink text-bg hover:bg-ink-2",
    ghost: "border border-line bg-transparent text-ink-2 hover:border-ink hover:text-ink",
  } as const;
  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-5 py-2.5 text-[11px]",
  } as const;
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-caps uppercase tracking-[0.22em] transition",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </a>
  );
}

/* ---- Stat card --------------------------------------------------------- */

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "gold" | "blue" | "ink";
}) {
  const accentColor = {
    gold: "text-gold",
    blue: "text-blue-deep",
    ink: "text-ink",
  }[accent ?? "ink"];
  return (
    <div className="rounded-sm card-elev p-6">
      <div className="font-caps text-[10px] uppercase tracking-[0.32em] text-ink-mute">
        {label}
      </div>
      <div className={cn("mt-2 font-serif font-light text-4xl tracking-tight", accentColor)}>
        {value}
      </div>
      {sub && (
        <div className="mt-1 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {sub}
        </div>
      )}
    </div>
  );
}

/* ---- Status pill ------------------------------------------------------- */

const STATUS_LABELS_TR: Record<string, string> = {
  PENDING: "Beklemede",
  AWAITING_PAYMENT: "Ödeme bekliyor",
  AWAITING_TRANSFER: "Havale bekliyor",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal",
  FAILED: "Başarısız",
  REFUNDED: "İade",
};

export function StatusPill({ status }: { status: string }) {
  const tone = (() => {
    if (["PAID", "DELIVERED"].includes(status))
      return "border-emerald-700/40 bg-emerald-700/5 text-emerald-800";
    if (["PROCESSING", "SHIPPED"].includes(status))
      return "border-blue-deep/40 bg-blue-deep/5 text-blue-deep";
    if (["AWAITING_PAYMENT", "PENDING", "AWAITING_TRANSFER"].includes(status))
      return "border-gold/40 bg-gold/5 text-gold";
    if (["CANCELLED", "FAILED", "REFUNDED"].includes(status))
      return "border-red-700/40 bg-red-700/5 text-red-800";
    return "border-line bg-bg-deep/40 text-ink-mute";
  })();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-caps text-[9px] uppercase tracking-[0.22em]",
        tone,
      )}
    >
      {STATUS_LABELS_TR[status] ?? status.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}

/* ---- Table primitives -------------------------------------------------- */

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-sm card-elev">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-bg-deep/30">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-line px-5 py-3 text-left font-caps text-[10px] uppercase tracking-[0.22em] text-ink-2",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={cn("border-b border-line last:border-b-0 hover:bg-bg-deep/20", className)}>
      {children}
    </tr>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("px-5 py-3.5 font-serif text-base text-ink", className)}>
      {children}
    </td>
  );
}

/* ---- Form primitives --------------------------------------------------- */

export function FormSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm card-elev p-6">
      {title && (
        <h2 className="m-0 mb-5 font-serif text-xl font-light text-ink">{title}</h2>
      )}
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function FormField({
  label,
  full,
  children,
  hint,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", full && "sm:col-span-2")}>
      <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
        {label}
      </span>
      {children}
      {hint && (
        <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute opacity-70">
          {hint}
        </span>
      )}
    </label>
  );
}

export const adminInputCls =
  "w-full border-0 border-b border-line bg-transparent px-1 py-2.5 font-serif text-base text-ink outline-none placeholder:italic placeholder:text-ink-mute focus:border-ink";

export const adminTextareaCls = `${adminInputCls} h-auto py-2.5 resize-y`;

export const adminCheckboxCls = "accent-ink";

/* ---- Empty state ------------------------------------------------------- */

export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="rounded-sm border border-dashed border-line bg-paper p-12 text-center">
      <p className="m-0 font-serif text-lg text-ink-2">{title}</p>
      {sub && <p className="mt-2 m-0 font-serif italic text-base text-ink-mute">{sub}</p>}
    </div>
  );
}
