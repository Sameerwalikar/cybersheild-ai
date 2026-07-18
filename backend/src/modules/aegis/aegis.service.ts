import { aegisRepository } from "./aegis.repository.js";
import { getAIProvider } from "../ai/ai.provider.js";
import { aiConfig } from "../../config/ai.config.js";

const SYSTEM_PROMPT = `You are AEGIS, the AI cybersecurity assistant and analyst for CyberShield AI — India's digital public safety platform.

Your role:
- Help citizens understand cyber threats, including phishing, malware, ransomware, fake websites, social engineering, and financial frauds.
- Explain scan results (URLs, UPI IDs, SMS messages, voice calls, QR codes) in simple, clean, non-technical language.
- Provide actionable, clear security advice and emergency incident response guidance (e.g., dialing 1930 for financial scams, blocking numbers, reporting to cybercrime.gov.in).
- Answer general and specific cybersecurity questions.
- Summarize the user's recent threat activity based on their scan history.
- Explain report statuses and case investigation progress for citizens and police officers.
- Help law enforcement/police officers navigate investigation contexts, reference legal sections (e.g., Section 66D of the IT Act, IPC 420 for cheating), and identify pattern indicators.

Rules:
- Ground your answers strictly in cybersecurity, online safety, and digital protection.
- If asked about unrelated general topics (like cooking, sports, etc.), politely redirect: "I am AEGIS, your cybersecurity specialist. How can I help you stay safe online?"
- Use simple, reassuring, and factual language. Avoid overwhelming technical jargon unless specifically asked.
- Reference the user's actual scan history and reports from the provided context whenever available, but never fabricate details.
- Use Indian contexts (UPI handles, Aadhaar deception, SBI/banking impersonations, government entities) when relevant.
- You can identify repeat scammers and linked reports from the context.`;

export const aegisService = {
  async getConversations(userId: string) {
    const convos = await aegisRepository.getConversations(userId);
    return convos.map((c) => ({
      id: c.id,
      title: c.title,
      lastMessage: c.messages[0]?.content.slice(0, 60) || "",
      updatedAt: c.updatedAt.toISOString(),
    }));
  },

  async getConversation(id: string, userId: string) {
    const convo = await aegisRepository.getConversation(id, userId);
    if (!convo) return null;
    return {
      id: convo.id,
      title: convo.title,
      messages: convo.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt.toISOString(),
      })),
    };
  },

  async chat(userId: string, conversationId: string | null, message: string) {
    // Get or create conversation
    let convoId = conversationId;
    if (!convoId) {
      const convo = await aegisRepository.createConversation(userId, message.slice(0, 40));
      convoId = convo.id;
    }

    // Save user message
    await aegisRepository.addMessage(convoId, "user", message);

    // Retrieve context
    const { recentScans, recentNotifs, recentReports } = await aegisRepository.getRecentContext(userId);

    // Build context string
    const contextParts: string[] = [];
    // Slice context arrays using configuration parameters
    const scansSlice = recentScans.slice(0, aiConfig.aegis.maxRecentScans);
    const reportsSlice = recentReports.slice(0, aiConfig.aegis.maxRecentReports);

    if (scansSlice.length > 0) {
      contextParts.push("USER'S RECENT SCANS:");
      scansSlice.forEach((s) => {
        contextParts.push(`- ${s.scanType} scan (Risk: ${s.analysis?.riskScore || 0}/100, Level: ${s.analysis?.riskLevel || "SAFE"}): "${s.content.slice(0, 80)}"`);
      });
    }
    if (recentNotifs.length > 0) {
      contextParts.push("\nRECENT NOTIFICATIONS:");
      recentNotifs.forEach((n) => {
        contextParts.push(`- [${n.severity}] ${n.title}: ${n.message}`);
      });
    }
    if (reportsSlice.length > 0) {
      contextParts.push("\nUSER'S RECENT REPORTS:");
      reportsSlice.forEach((r) => {
        contextParts.push(`- ${r.reportNumber} (${r.type}, Status: ${r.status}): "${r.description.slice(0, 80)}"`);
      });
    }

    // Get conversation history (slice size determined by config)
    const convo = await aegisRepository.getConversation(convoId, userId);
    const history = (convo?.messages || []).slice(-aiConfig.aegis.maxContextMessages).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Build prompt
    const contextBlock = contextParts.length > 0
      ? `\n\n--- USER CONTEXT ---\n${contextParts.join("\n")}\n--- END CONTEXT ---\n\n`
      : "";

    const fullPrompt = `${contextBlock}User question: ${message}`;

    // Call AI
    const provider = getAIProvider();
    let response: string;
    try {
      response = await provider.analyzeText(fullPrompt, SYSTEM_PROMPT);
      if (!response || response.trim().length === 0) {
        response = "I processed your question but couldn't generate a response. Please try rephrasing.";
      }
    } catch (err: any) {
      console.error("AEGIS AI call failed:", err.message || err);
      response = "I'm temporarily unable to access my AI reasoning engine. Threat scanning services remain available.";
    }

    // Save assistant response
    await aegisRepository.addMessage(convoId, "assistant", response);

    // Auto-title on first exchange
    if (!conversationId) {
      let title = "New Chat";
      try {
        const titlePrompt = `Summarize this user question into a very short, clean conversation title (max 4 words, no punctuation or quotes):\n"${message}"`;
        const generatedTitle = await provider.analyzeText(titlePrompt, "You are a concise coordinator. Reply with ONLY the title.");
        if (generatedTitle && generatedTitle.trim().length > 0 && !generatedTitle.includes("unable to access") && !generatedTitle.includes("temporarily unable")) {
          title = generatedTitle.replace(/["']/g, "").trim();
        } else {
          title = message.length > 30 ? message.slice(0, 27) + "..." : message;
        }
      } catch {
        title = message.length > 30 ? message.slice(0, 27) + "..." : message;
      }
      await aegisRepository.updateConversation(convoId, userId, { title });
    }

    console.log(`[AI Tracing] Saved Conversation ID: ${convoId}`);
    const dto = {
      conversationId: convoId,
      message: { role: "assistant", content: response, timestamp: new Date().toISOString() },
    };
    console.log(`[AI Tracing] Returned DTO: ${JSON.stringify(dto)}`);
    return dto;
  },

  async deleteConversation(id: string, userId: string) {
    await aegisRepository.deleteConversation(id, userId);
  },

  async renameConversation(id: string, userId: string, title: string) {
    await aegisRepository.updateConversation(id, userId, { title });
  },
};
