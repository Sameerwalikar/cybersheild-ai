"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { graphApi, type GraphNodeData, type GraphNetwork, type GraphStats } from "@/services/api/graph";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const RISK_DOT: Record<string, string> = {
  safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400",
  high: "bg-orange-400", critical: "bg-red-400",
};
const RISK_TEXT: Record<string, string> = {
  safe: "text-emerald-400", low: "text-emerald-300", medium: "text-amber-400",
  high: "text-orange-400", critical: "text-red-400",
};
const TYPE_ICON: Record<string, string> = {
  phone: "📞", email: "✉️", upi: "💳", domain: "🌐",
  url: "🔗", ip: "🖥️", bank_account: "🏦", qr_content: "📱",
};
const TYPE_FILTERS = ["all","phone","email","upi","domain","url","ip"];

export default function NetworkPage() {
  const [stats, setStats]                     = useState<GraphStats | null>(null);
  const [topEntities, setTopEntities]         = useState<GraphNodeData[]>([]);
  const [searchQuery, setSearchQuery]         = useState("");
  const [searchResults, setSearchResults]     = useState<GraphNodeData[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<GraphNetwork | null>(null);
  const [selectedNode, setSelectedNode]       = useState<GraphNodeData | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [typeFilter, setTypeFilter]           = useState("all");

  useEffect(() => {
    Promise.all([graphApi.getStats(), graphApi.getTopEntities(15)])
      .then(([s, top]) => { setStats(s); setTopEntities(top); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = useCallback(async () => {
    if (searchQuery.length < 2) return;
    try {
      const results = await graphApi.search(searchQuery);
      setSearchResults(results);
    } catch {}
  }, [searchQuery]);

  const expandNode = useCallback(async (node: GraphNodeData) => {
    setSelectedNode(node);
    try {
      setSelectedNetwork(await graphApi.getNetwork(node.id));
    } catch {}
  }, []);

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-red-400">{error}</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}>
        <h1 className="text-2xl font-black text-[#F8F8FA] tracking-tight">Fraud Intelligence Graph</h1>
        <p className="mt-1 text-xs text-[#B6B8C4]/55 font-medium">
          Explore connected fraud entities and network relationships.
        </p>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease }}
          className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Graph Entities",   value: stats.nodeCount,     color: "text-[#F8F8FA]" },
            { label: "Connections",      value: stats.edgeCount,     color: "text-[#EC9AA3]" },
            { label: "High Risk Nodes",  value: stats.highRiskNodes, color: "text-red-400" },
          ].map(s => (
            <div key={s.label}
              className="px-4 py-4 rounded-2xl bg-[#0D0D14]/80 border border-[rgba(236,154,163,0.07)]
                hover:border-[rgba(236,154,163,0.16)] transition-[border-color] duration-200 text-center">
              <p className={`text-2xl font-black tabular-nums ${s.color}`}>
                {s.value.toLocaleString()}
              </p>
              <p className="text-[8px] text-[#B6B8C4]/50 uppercase tracking-[0.1em] mt-2">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Search + type filter */}
      <div className="flex gap-2">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-xs text-[#F8F8FA] bg-[#0D0D14]
            border border-[rgba(236,154,163,0.1)] focus:outline-none
            focus:border-[rgba(236,154,163,0.3)] transition-colors">
          {TYPE_FILTERS.map(t => (
            <option key={t} value={t}>{t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B6B8C4"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search phone, UPI, domain, email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D14]
              border border-[rgba(236,154,163,0.1)] placeholder:text-[#B6B8C4]/35
              focus:outline-none focus:border-[rgba(236,154,163,0.35)]
              focus:shadow-[0_0_0_3px_rgba(236,154,163,0.07)] transition-all" />
        </div>
        <button onClick={handleSearch}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#050508] bg-[#EC9AA3]
            hover:shadow-[0_4px_16px_rgba(236,154,163,0.25)] active:scale-[0.97] transition-all">
          Search
        </button>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease }}
          className="rounded-2xl bg-[#0D0D14]/85 border border-[rgba(236,154,163,0.08)] p-4">
          <h3 className="text-[10px] font-bold text-[#B6B8C4]/80 uppercase tracking-[0.08em] mb-3">
            Search Results ({searchResults.length})
          </h3>
          <div className="space-y-1.5">
            {searchResults.map(node => (
              <button key={node.id} onClick={() => expandNode(node)}
                className="w-full text-left px-3 py-2.5 rounded-xl
                  bg-white/[0.012] border border-[rgba(236,154,163,0.04)]
                  hover:border-[rgba(236,154,163,0.16)] transition-colors
                  flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{TYPE_ICON[node.type] ?? "📎"}</span>
                  <div>
                    <p className="text-xs text-[#F8F8FA] font-mono">{node.value}</p>
                    <p className="text-[8px] text-[#B6B8C4]/50 uppercase">
                      {node.type} · {node.occurrences} occurrences
                    </p>
                  </div>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${RISK_DOT[node.riskLevel] ?? "bg-[#B6B8C4]"}`} />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Network visualization */}
      {selectedNetwork && selectedNode && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="rounded-2xl bg-[#0D0D14]/85 border border-[rgba(236,154,163,0.08)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[10px] font-bold text-[#B6B8C4]/80 uppercase tracking-[0.08em]">
                Network for:
              </h3>
              <p className="text-sm font-mono text-[#EC9AA3] mt-0.5">{selectedNode.value}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-[#F8F8FA]">{selectedNetwork.nodes.length} nodes</p>
              <p className="text-[9px] text-[#B6B8C4]/50">{selectedNetwork.edges.length} connections</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
            {selectedNetwork.nodes.map(node => (
              <button key={node.id} onClick={() => expandNode(node)}
                className={`px-3 py-2.5 rounded-xl border text-left transition-all
                  ${node.id === selectedNode.id
                    ? "border-[rgba(236,154,163,0.25)] bg-[rgba(236,154,163,0.07)]"
                    : "border-[rgba(236,154,163,0.05)] bg-white/[0.012] hover:border-[rgba(236,154,163,0.15)]"
                  }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${RISK_DOT[node.riskLevel] ?? "bg-[#B6B8C4]"}`} />
                  <span className="text-[10px] text-[#F8F8FA] font-mono truncate">{node.value}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 pl-3.5">
                  <span className="text-[8px] text-[#B6B8C4]/50 uppercase">{node.type}</span>
                  <span className="text-[8px] text-[#B6B8C4]/35">×{node.occurrences}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedNetwork.edges.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[rgba(236,154,163,0.06)]">
              <p className="text-[9px] font-bold text-[#B6B8C4]/45 uppercase tracking-[0.1em] mb-2">
                Connections ({selectedNetwork.edges.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedNetwork.edges.slice(0, 30).map(edge => (
                  <span key={edge.id}
                    className="px-2 py-0.5 rounded-lg text-[8px] text-[#B6B8C4]/60
                      bg-[#12121A] border border-[rgba(236,154,163,0.05)]">
                    {edge.type.replace("_", " ")} (×{edge.weight})
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Top entities */}
      {topEntities.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease }}
          className="rounded-2xl bg-[#0D0D14]/85 border border-[rgba(236,154,163,0.07)] p-5">
          <h3 className="text-[10px] font-bold text-[#B6B8C4]/80 uppercase tracking-[0.08em] mb-3">
            Most Connected Entities
          </h3>
          <div className="space-y-1.5">
            {topEntities
              .filter(n => typeFilter === "all" || n.type === typeFilter)
              .map(node => (
                <button key={node.id} onClick={() => expandNode(node)}
                  className="w-full text-left px-3 py-2.5 rounded-xl
                    bg-white/[0.012] border border-[rgba(236,154,163,0.04)]
                    hover:border-[rgba(236,154,163,0.15)] transition-colors
                    flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{TYPE_ICON[node.type] ?? "📎"}</span>
                    <div>
                      <p className="text-[11px] text-[#F8F8FA] font-mono">{node.value}</p>
                      <p className="text-[8px] text-[#B6B8C4]/50 uppercase">{node.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-black tabular-nums ${RISK_TEXT[node.riskLevel] ?? "text-[#F8F8FA]"}`}>
                      {node.occurrences}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${RISK_DOT[node.riskLevel] ?? "bg-[#B6B8C4]"}`} />
                  </div>
                </button>
              ))}
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="space-y-2.5 animate-pulse">
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-2xl bg-[rgba(236,154,163,0.04)]" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-[rgba(236,154,163,0.03)]" />
        </div>
      )}
    </div>
  );
}
