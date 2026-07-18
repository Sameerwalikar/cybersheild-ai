import { aegisRepository } from "./aegis.repository.js";
import { getAIProvider } from "../ai/ai.provider.js";
import { aiConfig } from "../../config/ai.config.js";

const SYSTEM_PROMPT = `You are AEGIS, CyberShield AI's premium cybersecurity analyst copilot. Deliver calm, professional, reassuring, and expert guidance.

Tone & Conversation Style:
- Sound like a cybersecurity analyst talking to a citizen: use natural transitions, avoid robotic labels. (e.g. say "This appears to be malware because..." or "The strongest indicator that this is phishing is...").
- Differentiate clearly between general advice, threat engine scans, and user history. Never fabricate details.

Dynamic Response Structure:
1. EMERGENCY MODE (Active attack, e.g., "hacked", "clicked link", "paid scammer"):
   - Switch immediately to an urgent, direct tone.
   - Prioritize containment, emergency actions (e.g., dial 1930 for banking fraud, freeze cards), reporting, and evidence preservation. Avoid educational context.
2. THREAT ANALYSIS / MESSAGE / UPI SCAN:
   - Provide: Threat Summary, Detected Indicators (with explanation of why they are dangerous), Risk Explanation, and Recommended Actions.
3. GENERAL QUESTIONS (e.g. "What is ransomware?", "How to identify fake sites"):
   - Explain how attacks start, how they work (e.g., encryption), why backups matter, why ransom is discouraged.
   - Use headings, bullet points, WARNINGS, and TIPS.
   - Always include 2-3 Suggested Follow-up Questions at the end.

CyberShield Integration:
- Naturally reference CyberShield features (e.g., Threat Scanner, Reports section) only when relevant.`;

const CYBER_FAQ_CACHE: Record<string, string> = {
  "what is phishing": 
    `### Phishing Analysis

Phishing is a deceptive technique where attackers impersonate trusted institutions (such as HDFC bank, SBI, or Amazon support) to steal credentials, net banking passwords, or OTPs.

#### How it works
Typically, you receive a WhatsApp message or SMS claiming your account is suspended or a package is delayed, containing a link like \`sbi-kyc-verify.xyz\` designed to look identical to the real bank page.

> [!WARNING]
> Once you input details on a fraudulent page, they are harvested by the attacker in real-time.

#### Actionable Guidance
- **Verify URLs:** Always check the exact domain address before entering passwords.
- **Never Share OTPs:** No bank official will ever ask you for an OTP over the phone.
- **Report Scams:** Forward the URL to CyberShield's Threat Scanner or report it at cybercrime.gov.in.

You may also want to ask:
- How do I identify a fake login page?
- What should I do if I entered my PIN on a suspicious link?
- How can I block scam messages automatically?`,
  
  "what is ransomware":
    `### Ransomware Basics

Ransomware is advanced malware that encrypts files on your system, holding your digital assets hostage and demanding payment (ransom) to restore access.

#### How it works
Attackers deliver ransomware via email attachments, cracked software, or unpatched system vulnerabilities. Once active, it uses strong encryption algorithms to lock files, leaving a ransom note.

> [!TIP]
> Never pay the ransom. Paying encourages the business model and does not guarantee file recovery.

#### Stay Protected
1. **Regular Backups:** Keep offline backups on external drives not connected to your network.
2. **Keep Software Updated:** Patch your OS and applications immediately.
3. **Use CyberShield Scans:** Run scan on any downloadable files before opening.

You may also want to ask:
- How ransomware attacks start?
- Can encrypted files be decrypted without paying?
- How does offline backup protect me?`,
  
  "what is malware":
    `### Malware Intelligence

Malware refers to any malicious software (viruses, spyware, keyloggers) designed to infect, exploit, or control devices without authorization.

#### How it works
Malware enters systems via deceptive downloads, spam attachments, or malicious links. Some variants silently log keystrokes, while others allow remote control of your screen (e.g., malicious screen-sharing apps).

> [!WARNING]
> Screen-sharing apps can be weaponized by scammers. Never install remote-access software at the request of an unsolicited caller.

#### Actionable Steps
- Keep your device's built-in security (Windows Defender / Google Play Protect) enabled.
- Audit app permissions and uninstall applications you do not recognize.

You may also want to ask:
- What are the warning signs of a malware infection?
- How do I remove a malicious app from my phone?
- What is a Trojan horse?`,

  "how do otp scams work":
    `### OTP Scam Assessment

OTP (One-Time Password) scams are social engineering tricks where scammers pressure you into revealing temporary passwords, enabling unauthorized access to your banking or UPI accounts.

#### How it works
Scammers call pretending to be bank customer care, customer support, or government officials, creating artificial urgency (e.g., "your account is blocked!"). They trick you into sharing the code sent to your phone.

> [!IMPORTANT]
> OTPs are the final line of defense protecting your account. Treat them like your ATM PIN.

#### Immediate Action Checklist
- **Hang Up:** Immediately end calls requesting OTPs or financial details.
- **Dial 1930:** Call the national cyber helpline if funds are stolen.
- **Report the Number:** Block and report the caller.

You may also want to ask:
- How did a scammer get my phone number?
- Can scammers bypass OTP verification?
- What should I do if my bank account is compromised?`,

  "how to identify fake websites":
    `### Identifying Fake Websites

Fake websites mimic legitimate platforms to capture logins, credit card details, or UPI transactions.

#### Critical Indicators
- **Suspicious Domain Names:** Look for subtle typos (e.g., \`amzon-support.xyz\` instead of \`amazon.in\`).
- **Domain Age:** Scammers use freshly registered domains.
- **Missing SSL details:** Look for insecure connections or invalid certificates.

> [!TIP]
> Use CyberShield's Threat Scanner to inspect domains before entering credentials.

You may also want to ask:
- What is a homograph attack?
- Is a site safe just because it has HTTPS?
- How do I report a fake website for takedown?`
};

