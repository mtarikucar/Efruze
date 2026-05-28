/**
 * Elevate a user to ADMIN role.
 *
 * Usage:
 *   npm run db:make-admin -- you@example.com
 *
 * Requires DATABASE_URL to be set. The user must already exist (sign up via /sign-up
 * first). The script also ensures an Admin row exists alongside the Customer row.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run db:make-admin -- <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}. Sign up first via /sign-up.`);
    process.exit(1);
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } }),
    prisma.admin.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    }),
  ]);

  console.log(`✓ ${email} is now an ADMIN.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
