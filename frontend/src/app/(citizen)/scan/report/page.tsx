"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScannerLayout, ScanButton } from "@/components/scanner";
import { reportsApi } from "@/services/api/reports";

const scamTypes = [
  "Phishing",
  "Financial Fraud",
  "Identity Theft",
  "Vishing (Voice Scam)",
  "UPI Fraud",
  "Other",
];

export default function ReportScamPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Optional fields
  const [scammerPhone, setScammerPhone] = useState("");
  const [scammerEmail, setScammerEmail] = useState("");
  const [scammerUpi, setScammerUpi] = useState("");
  const [lossAmount, setLossAmount] = useState("");

  const isValid = category.length > 0 && description.length >= 10;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []).slice(0, 3 - files.length);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 3));
  };

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const scammerContact: any = {};
      if (scammerPhone) scammerContact.phone = scammerPhone;
      if (scammerEmail) scammerContact.email = scammerEmail;
      if (scammerUpi) scammerContact.upiId = scammerUpi;

      const financialLoss: any = {};
      if (lossAmount) {
        financialLoss.amount = parseFloat(lossAmount);
        financialLoss.currency = "INR";
      }

      const result = await reportsApi.create({
        type: category,
        description,
        ...(Object.keys(scammerContact).length > 0 ? { scammerContact } : {}),
        ...(Object.keys(financialLoss).length > 0 ? { financialLoss } : {}),
        evidence: files.map((f) => f.name),
      });

      setSuccess(`Report ${result.reportNumber} submitted successfully! You can track it in the Reports section.`);
      // Reset form
      setCategory("");
      setDescription("");
      setFiles([]);
      setScammerPhone("");
      setScammerEmail("");
      setScammerUpi("");
      setLossAmount("");

      // Redirect after short delay
      setTimeout(() => router.push("/reports"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScannerLayout
      title="Report Scam"
      description="Submit a scam or fraud report to help protect the community."
      helpTips={[
        "Provide as much detail as possible.",
        "Include screenshots or evidence if available.",
        "Reports help protect other citizens from similar scams.",
        "You can track your report status in the Reports section.",
      ]}
    >
      <div className="space-y-5">
        {/* Success message */}
        {success && (
          <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
            {success}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-xs font-medium text-[#B6B8C4] mb-1.5">
            Scam Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.12)] focus:outline-none focus:border-[rgba(236,154,163,0.4)] focus:shadow-[0_0_0_3px_rgba(236,154,163,0.08)] transition-all duration-200 appearance-none"
            aria-label="Select scam category"
          >
            <option value="" disabled className="text-[#B6B8C4]">Select category</option>
            {scamTypes.map((type) => (
              <option key={type} value={type} className="bg-[#0D0D12] text-[#F8F8FA]">{type}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-xs font-medium text-[#B6B8C4] mb-1.5">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
            placeholder="Describe the scam in detail. What happened? How were you contacted?"
            className="w-full h-32 px-4 py-3 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.12)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.4)] focus:shadow-[0_0_0_3px_rgba(236,154,163,0.08)] transition-all duration-200 resize-none"
          />
          <span className="text-[10px] text-[#B6B8C4]/50 tabular-nums">{description.length}/2000</span>
        </div>

        {/* Scammer Contact (optional) */}
        <div>
          <label className="block text-xs font-medium text-[#B6B8C4] mb-1.5">
            Scammer Contact (optional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={scammerPhone}
              onChange={(e) => setScammerPhone(e.target.value)}
              placeholder="Phone number"
              className="px-3 py-2.5 rounded-lg text-xs text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.08)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-all"
            />
            <input
              type="email"
              value={scammerEmail}
              onChange={(e) => setScammerEmail(e.target.value)}
              placeholder="Email address"
              className="px-3 py-2.5 rounded-lg text-xs text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.08)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-all"
            />
            <input
              type="text"
              value={scammerUpi}
              onChange={(e) => setScammerUpi(e.target.value)}
              placeholder="UPI ID"
              className="px-3 py-2.5 rounded-lg text-xs text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.08)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-all"
            />
          </div>
        </div>

        {/* Financial Loss (optional) */}
        <div>
          <label htmlFor="loss" className="block text-xs font-medium text-[#B6B8C4] mb-1.5">
            Financial Loss (optional)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#B6B8C4]">₹</span>
            <input
              id="loss"
              type="number"
              value={lossAmount}
              onChange={(e) => setLossAmount(e.target.value)}
              placeholder="Amount lost"
              min="0"
              className="flex-1 px-3 py-2.5 rounded-lg text-xs text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.08)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-all"
            />
          </div>
        </div>

        {/* Evidence upload */}
        <div>
          <label className="block text-xs font-medium text-[#B6B8C4] mb-1.5">
            Evidence (optional)
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121A] border border-[rgba(236,154,163,0.08)] text-xs text-[#B6B8C4]">
                <span className="truncate max-w-[120px]">{f.name}</span>
                <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-[#EC9AA3] hover:text-red-400">×</button>
              </div>
            ))}
            {files.length < 3 && (
              <label className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#EC9AA3] border border-[rgba(236,154,163,0.15)] hover:bg-[rgba(236,154,163,0.04)] cursor-pointer transition-colors">
                + Add File
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
              </label>
            )}
          </div>
          <p className="text-[10px] text-[#B6B8C4]/50 mt-1">Max 3 files, 10MB each</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-[#EC9AA3] text-[#050508] hover:shadow-[0_4px_16px_rgba(236,154,163,0.2)] hover:-translate-y-0.5 active:scale-[0.98]"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </ScannerLayout>
  );
}
