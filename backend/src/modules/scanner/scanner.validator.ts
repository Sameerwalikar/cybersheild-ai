import { z } from "zod";

export const analyzeMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(5000),
  metadata: z.object({
    sender: z.string().optional(),
    source: z.string().optional(),
  }).optional(),
});

export const analyzeUrlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  options: z.object({
    screenshot: z.boolean().optional(),
    followRedirects: z.boolean().default(true),
    deepScan: z.boolean().default(false),
  }).optional(),
});

export const analyzeQrSchema = z.object({
  content: z.string().min(1, "QR decoded content is required"),
  originalType: z.enum(["url", "upi", "text"]).default("text"),
});

export const analyzeUpiSchema = z.object({
  upiId: z.string().regex(/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/, "Invalid UPI ID format"),
});

export const analyzeVoiceSchema = z.object({
  transcript: z.string().min(1, "Transcript is required").max(10000),
  duration: z.number().optional(),
});

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export const analyzeImageSchema = z.object({
  image: z.string().min(1, "Image data is required"),
  mimeType: z.string().refine(
    (val) => ALLOWED_IMAGE_TYPES.includes(val),
    { message: `Unsupported format. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}` }
  ),
  description: z.string().max(500).optional(),
}).refine(
  (data) => {
    // Check base64 size (roughly 4/3 of actual file size)
    const estimatedSize = (data.image.length * 3) / 4;
    return estimatedSize <= MAX_IMAGE_SIZE;
  },
  { message: "Image exceeds 10MB size limit", path: ["image"] }
);
