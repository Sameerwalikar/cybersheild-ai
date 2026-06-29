"use client";

import { useState } from "react";
import { ScannerLayout, ScanButton } from "@/components/scanner";

export default function WebsiteScannerPage() {
  const [url, setUrl] = useState("");
  const isValid = /^https?:\/\/.+\..+/.test(url);

  return (
    <ScannerLayout
      title="Scan Website"
      description="Enter a URL to check for malicious content, phishing pages, or unsafe redirects."
      helpTips={[
        "Always check if the URL uses HTTPS.",
        "Beware of look-alike domains (e.g., g00gle.com).",
        "Shortened URLs can hide malicious destinations.",
        "Check domain age — new domains are often suspicious.",
      ]}
    >
      <div className="space-y-4">
        {/* URL input */}
        <div>
          <label htmlFor="url-input" className="block text-xs font-medium text-[#B6B8C4] mb-1.5">
            Website URL
          </label>
          <input
            id="url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.12)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.4)] focus:shadow-[0_0_0_3px_rgba(236,154,163,0.08)] transition-all duration-200"
            aria-describedby="url-hint"
          />
          <p id="url-hint" className="text-[10px] text-[#B6B8C4]/50 mt-1.5">
            Enter the full URL including https://
          </p>
          {url.length > 0 && !isValid && (
            <p className="text-[10px] text-red-400 mt-1">Please enter a valid URL starting with http:// or https://</p>
          )}
        </div>

        <ScanButton label="Analyze URL" disabled={!isValid} />
      </div>
    </ScannerLayout>
  );
}
