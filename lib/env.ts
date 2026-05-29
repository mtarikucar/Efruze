import { z } from "zod";

/**
 * Validated process.env. Imported once at module-init time; any missing
 * required value causes a startup error rather than a runtime surprise.
 *
 * v1 (M1) only needs DATABASE_URL and the public site URL. Later milestones
 * will tighten the schema for Cloudinary, Resend, PayTR, and Upstash.
 */
const schema = z
  .object({
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required — see .env.example")
      .default("postgresql://localhost:5432/efruze"),

    NEXT_PUBLIC_SITE_URL: z
      .string()
      .url()
      .default("http://localhost:3000"),

    AUTH_SECRET: z.string().min(1).optional(),
    NEXTAUTH_URL: z.string().url().optional(),

    // Google OAuth (optional — sign-in form hides the Google button when unset)
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),

    // Optional — wired in later milestones
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    RESEND_API_KEY: z.string().optional(),
    // Sender + admin recipient for transactional email. EMAIL_FROM must be on a
    // domain verified in Resend (the default efruze.com is a placeholder — set
    // this to an address on a domain you control or sends will be rejected).
    EMAIL_FROM: z.string().optional(),
    EMAIL_ADMIN_TO: z.string().optional(),

    PAYTR_MERCHANT_ID: z.string().optional(),
    PAYTR_MERCHANT_KEY: z.string().optional(),
    PAYTR_MERCHANT_SALT: z.string().optional(),
    // Defaults to "1" (sandbox) — set explicitly to "0" only after sandbox-passing live cards.
    PAYTR_TEST_MODE: z.string().default("1"),

    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  })
  .superRefine((data, ctx) => {
    // Production-only hard requirements. Skipped in dev/test so local work
    // doesn't need every secret. The build itself runs with NODE_ENV=production
    // but seeds placeholder values via Dockerfile ARGs, so these only bite
    // when a real prod container starts without the env populated.
    if (data.NODE_ENV !== "production") return;

    if (!data.AUTH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AUTH_SECRET"],
        message:
          "AUTH_SECRET is required in production — without it NextAuth issues a fresh random secret on every restart and invalidates all sessions.",
      });
    }

    // Catches the easy mistake of shipping the schema's local-dev default to
    // prod. `placeholder@db` (the Dockerfile build-time ARG) is intentionally
    // not localhost, so it slips through.
    if (/\blocalhost\b|\b127\.0\.0\.1\b/.test(data.DATABASE_URL)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message:
          "DATABASE_URL points to localhost in production — that's almost certainly a missing env var rather than an intentional bind to a local DB.",
      });
    }
  });

function parseEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}

export const env = parseEnv();
export type Env = z.infer<typeof schema>;
