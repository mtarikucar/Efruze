import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { auth } from "@/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const inputSchema = z.object({
  folder: z.string().default("efruze/products"),
  resourceType: z.enum(["image", "raw", "auto"]).default("image"),
});

/**
 * Issues a short-lived Cloudinary signature so the admin can upload files
 * (images, GLB models) directly from the browser without proxying bytes
 * through our server. The signature only authorises an upload to the given
 * folder; magic-byte type checking still happens in the server action that
 * persists the resulting public_id.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return NextResponse.json(
      { error: "CLOUDINARY_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  let parsed;
  try {
    parsed = inputSchema.safeParse(await req.json());
  } catch {
    parsed = inputSchema.safeParse({});
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // The signature must sign the EXACT same params we pass to Cloudinary's
  // upload endpoint (sorted alphabetically, sans api_key/file/signature).
  const signature = cloudinary.utils.api_sign_request(
    { folder: parsed.data.folder, timestamp },
    env.CLOUDINARY_API_SECRET,
  );

  return NextResponse.json({
    signature,
    timestamp,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    folder: parsed.data.folder,
    resourceType: parsed.data.resourceType,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${parsed.data.resourceType}/upload`,
  });
}
