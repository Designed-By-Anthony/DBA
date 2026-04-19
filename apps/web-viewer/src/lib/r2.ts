/**
 * Cloudflare R2 Upload Utility
 *
 * Uploads files to the `dba-assets` bucket via S3-compatible API.
 * Returns the public URL stored in `file_attachments.url`.
 *
 * Usage:
 *   const url = await uploadToR2(file, "leads/abc123/before-photo.jpg", tenantId);
 *
 * Tenant-scoped: every upload is keyed under `<tenantId>/...` to enforce isolation.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Lazy-initialized singleton — avoids import-time env crashes during build.
let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials missing. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.local"
    );
  }

  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return _client;
}

function getBucket(): string {
  return process.env.R2_BUCKET_NAME || "dba-assets";
}

/**
 * Build the public URL for an R2 object.
 * Uses the custom domain `assets.designedbyanthony.com` when available,
 * falls back to the R2 dev URL.
 */
function publicUrl(key: string): string {
  return `https://assets.designedbyanthony.com/${key}`;
}

export type UploadResult = {
  url: string;
  key: string;
  sizeBytes: number;
};

/**
 * Upload a file buffer to R2.
 *
 * @param buffer - The file contents.
 * @param path   - Object key path (e.g. "leads/abc123/photo.jpg").
 *                 Will be prefixed with tenantId automatically.
 * @param tenantId - Clerk org ID for tenant isolation.
 * @param mimeType - Content-Type header.
 */
export async function uploadToR2(
  buffer: Buffer | Uint8Array,
  path: string,
  tenantId: string,
  mimeType: string = "application/octet-stream"
): Promise<UploadResult> {
  const key = `${tenantId}/${path}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return {
    url: publicUrl(key),
    key,
    sizeBytes: buffer.length,
  };
}

/**
 * Delete a file from R2.
 *
 * @param key - The full object key (including tenantId prefix).
 */
export async function deleteFromR2(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
}

/**
 * Generate a unique filename with timestamp to prevent collisions.
 */
export function uniqueFileName(original: string): string {
  const ext = original.split(".").pop() || "bin";
  const base = original.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  const ts = Date.now();
  return `${base}_${ts}.${ext}`;
}
