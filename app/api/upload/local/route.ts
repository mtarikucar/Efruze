import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Local file upload endpoint for admin-managed images. Stores under
 * /app/public/uploads/<uuid>.<ext>, served at /uploads/<uuid>.<ext> by Next.js
 * static handling. The compose volume preserves the folder across container
 * restarts.
 *
 * Admin-only. Magic-byte check on the first few bytes prevents bypassing the
 * MIME check by renaming a .txt to .jpg. Single file per request.
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_MODEL_BYTES = 25 * 1024 * 1024; // 25 MB (GLB)

type Ext = "jpg" | "png" | "webp" | "gif" | "glb";
type MagicCheck = { ext: Ext; matches: (b: Buffer) => boolean };
const MAGIC: MagicCheck[] = [
  { ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", matches: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    ext: "webp",
    matches: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  { ext: "gif", matches: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  // glTF binary container — magic "glTF" (0x67 0x6C 0x54 0x46).
  { ext: "glb", matches: (b) => b[0] === 0x67 && b[1] === 0x6c && b[2] === 0x54 && b[3] === 0x46 },
];

function detectExt(head: Buffer): Ext | null {
  for (const m of MAGIC) {
    if (m.matches(head)) return m.ext;
  }
  return null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let formData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "INVALID_FORM" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectExt(buf.subarray(0, 16));
  if (!ext) {
    return NextResponse.json(
      { error: "UNSUPPORTED_FORMAT", supported: ["jpg", "png", "webp", "gif", "glb"] },
      { status: 415 },
    );
  }

  // Size cap depends on the detected type — GLB models are allowed to be larger.
  const maxBytes = ext === "glb" ? MAX_MODEL_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "TOO_LARGE", maxBytes }, { status: 413 });
  }

  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  await writeFile(join(uploadDir, filename), buf);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
