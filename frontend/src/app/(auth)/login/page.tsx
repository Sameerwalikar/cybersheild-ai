"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { AuthInput, AuthCard, AuthBranding } from "@/components/auth";
import { useAuthStore } from "@/store/auth";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

type Role = "citizen" | "police" | "organization";

const roleConfig: Record<Role, { heading: string; subtitle: string; redirect: string }> = {
  citizen: {
    heading: "Welcome Citizen",
    subtitle: "Protect yourself from cyber threats.",
    redirect: "/citizen-dashboard",
  },
  police: {
    heading: "Police Intelligence Portal",
    subtitle: "Secure access for authorized investigators.",
    redirect: "/police-dashboard",
  },
  organization: {
    heading: "Organization Security Portal",
    subtitle: "Enterprise cyber intelligence platform.",
    redirect: "/citizen-dashboard",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") as Role | null;
  const role: Role = roleParam && roleParam in roleConfig ? roleParam : "citizen";
  const config = roleConfig[role];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const login = useAuthStore((s) => s.login);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Login failed");
        setLoading(false);
        return;
      }
      const { user: userData, accessToken } = json.data;
      login(
        { id: userData.id, name: userData.name, email: userData.email, role: userData.role.toLowerCase() },
        accessToken
      );
      router.push(config.redirect);
    } catch (err: any) {
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
              <h2 className="text-2xl font-bold text-[#F8F8FA] tracking-tight">{config.heading}</h2>
              <p className="text-sm text-[#B6B8C4] font-medium opacity-90">{config.subtitle}</p>
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

            <AuthInput
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              {...register("password")}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-[#EC9AA3] focus:ring-[#EC9AA3] focus:ring-offset-0"
                />
                <span className="text-xs text-[#B6B8C4]">Remember me</span>
              </label>
              <Link href={`/forgot-password?role=${role}`} className="text-xs text-[#EC9AA3] hover:text-[#F3B3BA] transition-colors">
                Forgot password?
              </Link>
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
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(255,255,255,0.06)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[10px] text-[#B6B8C4]/60 bg-[#080a10]">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-3 rounded-xl text-sm font-medium text-[#F8F8FA] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-xs text-[#B6B8C4]">
            Don&apos;t have an account?{" "}
            <Link href={`/register?role=${role}`} className="text-[#EC9AA3] hover:text-[#F3B3BA] font-medium border-b border-transparent hover:border-[#EC9AA3]/40 pb-0.5 transition-all duration-200">
              Create account
            </Link>
          </p>
        </AuthCard>
      </motion.div>
    </div>
  );
}
