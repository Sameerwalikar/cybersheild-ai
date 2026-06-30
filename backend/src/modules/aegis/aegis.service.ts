import { aegisRepository } from "./aegis.repository.js";
import { getAIProvider } from "../ai/ai.provider.js";

const SYSTEM_PROMPT = `You are AEGIS, the AI cybersecurity assistant for CyberShield AI — India's digital public safety platform.

Your role:
- Help citizens understand cyber threats
- Explain scan results in simple language
- Provide actionable security advice
- Answer cybersecurity questions
- Summarize the user's recent threat activity

Rules:
- Only answer cybersecurity-related questions
- If asked unrelated topics, politely redirect: "I'm specialized in cybersecurity. How can I help you stay safe online?"
- Use simple language, avoid jargon
- Be helpful, reassuring, and factual
- Reference the user's actual scan history when available
- Never invent or fabricate scan data
- Use Indian context (UPI, Aadhaar, SBI, etc.) when relevant`;

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
    const { recentScans, recentNotifs } = await aegisRepository.getRecentContext(userId);

    // Build context string
    const contextParts: string[] = [];
    if (recentScans.length > 0) {
      contextParts.push("USER'S RECENT SCANS:");
      recentScans.forEach((s) => {
        contextParts.push(`- ${s.scanType} scan (Risk: ${s.analysis?.riskScore || 0}/100, Level: ${s.analysis?.riskLevel || "SAFE"}): "${s.content.slice(0, 80)}"`);
      });
    }
    if (recentNotifs.length > 0) {
      contextParts.push("\nRECENT NOTIFICATIONS:");
      recentNotifs.forEach((n) => {
        contextParts.push(`- [${n.severity}] ${n.title}: ${n.message}`);
      });
    }

    // Get conversation history (last 10 messages for context window)
    const convo = await aegisRepository.getConversation(convoId, userId);
    const history = (convo?.messages || []).slice(-10).map((m) => ({
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
      response = "I'm having trouble connecting to my intelligence systems right now. Please try again in a moment.";
    }

    // Save assistant response
    await aegisRepository.addMessage(convoId, "assistant", response);

    // Auto-title on first exchange
    if (!conversationId) {
      const title = message.length > 40 ? message.slice(0, 37) + "..." : message;
      await aegisRepository.updateConversation(convoId, userId, { title });
    }

    return {
      conversationId: convoId,
      message: { role: "assistant", content: response, timestamp: new Date().toISOString() },
    };
  },

  async deleteConversation(id: string, userId: string) {
    await aegisRepository.deleteConversation(id, userId);
  },

  async renameConversation(id: string, userId: string, title: string) {
    await aegisRepository.updateConversation(id, userId, { title });
  },
};
