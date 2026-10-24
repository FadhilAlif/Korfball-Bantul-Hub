import { createHash, createHmac, randomUUID } from "node:crypto";
import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { env } from "../../config/env.js";
import type { UploadImageInput } from "./storage.schemas.js";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function encodeS3KeyPath(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeRfc3986(segment))
    .join("/");
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly fallbackMemoryStore = new Map<string, { buffer: Buffer; contentType: string }>();

  get isConfigured(): boolean {
    return Boolean(env.AWS_ENDPOINT_URL_S3 && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY);
  }

  /**
   * Generates a presigned S3 URL (SigV4) for GET or PUT using path-style addressing.
   */
  createPresignedUrl(method: "GET" | "PUT", objectKey: string, expiresInSeconds = 3600): string {
    const endpoint = (env.AWS_ENDPOINT_URL_S3 ?? "").replace(/\/+$/, "");
    const accessKeyId = env.AWS_ACCESS_KEY_ID ?? "";
    const secretAccessKey = env.AWS_SECRET_ACCESS_KEY ?? "";
    const region = env.AWS_REGION || "ap-southeast-1";
    const bucket = env.S3_BUCKET || "uploads";

    const url = new URL(endpoint);
    const host = url.host;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);

    const canonicalUri = `/${encodeRfc3986(bucket)}/${encodeS3KeyPath(objectKey)}`;
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const credential = `${accessKeyId}/${credentialScope}`;

    const queryParams: Record<string, string> = {
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": credential,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": String(expiresInSeconds),
      "X-Amz-SignedHeaders": "host",
    };

    const canonicalQueryString = Object.keys(queryParams)
      .sort()
      .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(queryParams[k]!)}`)
      .join("&");

    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = "host";
    const payloadHash = "UNSIGNED-PAYLOAD";

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");

    const signingKey = getSigningKey(secretAccessKey, dateStamp, region, "s3");
    const signature = hmacSha256(signingKey, stringToSign).toString("hex");

    return `${endpoint}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  }

  /**
   * Uploads a base64-encoded image to Neon S3-Compatible Object Storage (or in-memory fallback in test/local without S3).
   * Returns the public proxy path `/api/storage/view/<folder>/<filename>` to store in DB.
   */
  async uploadImage(input: UploadImageInput): Promise<{ objectKey: string; url: string }> {
    const ext = EXTENSION_BY_MIME[input.contentType] || "webp";
    const cleanBase64 = input.base64Data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");

    let buffer: Buffer;
    try {
      buffer = Buffer.from(cleanBase64, "base64");
    } catch {
      throw new BadRequestException("Format base64 gambar tidak valid.");
    }

    if (buffer.length === 0 || buffer.length > 3.5 * 1024 * 1024) {
      throw new BadRequestException("Ukuran gambar harus antara 1 byte hingga 3.5 MB.");
    }

    const objectKey = `${input.folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

    if (this.isConfigured) {
      const putUrl = this.createPresignedUrl("PUT", objectKey, 300);
      const response = await fetch(putUrl, {
        method: "PUT",
        headers: {
          "Content-Type": input.contentType,
          "Content-Length": String(buffer.length),
        },
        body: new Uint8Array(buffer),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        this.logger.error(`Failed to upload object ${objectKey} to S3 (${response.status}): ${errText}`);
        throw new InternalServerErrorException("Gagal mengunggah foto ke Object Storage.");
      }
    } else {
      this.logger.warn(`S3 Object Storage not configured; storing ${objectKey} in memory fallback.`);
      this.fallbackMemoryStore.set(objectKey, { buffer, contentType: input.contentType });
    }

    return {
      objectKey,
      url: `/api/storage/view/${objectKey}`,
    };
  }

  getFallbackObject(objectKey: string): { buffer: Buffer; contentType: string } | undefined {
    return this.fallbackMemoryStore.get(objectKey);
  }
}
