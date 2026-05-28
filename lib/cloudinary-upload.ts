/**
 * Client-side helper for direct browser→Cloudinary uploads. Fetches a signed
 * payload from /api/upload/cloudinary-sign, then POSTs the file directly to
 * Cloudinary. Returns the parsed Cloudinary response.
 */
export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resource_type: "image" | "raw" | "video";
};

export async function cloudinaryUpload(args: {
  file: File;
  folder?: string;
  resourceType?: "image" | "raw" | "auto";
  onProgress?: (pct: number) => void;
}): Promise<CloudinaryUploadResult> {
  const sigRes = await fetch("/api/upload/cloudinary-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder: args.folder ?? "efruze/products",
      resourceType: args.resourceType ?? "image",
    }),
  });
  if (!sigRes.ok) {
    const body = await sigRes.json().catch(() => ({}));
    throw new Error(body.error ?? `SIGN_FAILED_${sigRes.status}`);
  }
  const { signature, timestamp, apiKey, folder, uploadUrl } = (await sigRes.json()) as {
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
    resourceType: string;
    uploadUrl: string;
  };

  const form = new FormData();
  form.append("file", args.file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && args.onProgress) {
        args.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(parsed as CloudinaryUploadResult);
        } else {
          reject(new Error(parsed.error?.message ?? `UPLOAD_FAILED_${xhr.status}`));
        }
      } catch {
        reject(new Error("UPLOAD_PARSE_ERROR"));
      }
    };
    xhr.onerror = () => reject(new Error("UPLOAD_NETWORK_ERROR"));
    xhr.send(form);
  });
}
