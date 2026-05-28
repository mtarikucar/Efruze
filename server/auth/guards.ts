import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Session } from "next-auth";

/**
 * Returns the current session, redirecting to /sign-in if anonymous. Use in
 * server components / server actions that require an authenticated user.
 */
export async function requireUser(returnTo?: string): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) {
    const next = returnTo ? `?callbackUrl=${encodeURIComponent(returnTo)}` : "";
    redirect(`/sign-in${next}`);
  }
  return session;
}

/**
 * Same as requireUser but additionally enforces ADMIN or SUPER_ADMIN role.
 * Redirects to /sign-in for anonymous, /account for authenticated non-admins.
 */
export async function requireAdmin(returnTo?: string): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) {
    const next = returnTo ? `?callbackUrl=${encodeURIComponent(returnTo)}` : "";
    redirect(`/sign-in${next}`);
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/account");
  }
  return session;
}

/** Returns the session (or null) without redirecting. */
export async function getSession() {
  return auth();
}
