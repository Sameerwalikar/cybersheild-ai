"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

type Tab = "profile" | "security" | "notifications" | "appearance" | "privacy";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <ProfileIcon /> },
  { id: "security", label: "Security", icon: <ShieldIcon /> },
  { id: "notifications", label: "Notifications", icon: <BellIcon /> },
  { id: "appearance", label: "Appearance", icon: <PaletteIcon /> },
  { id: "privacy", label: "Privacy", icon: <LockIcon /> },
];

export function SettingsPage({ role }: { role: "citizen" | "police" }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get("tab") as Tab) || "profile");
  const [saved, setSaved] = useState(false);

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Settings</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">Manage your account, security and preferences.</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="sm:w-52 flex-shrink-0">
          <div className="rounded-xl border border-[rgba(236,154,163,0.07)] bg-[#0D0D14]/80 p-1.5 space-y-0.5">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 ${activeTab === tab.id ? "bg-[rgba(236,154,163,0.1)] text-[#F8F8FA] border border-[rgba(236,154,163,0.15)]" : "text-[#B6B8C4] hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.04)]"}`}
              >
                <span className={activeTab === tab.id ? "text-[#EC9AA3]" : "text-[#B6B8C4]/60"}>{tab.icon}</span>
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
            <div className="pt-2 border-t border-[rgba(236,154,163,0.06)] mt-1">
              <button onClick={() => { logout(); router.push("/select-role"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-red-500/8 group transition-colors duration-150">
                <span className="text-red-400/60 group-hover:text-red-400 transition-colors"><LogoutIcon /></span>
                <span className="text-xs font-medium text-red-400/80 group-hover:text-red-400">Sign out</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
              {activeTab === "profile" && <ProfileTab user={user} onSave={showSaved} />}
              {activeTab === "security" && <SecurityTab onSave={showSaved} />}
              {activeTab === "notifications" && <NotificationsTab onSave={showSaved} />}
              {activeTab === "appearance" && <AppearanceTab onSave={showSaved} />}
              {activeTab === "privacy" && <PrivacyTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-sm font-medium shadow-xl z-50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            Settings saved
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Profile Tab ────────────────────────────────────────────────────────────
function ProfileTab({ user, onSave }: { user: any; onSave: () => void }) {
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  return (
    <Card title="Profile Information" description="Update your personal details.">
      <div className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center shadow-[0_4px_16px_rgba(236,154,163,0.25)]">
            <span className="text-xl font-bold text-[#050508]">{name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "U"}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F8F8FA]">{name || "User"}</p>
            <p className="text-xs text-[#B6B8C4]">{email}</p>
            <p className="text-[10px] text-[#B6B8C4]/40 mt-0.5">Avatar auto-generated from name initials</p>
          </div>
        </div>
        <Divider />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" value={name} onChange={setName} placeholder="Your full name" />
          <Field label="Email Address" value={email} onChange={() => {}} placeholder="" disabled note="Email cannot be changed" />
          <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
          <Field label="Location" value={location} onChange={setLocation} placeholder="City, State" />
        </div>
        <Field label="Bio" value={bio} onChange={setBio} placeholder="Brief description about yourself…" multiline />
        <div className="flex justify-end">
          <SaveButton onClick={onSave} />
        </div>
      </div>
    </Card>
  );
}

// ── Security Tab ───────────────────────────────────────────────────────────
function SecurityTab({ onSave }: { onSave: () => void }) {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [twoFa, setTwoFa] = useState(false);
  const match = newPwd && confirm && newPwd === confirm;
  const mismatch = newPwd && confirm && newPwd !== confirm;

  return (
    <div className="space-y-4">
      <Card title="Change Password" description="Use a strong password you don't use elsewhere.">
        <div className="space-y-4">
          <Field label="Current Password" value={current} onChange={setCurrent} type="password" placeholder="••••••••" />
          <Field label="New Password" value={newPwd} onChange={setNewPwd} type="password" placeholder="••••••••" />
          <Field label="Confirm New Password" value={confirm} onChange={setConfirm} type="password" placeholder="••••••••"
            error={mismatch ? "Passwords do not match" : undefined}
            success={match ? "Passwords match" : undefined} />
          <div className="flex justify-end">
            <SaveButton label="Update Password" onClick={onSave} disabled={!current || !match} />
          </div>
        </div>
      </Card>

      <Card title="Two-Factor Authentication" description="Add an extra layer of security to your account.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#F8F8FA] font-medium">Authenticator App</p>
            <p className="text-xs text-[#B6B8C4] mt-0.5">Use an app like Google Authenticator or Authy.</p>
          </div>
          <Toggle value={twoFa} onChange={setTwoFa} />
        </div>
        {twoFa && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-[rgba(236,154,163,0.04)] border border-[rgba(236,154,163,0.1)]">
            <p className="text-xs text-[#B6B8C4]">2FA setup would be completed here in production via QR code pairing.</p>
          </div>
        )}
      </Card>

      <Card title="Active Sessions" description="Sign out of sessions you don't recognize.">
        {[{ device: "Chrome on Windows", location: "India", current: true }, { device: "Mobile App", location: "India", current: false }].map((s, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-[rgba(236,154,163,0.05)] last:border-0">
            <div>
              <p className="text-xs font-medium text-[#F8F8FA]">{s.device}</p>
              <p className="text-[10px] text-[#B6B8C4]/60">{s.location} {s.current && "· Current session"}</p>
            </div>
            {!s.current && <button className="text-[10px] text-red-400 hover:text-red-300 transition-colors">Revoke</button>}
            {s.current && <span className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Notifications Tab ──────────────────────────────────────────────────────
function NotificationsTab({ onSave }: { onSave: () => void }) {
  const [prefs, setPrefs] = useState({ threatAlert: true, scanComplete: true, reportUpdate: true, weekly: false, tips: true });
  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <Card title="Notification Preferences" description="Choose what you want to be notified about.">
      <div className="space-y-1">
        {[
          { key: "threatAlert", label: "Threat Alerts", desc: "Immediate alerts when high-risk content is detected" },
          { key: "scanComplete", label: "Scan Complete", desc: "Notification when your scan finishes" },
          { key: "reportUpdate", label: "Report Updates", desc: "Status changes on your submitted reports" },
          { key: "tips", label: "Security Tips", desc: "Periodic tips to stay safe online" },
          { key: "weekly", label: "Weekly Summary", desc: "Weekly digest of your security activity" },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3.5 border-b border-[rgba(236,154,163,0.05)] last:border-0">
            <div>
              <p className="text-sm font-medium text-[#F8F8FA]">{label}</p>
              <p className="text-[11px] text-[#B6B8C4]/60 mt-0.5">{desc}</p>
            </div>
            <Toggle value={prefs[key as keyof typeof prefs]} onChange={() => toggle(key as keyof typeof prefs)} />
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <SaveButton onClick={onSave} />
      </div>
    </Card>
  );
}

// ── Appearance Tab ─────────────────────────────────────────────────────────
function AppearanceTab({ onSave }: { onSave: () => void }) {
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [animations, setAnimations] = useState(true);

  return (
    <Card title="Appearance" description="Customize how CyberShield looks for you.">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Theme</p>
          <div className="flex gap-3">
            {["Dark"].map((t) => (
              <button key={t} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[rgba(236,154,163,0.2)] bg-[rgba(236,154,163,0.05)] text-xs font-medium text-[#EC9AA3]">
                <span className="w-3 h-3 rounded-full bg-[#050508] border border-[rgba(236,154,163,0.3)]" />{t} (Default)
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#B6B8C4]/40 mt-2">Light and system themes coming soon.</p>
        </div>
        <Divider />
        <div>
          <p className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Density</p>
          <div className="flex gap-2">
            {(["comfortable", "compact"] as const).map((d) => (
              <button key={d} onClick={() => setDensity(d)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize ${density === d ? "bg-[rgba(236,154,163,0.1)] text-[#EC9AA3] border border-[rgba(236,154,163,0.2)]" : "text-[#B6B8C4] border border-transparent hover:bg-[rgba(236,154,163,0.04)]"}`}>{d}</button>
            ))}
          </div>
        </div>
        <Divider />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#F8F8FA]">Reduce Motion</p>
            <p className="text-[11px] text-[#B6B8C4]/60">Disable animations for accessibility</p>
          </div>
          <Toggle value={!animations} onChange={() => setAnimations((v) => !v)} />
        </div>
        <div className="flex justify-end">
          <SaveButton onClick={onSave} />
        </div>
      </div>
    </Card>
  );
}

