/**
 * Cloudinary server helpers. The SDK module is imported lazily so the
 * client-only chunks never pull it in. Methods return fail-soft results —
 * Cloudinary outages or missing config never block the caller's primary work.
 */
import { env } from "./env";

let configured = false;

async function getSdk() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return null;
  }
  const { v2: cloudinary } = await import("cloudinary");
  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export async function destroyAsset(args: {
  publicId: string;
  resourceType: "image" | "raw" | "video";
}): Promise<{ ok: boolean; reason?: string }> {
  try {
    const sdk = await getSdk();
    if (!sdk) return { ok: false, reason: "NOT_CONFIGURED" };
    const result = await sdk.uploader.destroy(args.publicId, {
      resource_type: args.resourceType,
      invalidate: true,
    });
    if (result.result === "ok" || result.result === "not found") {
      return { ok: true };
    }
    return { ok: false, reason: result.result };
  } catch (err) {
    console.error("[cloudinary.destroyAsset]", err);
    return { ok: false, reason: err instanceof Error ? err.message : "UNKNOWN" };
  }
}

export async function destroyMany(
  assets: Array<{ publicId: string; resourceType: "image" | "raw" | "video" }>,
): Promise<void> {
  // Fire-and-forget in parallel. Errors are logged inside destroyAsset.
  await Promise.allSettled(assets.map((a) => destroyAsset(a)));
}
