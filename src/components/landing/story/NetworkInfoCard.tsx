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
  origin: { dot: "bg-indigo-500", text: "text-indigo-700" },
  connected: { dot: "bg-indigo-400", text: "text-slate-700" },
  threat: { dot: "bg-rose-500", text: "text-rose-700" },
  resolved: { dot: "bg-emerald-500", text: "text-emerald-700" },
};

export function NetworkInfoCard() {
  return (
    <div
      className="relative w-full max-w-sm rounded-2xl
                 bg-white/70 backdrop-blur-md
                 border border-slate-200/60
                 shadow-[0_8px_30px_rgba(0,0,0,0.04)]
                 p-6"
      role="figure"
      aria-label="Example fraud network showing connected entities discovered by CyberShield AI"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Live Network Discovery
        </span>
      </div>

      <div className="space-y-0">
        {networkNodes.map((node, i) => {
          const style = typeStyles[node.type];
          const isLast = i === networkNodes.length - 1;

          return (
            <div key={node.label} className="relative flex items-start gap-3">
              {/* Vertical connector line */}
              {!isLast && (
                <div className="absolute left-[7px] top-[18px] w-px h-[calc(100%-2px)] bg-slate-200" />
              )}

              {/* Dot */}
              <div className={`relative z-10 mt-1.5 w-[14px] h-[14px] rounded-full border-2 border-white ${style.dot} shadow-sm flex-shrink-0`} />

              {/* Content */}
              <div className="pb-4">
                <p className={`text-sm font-medium ${style.text}`}>{node.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{node.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 rounded-b-2xl bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
    </div>
  );
}
