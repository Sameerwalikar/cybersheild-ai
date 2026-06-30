"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { graphApi, type GraphNodeData, type GraphNetwork, type GraphStats } from "@/services/api/graph";

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const riskColors: Record<string, string> = { safe: "bg-emerald-400", low: "bg-emerald-300", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };
const typeIcons: Record<string, string> = { phone: "📞", email: "✉️", upi: "💳", domain: "🌐", url: "🔗", ip: "🖥️", bank_account: "🏦", qr_content: "📱" };

export default function NetworkPage() {
  const router = useRouter();
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [topEntities, setTopEntities] = useState<GraphNodeData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GraphNodeData[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<GraphNetwork | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const [s, top] = await Promise.all([graphApi.getStats(), graphApi.getTopEntities(15)]);
        setStats(s);
        setTopEntities(top);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    }
    load();
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
      const network = await graphApi.getNetwork(node.id);
      setSelectedNetwork(network);
    } catch {}
  }, []);

  if (error) {
    return <div className="flex items-center justify-center h-64"><p className="text-sm text-red-400">{error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <h1 className="text-xl font-bold text-[#F8F8FA]">Fraud Intelligence Graph</h1>
        <p className="mt-1 text-sm text-[#B6B8C4]">Explore connected fraud entities and relationships.</p>
      </motion.div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] text-center">
            <p className="text-xl font-bold text-[#F8F8FA] tabular-nums">{stats.nodeCount}</p>
            <p className="text-[9px] text-[#B6B8C4] uppercase">Entities</p>
          </div>
          <div className="px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] text-center">
            <p className="text-xl font-bold text-[#F8F8FA] tabular-nums">{stats.edgeCount}</p>
            <p className="text-[9px] text-[#B6B8C4] uppercase">Connections</p>
          </div>
          <div className="px-4 py-3 rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.06)] text-center">
            <p className="text-xl font-bold text-red-400 tabular-nums">{stats.highRiskNodes}</p>
            <p className="text-[9px] text-[#B6B8C4] uppercase">High Risk</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2.5 rounded-xl text-xs text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.1)] focus:outline-none">
          <option value="all">All Types</option>
          <option value="phone">Phone</option>
          <option value="email">Email</option>
          <option value="upi">UPI</option>
          <option value="domain">Domain</option>
          <option value="url">URL</option>
          <option value="ip">IP</option>
        </select>
        <div className="relative flex-1 max-w-md">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search phone, UPI, domain, email..."
            className="w-full pl-4 pr-3 py-2.5 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.1)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-colors"
          />
        </div>
        <button onClick={handleSearch} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#050508] bg-[#EC9AA3] hover:shadow-[0_4px_12px_rgba(236,154,163,0.2)] active:scale-[0.97] transition-all">
          Search
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)] p-4 space-y-2">
          <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider">Search Results</h3>
          {searchResults.map((node) => (
            <button key={node.id} onClick={() => expandNode(node)} className="w-full text-left px-3 py-2.5 rounded-lg bg-[#12121A]/50 border border-[rgba(236,154,163,0.04)] hover:border-[rgba(236,154,163,0.15)] transition-colors flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{typeIcons[node.type] || "📎"}</span>
                <div>
                  <p className="text-xs text-[#F8F8FA] font-mono">{node.value}</p>
                  <p className="text-[9px] text-[#B6B8C4] uppercase">{node.type} • {node.occurrences} occurrences</p>
                </div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${riskColors[node.riskLevel] || "bg-[#B6B8C4]"}`} />
            </button>
          ))}
        </div>
      )}

      {/* Network Visualization */}
      {selectedNetwork && selectedNode && (
        <div className="rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider">
              Network for: <span className="text-[#EC9AA3] font-mono">{selectedNode.value}</span>
            </h3>
            <span className="text-[9px] text-[#B6B8C4]">{selectedNetwork.nodes.length} nodes, {selectedNetwork.edges.length} edges</span>
          </div>

          {/* Simple node list visualization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
            {selectedNetwork.nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => expandNode(node)}
                className={`px-3 py-2 rounded-lg border text-left transition-all ${node.id === selectedNode.id ? "border-[#EC9AA3] bg-[rgba(236,154,163,0.06)]" : "border-[rgba(236,154,163,0.04)] bg-[#12121A]/30 hover:border-[rgba(236,154,163,0.12)]"}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${riskColors[node.riskLevel] || "bg-[#B6B8C4]"}`} />
                  <span className="text-[10px] text-[#F8F8FA] font-mono truncate">{node.value}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 pl-4">
                  <span className="text-[8px] text-[#B6B8C4] uppercase">{node.type}</span>
                  <span className="text-[8px] text-[#B6B8C4]">×{node.occurrences}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Edge list */}
          {selectedNetwork.edges.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[rgba(236,154,163,0.06)]">
              <h4 className="text-[9px] font-bold text-[#B6B8C4] uppercase tracking-wider mb-2">Connections ({selectedNetwork.edges.length})</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedNetwork.edges.slice(0, 30).map((edge) => (
                  <span key={edge.id} className="px-2 py-0.5 rounded text-[8px] text-[#B6B8C4] bg-[#12121A] border border-[rgba(236,154,163,0.04)]">
                    {edge.type.replace("_", " ")} (×{edge.weight})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Entities */}
      {topEntities.length > 0 && (
        <div className="rounded-xl bg-[#0D0D12]/80 border border-[rgba(236,154,163,0.08)] p-5">
          <h3 className="text-xs font-semibold text-[#B6B8C4] uppercase tracking-wider mb-3">Most Connected Entities</h3>
          <div className="space-y-2">
            {topEntities.filter((n) => typeFilter === "all" || n.type === typeFilter).map((node) => (
              <button key={node.id} onClick={() => expandNode(node)} className="w-full text-left px-3 py-2 rounded-lg bg-[#12121A]/40 hover:bg-[rgba(236,154,163,0.03)] transition-colors flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{typeIcons[node.type] || "📎"}</span>
                  <div>
                    <p className="text-[11px] text-[#F8F8FA] font-mono">{node.value}</p>
                    <p className="text-[9px] text-[#B6B8C4] uppercase">{node.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#F8F8FA] tabular-nums">{node.occurrences}</span>
                  <div className={`w-2 h-2 rounded-full ${riskColors[node.riskLevel] || "bg-[#B6B8C4]"}`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
