"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/guards";
import { prisma } from "@/server/db/client";
import { EmailService } from "@/server/services/email.service";
import { env } from "@/lib/env";

// Must match the prefix used by the storefront reset flow (app/(auth)/actions.ts)
// so the emailed token validates in resetPasswordAction.
const RESET_IDENTIFIER_PREFIX = "password-reset:";

/**
 * Admin-initiated password reset: issues a fresh reset token for a customer and
 * emails them the link. Gated by requireAdmin (no IP rate-limit — the actor is
 * a trusted admin, not an anonymous visitor).
 */
export async function adminSendPasswordResetAction(
  raw: unknown,
): Promise<{ ok: true; simulated?: boolean } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = z.object({ userId: z.string().min(1) }).safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID" };

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user || user.deletedAt) return { ok: false, error: "Kullanıcı bulunamadı." };
  if (!user.passwordHash) {
    return {
      ok: false,
      error: "Bu hesabın şifresi yok (Google ile giriş). Sıfırlama gönderilemez.",
    };
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const identifier = `${RESET_IDENTIFIER_PREFIX}${user.id}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires } });

  const resetUrl = `${env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;
  const sent = await EmailService.passwordReset({ to: user.email, resetUrl });
  if (sent && "ok" in sent && !sent.ok) {
    return { ok: false, error: "E-posta gönderilemedi." };
  }
  return { ok: true, simulated: sent && "simulated" in sent ? sent.simulated : undefined };
}
