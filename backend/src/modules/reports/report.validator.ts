import { z } from "zod";

export const createReportSchema = z.object({
  type: z.string().min(1, "Report type is required"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  scammerContact: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    upiId: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  financialLoss: z.object({
    amount: z.number().optional(),
    currency: z.string().default("INR"),
    method: z.string().optional(),
  }).optional(),
  evidence: z.array(z.string()).optional(),
  occurredAt: z.string().datetime().optional(),
});

export const listReportsSchema = z.object({
  status: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