// ── Privacy Tab ────────────────────────────────────────────────────────────
function PrivacyTab() {
  return (
    <div className="space-y-4">
      <Card title="Data & Privacy" description="Control how your data is used.">
        <div className="space-y-3">
          {[
            { label: "Scan History", desc: "Your scan results are stored for dashboard analytics.", action: "Manage" },
            { label: "Evidence Uploads", desc: "Uploaded evidence is analyzed and stored securely.", action: "View" },
            { label: "AI Training Data", desc: "We never use your data to train external AI models.", action: null },
          ].map(({ label, desc, action }) => (
            <div key={label} className="flex items-start justify-between gap-4 py-3 border-b border-[rgba(236,154,163,0.05)] last:border-0">
              <div>
                <p className="text-sm font-medium text-[#F8F8FA]">{label}</p>
                <p className="text-[11px] text-[#B6B8C4]/60 mt-0.5">{desc}</p>
              </div>
              {action && <button className="text-[11px] text-[#EC9AA3] hover:text-[#F8F8FA] transition-colors whitespace-nowrap flex-shrink-0">{action} →</button>}
            </div>
          ))}
        </div>
      </Card>
      <Card title="Danger Zone" description="Irreversible actions — proceed with caution.">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl border border-red-500/15 bg-red-500/5">
            <div>
              <p className="text-sm font-medium text-[#F8F8FA]">Delete Account</p>
              <p className="text-[11px] text-[#B6B8C4]/60">Permanently delete your account and all data.</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors">Delete</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────
function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[rgba(236,154,163,0.07)] bg-[#0D0D14]/80 p-5">
      <div className="mb-5">
        <h2 className="text-sm font-bold text-[#F8F8FA]">{title}</h2>
        <p className="text-[11px] text-[#B6B8C4]/60 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", multiline = false, disabled = false, note, error, success }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  type?: string; multiline?: boolean; disabled?: boolean; note?: string; error?: string; success?: string;
}) {
  const base = "w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#0A0A10] border text-[#F8F8FA] placeholder:text-[#B6B8C4]/30 outline-none transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed";
  const borderClass = error ? "border-red-500/40 focus:border-red-500/60" : success ? "border-emerald-500/40 focus:border-emerald-500/60" : "border-[rgba(236,154,163,0.1)] focus:border-[rgba(236,154,163,0.35)] focus:shadow-[0_0_0_3px_rgba(236,154,163,0.06)]";

  return (
    <div>
      <label className="block text-[11px] font-semibold text-[#B6B8C4] uppercase tracking-wider mb-1.5">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className={`${base} ${borderClass} resize-none`} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
          className={`${base} ${borderClass}`} />
      )}
      {note && <p className="text-[10px] text-[#B6B8C4]/40 mt-1">{note}</p>}
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
      {success && <p className="text-[10px] text-emerald-400 mt-1">{success}</p>}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} role="switch" aria-checked={value}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? "bg-[#EC9AA3]" : "bg-[#1a1a24]"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function SaveButton({ label = "Save Changes", onClick, disabled = false }: { label?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#050508] bg-[#EC9AA3] hover:bg-[#f3b3ba] hover:shadow-[0_4px_16px_rgba(236,154,163,0.25)] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150">
      {label}
    </button>
  );
}

function Divider() { return <div className="border-t border-[rgba(236,154,163,0.06)]" />; }

function ProfileIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function ShieldIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>; }
function BellIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function PaletteIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="13.5" r="1.5"/><circle cx="15" cy="9.5" r="1.5"/><circle cx="15" cy="15" r="1.5"/></svg>; }
function LockIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function LogoutIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
