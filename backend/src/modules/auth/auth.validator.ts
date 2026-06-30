import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: z.string().default("CITIZEN").transform((val) => val.toUpperCase()).pipe(z.enum(["CITIZEN", "POLICE", "ORGANIZATION"])),
}).transform((data) => ({
  name: data.name || data.fullName || "",
  email: data.email,
  password: data.password,
  role: data.role,
})).refine((data) => data.name.length >= 2, { message: "Name is required", path: ["name"] });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required").optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
