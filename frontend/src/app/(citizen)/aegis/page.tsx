"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { aegisApi, type ConversationSummary, type ChatMessage } from "@/services/api/aegis";

const SUGGESTIONS = [
  "Is this message dangerous?",
  "Explain phishing in simple words",
  "How can I protect my UPI account?",
  "Summarize my recent cyber activity",
  "What should I do after clicking a phishing link?",
];

export default function AegisPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    aegisApi.getConversations().then(setConversations).catch(() => {});
  }, []);

  // Load active conversation
  const loadConversation = useCallback(async (id: string) => {
    setActiveConvoId(id);
    try {
      const convo = await aegisApi.getConversation(id);
      setMessages(convo.messages);
    } catch {}
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    setInput("");
    setSending(true);

    // Optimistic user message
    const userMsg: ChatMessage = { role: "user", content: msg, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await aegisApi.chat(msg, activeConvoId || undefined);
      setActiveConvoId(res.conversationId);
      setMessages((prev) => [...prev, res.message]);

      // Refresh sidebar
      const convos = await aegisApi.getConversations();
      setConversations(convos);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: err.message || "Sorry, I encountered an error. Please try again.", timestamp: new Date().toISOString() }]);
    }

    setSending(false);
  };

  const handleNewChat = () => {
    setActiveConvoId(null);
    setMessages([]);
  };

  const handleDelete = async (id: string) => {
    await aegisApi.deleteConversation(id).catch(() => {});
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvoId === id) handleNewChat();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-[rgba(236,154,163,0.06)] bg-[#0D0D12]/50">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            className="w-64 border-r border-[rgba(236,154,163,0.06)] flex flex-col bg-[#0D0D12]/80"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 border-b border-[rgba(236,154,163,0.06)]">
              <button onClick={handleNewChat} className="w-full px-3 py-2 rounded-lg text-xs font-medium text-[#EC9AA3] border border-[rgba(236,154,163,0.15)] hover:bg-[rgba(236,154,163,0.04)] transition-colors">
                + New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
              {conversations.map((c) => (
                <div key={c.id} className={`group flex items-center rounded-lg px-3 py-2 cursor-pointer transition-colors ${activeConvoId === c.id ? "bg-[rgba(236,154,163,0.08)]" : "hover:bg-[rgba(236,154,163,0.03)]"}`}>
                  <button onClick={() => loadConversation(c.id)} className="flex-1 text-left min-w-0">
                    <p className="text-[11px] font-medium text-[#F8F8FA] truncate">{c.title}</p>
                    <p className="text-[9px] text-[#B6B8C4]/50 truncate">{c.lastMessage}</p>
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 ml-1 w-5 h-5 rounded flex items-center justify-center text-[#B6B8C4]/50 hover:text-red-400 transition-all text-[10px]">×</button>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(236,154,163,0.06)]">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#B6B8C4] hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.04)] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center">
              <span className="text-[8px] font-bold text-[#050508]">A</span>
            </div>
            <span className="text-xs font-semibold text-[#F8F8FA]">AEGIS</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center">
                <span className="text-xl font-bold text-[#050508]">A</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F8F8FA]">Ask AEGIS anything about cybersecurity</h2>
                <p className="text-xs text-[#B6B8C4] mt-1">Your personal cyber intelligence assistant.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => handleSend(s)} className="px-3 py-1.5 rounded-lg text-[11px] text-[#B6B8C4] border border-[rgba(236,154,163,0.1)] hover:border-[rgba(236,154,163,0.25)] hover:text-[#F8F8FA] transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#EC9AA3] text-[#050508] rounded-br-md"
                  : "bg-[#12121A] text-[#F8F8FA] border border-[rgba(236,154,163,0.06)] rounded-bl-md"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[#12121A] border border-[rgba(236,154,163,0.06)]">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[rgba(236,154,163,0.06)]">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AEGIS about cybersecurity..."
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-[#F8F8FA] bg-[#0D0D12] border border-[rgba(236,154,163,0.1)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-colors"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-4 py-2.5 rounded-xl bg-[#EC9AA3] text-[#050508] font-semibold text-sm disabled:opacity-40 hover:shadow-[0_4px_12px_rgba(236,154,163,0.2)] active:scale-[0.97] transition-all"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
