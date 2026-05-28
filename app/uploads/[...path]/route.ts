import { readFile } from "fs/promises";
import { join, normalize, sep } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Serves admin-uploaded files from public/uploads. A custom handler is needed
 * because `next start` only serves files that existed in public/ at build
 * time — anything written at runtime (our uploads) 404s through the static
 * layer. This reads them off disk on each request instead.
 */
const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  glb: "model/gltf-binary",
};

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const rel = path.join("/");

  // Path-traversal guard: resolve and confirm the result stays under UPLOAD_DIR.
  const resolved = normalize(join(UPLOAD_DIR, rel));
  if (!resolved.startsWith(UPLOAD_DIR + sep)) {
    return new Response("Bad request", { status: 400 });
  }

  try {
    const data = await readFile(resolved);
    const ext = rel.slice(rel.lastIndexOf(".") + 1).toLowerCase();
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPE[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
