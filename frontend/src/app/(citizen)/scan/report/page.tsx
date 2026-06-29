"use client";

import { useState } from "react";
import { ScannerLayout, ScanButton } from "@/components/scanner";

const scamTypes = [
  "Phishing",
  "Financial Fraud",
  "Identity Theft",
  "Vishing (Voice Scam)",
  "UPI Fraud",
  "Other",
];

export default function ReportScamPage() {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const isValid = category.length > 0 && description.length >= 10;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []).slice(0, 3 - files.length);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 3));
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

        <ScanButton label="Submit Report" disabled={!isValid} />
      </div>
    </ScannerLayout>
  );
}
