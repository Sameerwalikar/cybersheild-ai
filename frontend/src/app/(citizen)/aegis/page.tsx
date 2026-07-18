"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { aegisApi, type ConversationSummary, type ChatMessage } from "@/services/api/aegis";

const SUGGESTIONS = [
  { label: "Explain phishing", text: "Explain phishing in simple words" },
  { label: "Analyze suspicious message", text: "How do I analyze a suspicious SMS or email message?" },
  { label: "How does ransomware work?", text: "How does ransomware work and how do I prevent it?" },
  { label: "Explain URL scan", text: "What threat signals are checked during a URL scan?" },
  { label: "Is this UPI suspicious?", text: "Is a UPI handle ending in '@claim-refund' suspicious?" }
];

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

// Custom lightweight Markdown renderer to support clean styling
function MarkdownContent({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/(```[\s\S]*?```)/g), [text]);

  const renderInline = (inlineText: string) => {
    const inlineParts = inlineText.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|https?:\/\/[^\s]+)/g);
    return inlineParts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-extrabold text-[#F8F8FA]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={index} className="italic text-[#F8F8FA]/90">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={index} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-[#EC9AA3]">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith("http://") || part.startsWith("https://")) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#EC9AA3] hover:text-[#F3B3BA] underline transition-colors"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-3 text-xs leading-relaxed text-[#B6B8C4] select-text">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const language = match ? match[1] : "";
          const code = match ? match[2] : part.slice(3, -3);
          return (
            <div key={index} className="my-4 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)] bg-[#050508]/80 font-mono text-xs">
              <div className="bg-white/5 px-4 py-2 text-[10px] text-[#B6B8C4]/70 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-center select-none">
                <span>{language.toUpperCase() || "CODE"}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="hover:text-white transition-colors text-[9px] font-bold px-2 py-0.5 rounded bg-white/5"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[#EC9AA3] leading-relaxed">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split("\n");
        return (
          <div key={index} className="space-y-2">
            {lines.map((line, lineIndex) => {
              const content = line.trim();
              if (content.startsWith("### ")) {
                return <h3 key={lineIndex} className="text-sm font-bold text-[#F8F8FA] pt-2">{renderInline(content.slice(4))}</h3>;
              }
              if (content.startsWith("## ")) {
                return <h2 key={lineIndex} className="text-base font-bold text-[#F8F8FA] pt-3">{renderInline(content.slice(3))}</h2>;
              }
              if (content.startsWith("# ")) {
                return <h1 key={lineIndex} className="text-lg font-bold text-[#F8F8FA] pt-4">{renderInline(content.slice(2))}</h1>;
              }
              if (content.startsWith("- ") || content.startsWith("* ")) {
                return (
                  <ul key={lineIndex} className="list-disc pl-4 my-1 text-xs text-[#B6B8C4] space-y-1">
                    <li>{renderInline(content.slice(2))}</li>
                  </ul>
                );
              }
              if (content.startsWith("> ")) {
                return (
                  <blockquote key={lineIndex} className="border-l-2 border-[#EC9AA3] pl-3 italic my-2 text-[#B6B8C4]/80">
                    {renderInline(content.slice(2))}
                  </blockquote>
                );
              }
              if (content === "") {
                return <div key={lineIndex} className="h-1" />;
              }
              return <p key={lineIndex}>{renderInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function AegisPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations list
  const loadConversationsList = useCallback(async () => {
    try {
      const convos = await aegisApi.getConversations();
      setConversations(convos);
    } catch {}
  }, []);

  useEffect(() => {
    loadConversationsList();
  }, [loadConversationsList]);

  // Load active conversation details
  const loadConversation = useCallback(async (id: string) => {
    setActiveConvoId(id);
    try {
      const convo = await aegisApi.getConversation(id);
      setMessages(convo.messages);
    } catch {}
  }, []);

  // Auto scroll logic
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    setInput("");
    setSending(true);

    // Optimistically render user message
    const userMsg: ChatMessage = { role: "user", content: msg, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await aegisApi.chat(msg, activeConvoId || undefined);
      setActiveConvoId(res.conversationId);
      setMessages((prev) => [...prev, res.message]);
      loadConversationsList();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err.message || "I'm temporarily unable to access my AI reasoning engine. Threat scanning services remain available.",
          timestamp: new Date().toISOString()
        }
      ]);
    }

    setSending(false);
  };

  const handleNewChat = () => {
    setActiveConvoId(null);
    setMessages([]);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await aegisApi.deleteConversation(id).catch(() => {});
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvoId === id) handleNewChat();
  };

  // Filtered conversation list based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-[24px] overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(8,10,16,0.82)] backdrop-blur-[20px] shadow-[0_4px_32px_rgba(0,0,0,0.4)]">
      {/* Sidebar - History */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            className="w-72 border-r border-[rgba(255,255,255,0.06)] flex flex-col bg-[#080a10]/50"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            {/* New Chat Section */}
            <div className="p-4 border-b border-[rgba(255,255,255,0.06)] space-y-3">
              <button
                onClick={handleNewChat}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-[#F8F8FA] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Session
              </button>

              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 pl-8 rounded-lg text-[11px] text-[#F8F8FA] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.3)] transition-colors"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B6B8C4]/40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scrollbar-thin">
              {filteredConversations.map((c) => {
                const isActive = activeConvoId === c.id;
                const formattedTime = new Date(c.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });
                return (
                  <motion.div
                    key={c.id}
                    className={`group flex items-center rounded-xl px-3 py-2.5 cursor-pointer border transition-all duration-300 ${
                      isActive
                        ? "bg-[rgba(236,154,163,0.06)] border-[rgba(236,154,163,0.15)]"
                        : "bg-transparent border-transparent hover:bg-[rgba(255,255,255,0.02)]"
                    }`}
                    onClick={() => loadConversation(c.id)}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-1">
                        <p className="text-[11px] font-bold text-[#F8F8FA] truncate">{c.title}</p>
                        <span className="text-[8px] text-[#B6B8C4]/40 whitespace-nowrap">{formattedTime}</span>
                      </div>
                      <p className="text-[10px] text-[#B6B8C4]/60 truncate mt-0.5">{c.lastMessage || "No messages yet"}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 ml-2 w-5 h-5 rounded flex items-center justify-center text-[#B6B8C4]/50 hover:text-red-400 hover:bg-white/5 transition-all text-xs"
                    >
                      ×
                    </button>
                  </motion.div>
                );
              })}
              {filteredConversations.length === 0 && (
                <div className="text-center py-8 text-[10px] text-[#B6B8C4]/30 font-medium">
                  No sessions found
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-transparent">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#B6B8C4] hover:text-[#F8F8FA] hover:bg-[rgba(255,255,255,0.03)] border border-transparent hover:border-[rgba(255,255,255,0.06)] transition-all duration-200"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center relative shadow-[0_0_12px_rgba(236,154,163,0.15)]">
                <span className="text-[10px] font-black text-[#050508]">A</span>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#080a10] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#F8F8FA]">AEGIS CO-PILOT</span>
                  <span className="text-[8px] font-extrabold px-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Engine Parameters */}
          <div className="flex items-center gap-3 text-[10px] text-[#B6B8C4]/60">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
              <span className="w-1 h-1 rounded-full bg-pink-500" />
              Provider: <strong className="text-[#F8F8FA] font-bold">Google Gemini</strong>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
              Model: <strong className="text-[#F8F8FA] font-bold">gemini-2.5-flash</strong>
            </div>
          </div>
        </div>

        {/* Message Timeline Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin select-text">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-8 select-none">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center shadow-xl shadow-[rgba(236,154,163,0.12)]"
                >
                  <span className="text-2xl font-black text-[#050508]">CS</span>
                </motion.div>

                <div className="space-y-2 max-w-md">
                  <h2 className="text-2xl font-bold text-[#F8F8FA] tracking-tight">Hello, I&apos;m AEGIS.</h2>
                  <p className="text-xs text-[#B6B8C4] leading-relaxed">
                    I can help you understand cyber threats, investigate suspicious scams, and explain scan results.
                  </p>
                </div>

                {/* Suggestions Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl pt-4">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s.text)}
                      className="p-4 rounded-xl text-left border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(236,154,163,0.25)] hover:bg-[rgba(236,154,163,0.03)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex flex-col justify-between h-24"
                    >
                      <span className="text-[11px] font-bold text-[#F8F8FA]">{s.label}</span>
                      <span className="text-[10px] text-[#B6B8C4]/60 truncate w-full">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              const dateObj = msg.timestamp ? new Date(msg.timestamp) : new Date();
              const timeString = dateObj.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <motion.div
                  key={i}
                  className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease }}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center relative shadow-[0_0_12px_rgba(236,154,163,0.15)] flex-shrink-0 select-none">
                      <span className="text-[10px] font-black text-[#050508]">A</span>
                    </div>
                  )}

                  <div className={`group relative max-w-[85%] px-5 py-4 rounded-[20px] ${
                    isUser
                      ? "bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] text-[#050508] rounded-br-[4px] font-medium shadow-[0_4px_16px_rgba(236,154,163,0.15)]"
                      : "bg-[#0c0d13] text-[#F8F8FA] border border-[rgba(255,255,255,0.06)] rounded-bl-[4px] shadow-lg shadow-black/35"
                  }`}>
                    {isUser ? (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap select-text">{msg.content}</p>
                    ) : (
                      <MarkdownContent text={msg.content} />
                    )}

                    {/* Metadata Footer */}
                    <div className={`mt-3 flex items-center justify-between gap-4 text-[9px] select-none ${
                      isUser ? "text-[#050508]/60" : "text-[#B6B8C4]/40"
                    }`}>
                      <span>{timeString}</span>
                      
                      {!isUser && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-all duration-300">
                          <button
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="hover:text-[#F8F8FA] transition-colors flex items-center gap-1 font-semibold"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            Copy
                          </button>
                          <button
                            onClick={() => handleSend(messages[i - 1]?.content || msg.content)}
                            className="hover:text-[#F8F8FA] transition-colors flex items-center gap-1 font-semibold"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                            Regen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {sending && (
              <motion.div
                className="flex gap-4 justify-start"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EC9AA3] to-[#F3B3BA] flex items-center justify-center shadow-[0_0_12px_rgba(236,154,163,0.15)] flex-shrink-0 select-none">
                  <span className="text-[10px] font-black text-[#050508]">A</span>
                </div>
                <div className="px-5 py-4 rounded-[20px] rounded-bl-[4px] bg-[#0c0d13] border border-[rgba(255,255,255,0.06)] shadow-lg flex items-center gap-1.5 select-none">
                  <span className="text-[10px] font-bold text-[#B6B8C4]/40 mr-1">AEGIS is thinking</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Text Box */}
        <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] bg-[#080a10]/20">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="max-w-3xl mx-auto flex gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AEGIS about cybersecurity..."
              className="flex-1 px-5 py-3 rounded-xl text-xs text-[#F8F8FA] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] placeholder:text-[#B6B8C4]/40 focus:outline-none focus:border-[rgba(236,154,163,0.4)] focus:shadow-[0_0_15px_rgba(236,154,163,0.12)] transition-all duration-300"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#EC9AA3] to-[#F3B3BA] text-[#050508] font-bold text-xs disabled:opacity-40 hover:shadow-[0_4px_16px_rgba(236,154,163,0.3)] hover:scale-[1.015] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