function getCachedFaqResponse(message: string): string | null {
  const clean = message.toLowerCase().trim();
  if (clean.includes("phishing")) return CYBER_FAQ_CACHE["what is phishing"];
  if (clean.includes("ransomware")) return CYBER_FAQ_CACHE["what is ransomware"];
  if (clean.includes("malware")) return CYBER_FAQ_CACHE["what is malware"];
  if (clean.includes("otp")) return CYBER_FAQ_CACHE["how do otp scams work"];
  if (clean.includes("fake website") || clean.includes("fake link") || clean.includes("fake url")) {
    return CYBER_FAQ_CACHE["how to identify fake websites"];
  }
  return null;
}

function classifyIntent(message: string): "SCAN" | "REPORT" | "HISTORY" | "GENERAL" {
  const msg = message.toLowerCase();
  if (msg.includes("summarize") || msg.includes("activity") || msg.includes("history") || msg.includes("recent")) {
    return "HISTORY";
  }
  if (msg.includes("scan") || msg.includes("why was") || msg.includes("explain my last") || msg.includes("dangerous") || msg.includes("unsafe")) {
    return "SCAN";
  }
  if (msg.includes("report") || msg.includes("complaint") || msg.includes("status") || msg.includes("case") || msg.includes("investigation")) {
    return "REPORT";
  }
  return "GENERAL";
}

function buildLocalHistorySummary(recentScans: any[], recentReports: any[], recentNotifs: any[]): string {
  const criticalScans = recentScans.filter((s) => s.analysis && s.analysis.riskScore >= 60).length;
  const safeScans = recentScans.filter((s) => s.analysis && s.analysis.riskScore < 30).length;
  const warningScans = recentScans.length - criticalScans - safeScans;
  
  const scanSummary = `${recentScans.length} scans (${criticalScans} critical, ${warningScans} warning, ${safeScans} safe)`;
  const reportStatuses = recentReports.map((r) => r.status.toLowerCase().replace("_", " "));
  const reportSummary = recentReports.length > 0 
    ? `${recentReports.length} report(s) (${reportStatuses.join(", ")})`
    : "no reports filed";
    
  return `Recent Activity:\n• Scans: ${scanSummary}\n• Reports: ${reportSummary}\n• Notifications: ${recentNotifs.length} recent alerts`;
}

function generateLocalTitle(message: string): string {
  const clean = message.replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
  const lowercase = clean.toLowerCase();

  if (lowercase.includes("ransomware")) return "Ransomware Basics";
  if (lowercase.includes("sms")) return "SMS Analysis";
  if (lowercase.includes("upi")) return "UPI Analysis";
  if (lowercase.includes("phishing") || lowercase.includes("fake")) return "Phishing Analysis";
  if (lowercase.includes("url") || lowercase.includes("link")) return "URL Analysis";
  if (lowercase.includes("emergency") || lowercase.includes("scam") || lowercase.includes("fraud")) return "Incident Response";

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    return words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }
  return "Security Inquiry";
}

