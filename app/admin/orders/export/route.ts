import type { NextRequest } from "next/server";
import { OrderStatus, Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/server/db/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * CSV export of orders for the admin. The admin layout guards pages but NOT
 * route handlers, so authentication + role are checked manually here.
 *
 * Honours the same `status` and `q` filters as the orders list so the admin
 * can export exactly what they're looking at. A UTF-8 BOM is prepended so
 * Excel renders Turkish characters (ş, ğ, İ…) correctly.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("UNAUTHORIZED", { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return new Response("FORBIDDEN", { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const statusParam = sp.get("status") ?? "";
  const q = (sp.get("q") ?? "").trim();

  const where: Prisma.OrderWhereInput = {};
  if (statusParam && statusParam in OrderStatus) {
    where.status = statusParam as OrderStatus;
  }
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { placedAt: "desc" },
    include: {
      items: { select: { quantity: true } },
      payment: { select: { method: true } },
    },
  });

  const header = [
    "Sipariş No",
    "Tarih",
    "E-posta",
    "Durum",
    "Ödeme Yöntemi",
    "Toplam",
    "Kalem Sayısı",
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    o.placedAt.toLocaleString("tr-TR"),
    o.email,
    STATUS_LABELS_TR[o.status] ?? o.status,
    o.payment?.method ?? "—",
    Number(o.total).toFixed(2),
    String(o.items.reduce((acc, i) => acc + i.quantity, 0)),
  ]);

  const csvBody = [header, ...rows].map((cols) => cols.map(csvCell).join(",")).join("\r\n");
  // UTF-8 BOM so Excel detects the encoding and renders Turkish characters.
  const csv = "﻿" + csvBody;

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="efruze-siparisler-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

const STATUS_LABELS_TR: Record<string, string> = {
  PENDING: "Beklemede",
  AWAITING_PAYMENT: "Ödeme bekliyor",
  PAID: "Ödendi",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal",
  REFUNDED: "İade edildi",
};

/** Quote a CSV cell, escaping embedded quotes — guards against commas/newlines. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}
