"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { AuthInput, AuthCard } from "@/components/auth";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

type ForgotForm = z.infer<typeof schema>;

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "citizen";
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <AuthCard>
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#F8F8FA]">Check your email</h2>
              <p className="mt-2 text-sm text-[#B6B8C4]">
                We&apos;ve sent a password reset link to your email address.
              </p>
              <Link
                href={`/login?role=${role}`}
                className="inline-block mt-6 text-sm text-[#EC9AA3] hover:text-[#F3B3BA] font-medium transition-colors"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[rgba(236,154,163,0.06)] border border-[rgba(236,154,163,0.12)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3]" />
                    <span className="text-[10px] font-bold text-[#EC9AA3] uppercase tracking-wider">{role}</span>
                  </div>
                  
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-pink-500/20 bg-pink-500/5 text-[9px] font-extrabold uppercase tracking-widest text-[#EC9AA3] animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-[#EC9AA3]" />
                    Encrypted Session
                  </span>
                </div>
                
                <div className="space-y-1 pt-1">
                  <h2 className="text-2xl font-bold text-[#F8F8FA] tracking-tight">Reset password</h2>
                  <p className="text-sm text-[#B6B8C4] font-medium opacity-90">Enter your email and we&apos;ll send you a reset link.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <AuthInput
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={errors.email?.message}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
                  {...register("email")}
                />

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
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-[#B6B8C4]">
                <Link href={`/login?role=${role}`} className="text-[#EC9AA3] hover:text-[#F3B3BA] font-medium border-b border-transparent hover:border-[#EC9AA3]/40 pb-0.5 transition-all duration-200">
                  ← Back to sign in
                </Link>
              </p>
            </>
          )}
        </AuthCard>
      </motion.div>
    </div>
  );
}
