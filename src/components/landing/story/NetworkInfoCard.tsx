"use client";

const networkNodes = [
  { label: "Phone Number", sublabel: "+91 98XXX XXXXX", type: "origin" },
  { label: "UPI ID", sublabel: "fraud@ybl", type: "connected" },
  { label: "Website", sublabel: "sbi-verify.xyz", type: "connected" },
  { label: "Device", sublabel: "Android • Mumbai", type: "connected" },
  { label: "Victim", sublabel: "3 reports filed", type: "threat" },
  { label: "Police", sublabel: "Case FR-2024-00142", type: "resolved" },
];

const typeStyles: Record<string, { dot: string; text: string }> = {
  origin: { dot: "bg-[#EC9AA3]", text: "text-[#F3B3BA]" },
  connected: { dot: "bg-[#EC9AA3]/60", text: "text-[#F8F8FA]" },
  threat: { dot: "bg-red-400", text: "text-red-300" },
  resolved: { dot: "bg-emerald-400", text: "text-emerald-300" },
};

export function NetworkInfoCard() {
  return (
    <div
      className="relative w-full max-w-sm rounded-2xl
                 bg-[#12121A]/70 backdrop-blur-md
                 border border-[rgba(236,154,163,0.18)]
                 shadow-[0_8px_30px_rgba(0,0,0,0.3)]
                 p-6"
      role="figure"
      aria-label="Example fraud network showing connected entities discovered by CyberShield AI"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-[#EC9AA3] animate-pulse" />
        <span className="text-xs font-medium text-[#B6B8C4] uppercase tracking-wider">
          Live Network Discovery
        </span>
      </div>

      <div className="space-y-0">
        {networkNodes.map((node, i) => {
          const style = typeStyles[node.type];
          const isLast = i === networkNodes.length - 1;

          return (
            <div key={node.label} className="relative flex items-start gap-3">
              {!isLast && (
                <div className="absolute left-[7px] top-[18px] w-px h-[calc(100%-2px)] bg-[rgba(236,154,163,0.12)]" />
              )}

              <div className={`relative z-10 mt-1.5 w-[14px] h-[14px] rounded-full border-2 border-[#12121A] ${style.dot} shadow-sm flex-shrink-0`} />

              <div className="pb-4">
                <p className={`text-sm font-medium ${style.text}`}>{node.label}</p>
                <p className="text-xs text-[#B6B8C4]/70 mt-0.5">{node.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-8 rounded-b-2xl bg-gradient-to-t from-[#12121A]/80 to-transparent pointer-events-none" />
    </div>
  );
}