function sanitizePrompt(text: string): string {
  const forbidden = [
    "Review against Rules",
    "Expected Output",
    "Evaluation",
    "Chain of Thought",
    "Developer Notes"
  ];
  let result = text;
  for (const term of forbidden) {
    const regex = new RegExp(`^.*${term}.*$`, "gim");
    result = result.replace(regex, "");
  }
  return result;
}

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
    const startTime = Date.now();
    let convoId = conversationId;
    if (!convoId) {
      const convo = await aegisRepository.createConversation(userId, generateLocalTitle(message));
      convoId = convo.id;
    }

    // Save user message
    await aegisRepository.addMessage(convoId, "user", message);

    // FAQ Cache Check
    const cachedResponse = getCachedFaqResponse(message);
    if (cachedResponse) {
      await aegisRepository.addMessage(convoId, "assistant", cachedResponse);
      const dto = {
        conversationId: convoId,
        message: { role: "assistant" as const, content: cachedResponse, timestamp: new Date().toISOString() },
      };
      
      if (aiConfig.logging.debugLogging) {
        console.log(`[AI Observability] Cache HIT | Context: None | Latency: ${Date.now() - startTime}ms | Prompt Tokens: 0 | Completion Tokens: 0 | Total Tokens: 0`);
      }
      return dto;
    }

    // Classify intent
    const intent = classifyIntent(message);
    let contextBlock = "";

    if (intent !== "GENERAL") {
      const { recentScans, recentNotifs, recentReports } = await aegisRepository.getRecentContext(userId);
      
      if (intent === "SCAN" && recentScans.length > 0) {
        const scan = recentScans[0];
        contextBlock = `\n\n--- RELEVANT CONTEXT (Last Scan) ---\n- ${scan.scanType} scan (Risk: ${scan.analysis?.riskScore || 0}/100, Level: ${scan.analysis?.riskLevel || "SAFE"}): "${scan.content.slice(0, 80)}"\n--- END CONTEXT ---\n\n`;
      } else if (intent === "REPORT" && recentReports.length > 0) {
        const r = recentReports[0];
        contextBlock = `\n\n--- RELEVANT CONTEXT (Last Report) ---\n- Report No: ${r.reportNumber} (${r.type}, Status: ${r.status}): "${r.description.slice(0, 80)}"\n--- END CONTEXT ---\n\n`;
      } else if (intent === "HISTORY") {
        contextBlock = `\n\n--- RELEVANT CONTEXT (Threat History Summary) ---\n${buildLocalHistorySummary(recentScans, recentReports, recentNotifs)}\n--- END CONTEXT ---\n\n`;
      }
    }

    // Limit conversation memory (keep only last 3 exchanges to save tokens)
    const convo = await aegisRepository.getConversation(convoId, userId);
    const history = (convo?.messages || [])
      .filter((m) => m.content !== message)
      .slice(-6) // 3 exchanges = 6 messages
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const historyParts = history.map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`);
    const historyBlock = historyParts.length > 0
      ? `\n\n--- CONVERSATION HISTORY ---\n${historyParts.join("\n")}\n--- END HISTORY ---\n\n`
      : "";

    const userBlock = `User question: ${message}`;
    const rawPrompt = `${contextBlock}${historyBlock}${userBlock}`;
    const fullPrompt = sanitizePrompt(rawPrompt);
    const sanitizedSystemPrompt = sanitizePrompt(SYSTEM_PROMPT);

    // Stage 1 logging
    console.log("\n=== STAGE 1: REQUEST PAYLOAD ===");
    console.log(`System Instruction:\n${sanitizedSystemPrompt}\n`);
    console.log(`Conversation History:\n${JSON.stringify(history, null, 2)}\n`);
    console.log(`User Message:\n${fullPrompt}\n`);

    // Call AI
    const provider = getAIProvider();
    let response: string;
    try {
      response = await provider.analyzeText(fullPrompt, sanitizedSystemPrompt);
      if (!response || response.trim().length === 0) {
        response = "I processed your question but couldn't generate a response. Please try rephrasing.";
      }
    } catch (err: any) {
      console.error("AEGIS AI call failed:", err.message || err);
      response = "I'm temporarily unable to access my AI reasoning engine. Threat scanning services remain available.";
    }

    // Save assistant response
    await aegisRepository.addMessage(convoId, "assistant", response);

    // Auto-title locally on first exchange (DO NOT call Gemini to generate title)
    if (!conversationId) {
      const title = generateLocalTitle(message);
      await aegisRepository.updateConversation(convoId, userId, { title });
    }

    const dto = {
      conversationId: convoId,
      message: { role: "assistant" as const, content: response, timestamp: new Date().toISOString() },
    };

    console.log("\n=== STAGE 4: TRANSFORMATIONS ===");
    console.log(`Raw AI Text:\n${response}\n`);
    console.log("Post Processing: (none)\n");
    console.log("Markdown Cleanup: (none)\n");
    console.log("Formatting: (none)\n");
    console.log(`DTO:\n${JSON.stringify(dto, null, 2)}\n`);
    console.log(`Database Save: Saved successfully to Prisma message table\n`);
    console.log(`Frontend Response: (forwarded DTO JSON)\n`);

    if (aiConfig.logging.debugLogging) {
      console.log(`[AI Observability] Cache MISS | Context: ${intent} | Latency: ${Date.now() - startTime}ms`);
    }

    return dto;
  },

  async deleteConversation(id: string, userId: string) {
    await aegisRepository.deleteConversation(id, userId);
  },

  async renameConversation(id: string, userId: string, title: string) {
    await aegisRepository.updateConversation(id, userId, { title });
  },
};
