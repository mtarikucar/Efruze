/**
 * One-off: upsert a SUPER_ADMIN user. Idempotent.
 *
 * Run inside the app container:
 *   docker exec -e ADMIN_EMAIL=… -e ADMIN_PASSWORD=… -e ADMIN_NAME=… \
 *     efruze_app npx --yes tsx scripts/create-admin.ts
 *
 * Re-running with a new ADMIN_PASSWORD rotates it for that email.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Atelier";

  if (!email) throw new Error("ADMIN_EMAIL env var required");
  if (!password || password.length < 8)
    throw new Error("ADMIN_PASSWORD env var required (min 8 chars)");

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "SUPER_ADMIN", name },
    create: {
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      name,
    },
  });

  await prisma.admin.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  console.log(`✓ SUPER_ADMIN ready — ${email} (id: ${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
