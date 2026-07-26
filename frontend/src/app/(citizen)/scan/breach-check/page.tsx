"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Mail, Key, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { scannerApi } from "@/services/api/scanner";

type Breach = {
  name: string;
  breach_date: string;
  added_date: string;
  data_classes: string[];
  description: string;
  is_verified: boolean;
};

type BreachCheckResult = {
  email_checked: string;
  breach_count: number;
  breaches: Breach[];
  checked_at: string;
};

export default function BreachCheckPage() {
  const [activeTab, setActiveTab] = useState<"email" | "password">("email");

  // Email State
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [emailResult, setEmailResult] = useState<BreachCheckResult | null>(null);
  const [emailError, setEmailError] = useState("");

  // Password State
  const [password, setPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [passwordResult, setPasswordResult] = useState<number | null>(null);
  const [passwordError, setPasswordError] = useState("");

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setEmailStatus("loading");
    setEmailError("");
    setEmailResult(null);

    try {
      const res = await scannerApi.checkBreach(email);
      setEmailResult(res);
      setEmailStatus("success");
    } catch (err: any) {
      console.error(err);
      setEmailStatus("error");
      setEmailError(err.message || "We couldn't complete this check right now. Please try again in a few minutes.");
    }
  };

  const handlePasswordCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setPasswordStatus("loading");
    setPasswordError("");
    setPasswordResult(null);

    try {
      // Use crypto.subtle for SHA-1 hashing in browser
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-1", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      
      const prefix = hashHex.substring(0, 5);
      const suffix = hashHex.substring(5);

      // K-Anonymity check
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (!res.ok) throw new Error("Unable to contact breach database.");
      
      const text = await res.text();
      const lines = text.split("\n");
      
      let count = 0;
      for (const line of lines) {
        const [hashSuffix, countStr] = line.split(":");
        if (hashSuffix && hashSuffix.trim() === suffix) {
          count = parseInt(countStr.trim(), 10);
          break;
        }
      }

      setPasswordResult(count);
      setPasswordStatus("success");
    } catch (err: any) {
      console.error(err);
      setPasswordStatus("error");
      setPasswordError(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center space-x-4 mb-8">
        <Link 
          href="/scan" 
          className="p-2 rounded-lg bg-[#12121A] border border-[rgba(255,255,255,0.05)] text-[#B6B8C4] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#F8F8FA]">Breach Check</h1>
          <p className="text-sm text-[#B6B8C4] mt-1">Check if your email or password has been exposed in a known data breach.</p>
        </div>
      </div>

      <div className="flex p-1 bg-[#12121A] rounded-xl border border-[rgba(255,255,255,0.05)] w-fit mb-2">
        <button
          onClick={() => setActiveTab("email")}
          className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "email" ? "bg-[#2A2A35] text-white shadow-sm" : "text-[#B6B8C4]/70 hover:text-white"}`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Check</span>
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "password" ? "bg-[#2A2A35] text-white shadow-sm" : "text-[#B6B8C4]/70 hover:text-white"}`}
        >
          <Key className="w-4 h-4" />
          <span>Password Check</span>
        </button>
      </div>

      <motion.div 
        className="bg-[#0D0D12]/80 border border-[rgba(255,255,255,0.05)] rounded-2xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {activeTab === "email" ? (
          <form onSubmit={handleEmailCheck} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#B6B8C4] mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-[#B6B8C4]/50" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citizen@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#12121A] border border-[rgba(255,255,255,0.1)] rounded-xl text-white placeholder-[#B6B8C4]/40 focus:outline-none focus:ring-2 focus:ring-[#EC9AA3]/50 focus:border-transparent transition-all"
                />
              </div>
              <p className="mt-2 text-xs text-[#B6B8C4]/60">
                We do not store your email after this check completes. We only store a secure hash for audit purposes.
              </p>
            </div>

            <button
              type="submit"
              disabled={emailStatus === "loading" || !email}
              className="w-full sm:w-auto px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
            >
              {emailStatus === "loading" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <span>Check Email</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordCheck} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#B6B8C4] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="w-5 h-5 text-[#B6B8C4]/50" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a password to check"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#12121A] border border-[rgba(255,255,255,0.1)] rounded-xl text-white placeholder-[#B6B8C4]/40 focus:outline-none focus:ring-2 focus:ring-[#EC9AA3]/50 focus:border-transparent transition-all"
                />
              </div>
              <p className="mt-2 text-xs text-[#B6B8C4]/60">
                Your password never leaves your browser. We securely hash it locally and only check a 5-character fragment (k-anonymity) against known leak databases.
              </p>
            </div>

            <button
              type="submit"
              disabled={passwordStatus === "loading" || !password}
              className="w-full sm:w-auto px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
            >
              {passwordStatus === "loading" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <span>Check Password</span>
              )}
            </button>
          </form>
        )}
      </motion.div>

      {/* ─── EMAIL STATES ──────────────────────────────────────────────────────── */}
      {activeTab === "email" && (
        <>
          {emailStatus === "loading" && (
            <motion.div 
              className="bg-[#0D0D12]/80 border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 flex flex-col items-center justify-center space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="w-8 h-8 text-[#EC9AA3] animate-spin" />
              <p className="text-[#B6B8C4]">Checking against known breach databases…</p>
            </motion.div>
          )}

          {emailStatus === "error" && (
            <motion.div 
              className="bg-[#1A1616] border border-[#EC9AA3]/20 rounded-2xl p-6 flex items-start space-x-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-2 bg-[#EC9AA3]/10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-[#EC9AA3]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#F8F8FA]">Check Failed</h3>
                <p className="text-[#B6B8C4] mt-1">{emailError}</p>
              </div>
            </motion.div>
          )}

          {emailStatus === "success" && emailResult && emailResult.breach_count === 0 && (
            <motion.div 
              className="bg-[#0A1F16] border border-[#22C55E]/20 rounded-2xl p-6 flex flex-col items-center text-center space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 bg-[#22C55E]/10 rounded-full">
                <ShieldCheck className="w-10 h-10 text-[#22C55E]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#F8F8FA]">Good News</h3>
                <p className="text-[#B6B8C4] mt-2">No known breaches found for <span className="font-medium text-white">{emailResult.email_checked}</span>.</p>
                <p className="text-xs text-[#B6B8C4]/60 mt-3 max-w-md mx-auto">
                  This means we found no record in current breach databases — it does not guarantee your email was never exposed, but it is a very good sign.
                </p>
              </div>
            </motion.div>
          )}

          {emailStatus === "success" && emailResult && emailResult.breach_count > 0 && (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-[#2A1111] border border-[#EF4444]/30 rounded-2xl p-6 flex items-start space-x-4">
                <div className="p-3 bg-[#EF4444]/20 rounded-xl shrink-0">
                  <ShieldAlert className="w-8 h-8 text-[#EF4444]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#F8F8FA]">Exposure Found</h3>
                  <p className="text-[#B6B8C4] mt-1">
                    Your email <span className="font-medium text-white">{emailResult.email_checked}</span> appeared in <span className="text-[#EF4444] font-bold">{emailResult.breach_count}</span> known data breaches.
                  </p>
                  <div className="mt-4 p-4 bg-[#12121A] border border-[rgba(255,255,255,0.05)] rounded-xl inline-block">
                    <p className="text-sm font-medium text-white">Recommended Actions:</p>
                    <ul className="text-sm text-[#B6B8C4] mt-2 list-disc list-inside space-y-1">
                      <li>Change your password for the affected services immediately.</li>
                      <li>Enable Two-Factor Authentication (2FA) wherever possible.</li>
                      <li>Do not reuse the exposed password on other accounts.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-[#F8F8FA] px-1">Breach Details</h4>
                {emailResult.breaches.map((breach, idx) => (
                  <div key={idx} className="bg-[#0D0D12]/80 border border-[rgba(255,255,255,0.05)] rounded-2xl p-5 hover:border-[rgba(255,255,255,0.1)] transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <h5 className="text-lg font-bold text-white">{breach.name}</h5>
                        <div className="flex items-center space-x-3 text-xs text-[#B6B8C4] mt-1">
                          <span>Breached: {breach.breach_date}</span>
                          <span className="w-1 h-1 bg-[#B6B8C4]/30 rounded-full"></span>
                          <span>Added: {breach.added_date}</span>
                        </div>
                      </div>
                      {breach.is_verified && (
                        <span className="mt-2 md:mt-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 self-start">
                          Verified Breach
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-[#B6B8C4] mb-4 leading-relaxed" dangerouslySetInnerHTML={{__html: breach.description}}></p>
                    
                    <div>
                      <h6 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-2">Exposed Data</h6>
                      <div className="flex flex-wrap gap-2">
                        {breach.data_classes.map((dc, i) => (
                          <span key={i} className="px-2.5 py-1 bg-[#12121A] border border-[rgba(255,255,255,0.1)] text-xs text-[#F8F8FA] rounded-md">
                            {dc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ─── PASSWORD STATES ──────────────────────────────────────────────────────── */}
      {activeTab === "password" && (
        <>
          {passwordStatus === "loading" && (
            <motion.div 
              className="bg-[#0D0D12]/80 border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 flex flex-col items-center justify-center space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="w-8 h-8 text-[#EC9AA3] animate-spin" />
              <p className="text-[#B6B8C4]">Hashing and checking password safely…</p>
            </motion.div>
          )}

          {passwordStatus === "error" && (
            <motion.div 
              className="bg-[#1A1616] border border-[#EC9AA3]/20 rounded-2xl p-6 flex items-start space-x-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-2 bg-[#EC9AA3]/10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-[#EC9AA3]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#F8F8FA]">Check Failed</h3>
                <p className="text-[#B6B8C4] mt-1">{passwordError}</p>
              </div>
            </motion.div>
          )}

          {passwordStatus === "success" && passwordResult === 0 && (
            <motion.div 
              className="bg-[#0A1F16] border border-[#22C55E]/20 rounded-2xl p-6 flex flex-col items-center text-center space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 bg-[#22C55E]/10 rounded-full">
                <ShieldCheck className="w-10 h-10 text-[#22C55E]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#F8F8FA]">Excellent News</h3>
                <p className="text-[#B6B8C4] mt-2">This password has <span className="font-medium text-white">not been found</span> in any known breaches.</p>
                <p className="text-xs text-[#B6B8C4]/60 mt-3 max-w-md mx-auto">
                  It is safe to use, provided it's long enough and you don't reuse it across multiple critical services.
                </p>
              </div>
            </motion.div>
          )}

          {passwordStatus === "success" && passwordResult !== null && passwordResult > 0 && (
            <motion.div 
              className="bg-[#2A1111] border border-[#EF4444]/30 rounded-2xl p-6 flex items-start space-x-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-3 bg-[#EF4444]/20 rounded-xl shrink-0">
                <ShieldAlert className="w-8 h-8 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#F8F8FA]">Compromised Password</h3>
                <p className="text-[#B6B8C4] mt-1">
                  This exact password has been seen <span className="text-[#EF4444] font-bold">{passwordResult.toLocaleString()}</span> times in known data breaches.
                </p>
                <div className="mt-4 p-4 bg-[#12121A] border border-[rgba(255,255,255,0.05)] rounded-xl inline-block">
                  <p className="text-sm font-medium text-white">Recommended Actions:</p>
                  <ul className="text-sm text-[#B6B8C4] mt-2 list-disc list-inside space-y-1">
                    <li><strong>Do not use this password</strong> for any account.</li>
                    <li>If you currently use it anywhere, change it immediately.</li>
                    <li>Consider using a Password Manager to generate strong, unique passwords.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
