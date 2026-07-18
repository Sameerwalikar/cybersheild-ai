"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { AuthInput, AuthCard, AuthBranding, PasswordStrength } from "@/components/auth";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  terms: z.literal(true, { message: "You must accept the terms" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "citizen";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Registration failed");
        setLoading(false);
        return;
      }
      router.push(`/login?role=${role}`);
    } catch {
      setError("Unable to connect to server.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <div className="hidden lg:block">
        <AuthBranding />
      </div>
      <div className="lg:hidden flex justify-center">
        <AuthBranding />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease }}
      >
        <AuthCard>
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              {/* Role badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[rgba(236,154,163,0.06)] border border-[rgba(236,154,163,0.12)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3]" />
                <span className="text-[10px] font-bold text-[#EC9AA3] uppercase tracking-wider">{role}</span>
              </div>
              
              {/* Pulsing Encrypted Badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-pink-500/20 bg-pink-500/5 text-[9px] font-extrabold uppercase tracking-widest text-[#EC9AA3] animate-pulse">
                <span className="w-1 h-1 rounded-full bg-[#EC9AA3]" />
                Encrypted Session
              </span>
            </div>
            
            <div className="space-y-1 pt-1">
              <h2 className="text-2xl font-bold text-[#F8F8FA] tracking-tight">Create account</h2>
              <p className="text-sm text-[#B6B8C4] font-medium opacity-90">Join CyberShield AI and protect your digital life.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <AuthInput
              label="Full Name"
              type="text"
              placeholder="Your full name"
              autoComplete="name"
              error={errors.name?.message}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              {...register("name")}
            />

            <AuthInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
              {...register("email")}
            />

            <div>
              <AuthInput
                label="Password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.password?.message}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                {...register("password")}
              />
              <PasswordStrength password={password} />
            </div>

            <AuthInput
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>}
              {...register("confirmPassword")}
            />

            <div className="space-y-1 py-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-3.5 h-3.5 rounded border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-[#EC9AA3] focus:ring-[#EC9AA3] focus:ring-offset-0"
                  {...register("terms")}
                />
                <span className="text-xs text-[#B6B8C4] leading-relaxed">
                  I agree to the{" "}
                  <a href="#" className="text-[#EC9AA3] hover:text-[#F3B3BA] transition-colors border-b border-transparent hover:border-[#EC9AA3]/40 pb-0.5">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-[#EC9AA3] hover:text-[#F3B3BA] transition-colors border-b border-transparent hover:border-[#EC9AA3]/40 pb-0.5">Privacy Policy</a>.
                </span>
              </label>
              {errors.terms && <p className="text-xs text-red-400" role="alert">{errors.terms.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-[#050508] bg-gradient-to-r from-[#EC9AA3] to-[#F3B3BA] shadow-[0_4px_20px_rgba(236,154,163,0.25)] hover:shadow-[0_6px_24px_rgba(236,154,163,0.4)] hover:scale-[1.015] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? "Creating account..." : "Create Account"}
            </button>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          </form>

          <p className="mt-6 text-center text-xs text-[#B6B8C4]">
            Already have an account?{" "}
            <Link href={`/login?role=${role}`} className="text-[#EC9AA3] hover:text-[#F3B3BA] font-medium border-b border-transparent hover:border-[#EC9AA3]/40 pb-0.5 transition-all duration-200">
              Sign in
            </Link>
          </p>
        </AuthCard>
      </motion.div>
    </div>
  );
}
