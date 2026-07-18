import { parsePhoneNumberFromString } from "libphonenumber-js";

export function analyzePhone(phone: string) {
  const clean = phone.replace(/^tel:/i, "").trim();
  const parsed = parsePhoneNumberFromString(clean, "IN");
  
  const signals: any[] = [];
  let score = 0;

  if (!parsed || !parsed.isValid()) {
    signals.push({
      label: "Invalid Phone Format",
      severity: "HIGH",
      confidence: 0.9,
      description: "The phone number format is invalid or spoofed-looking."
    });
    score += 40;
  } else {
    const country = parsed.country;
    const numberStr = parsed.number;
    
    if (country === "IN" && numberStr.startsWith("+91900")) {
      signals.push({
        label: "Premium Rate Number",
        severity: "MEDIUM",
        confidence: 0.85,
        description: "Premium rate number prefix detected. Calls may incur high charges."
      });
      score += 30;
    }
  }

  if (signals.length === 0) {
    signals.push({
      label: "Valid Phone Number",
      severity: "LOW",
      confidence: 0.9,
      description: "Phone number format verified and appears normal."
    });
  }

  return {
    score,
    signals,
    summary: score > 0 ? "Suspicious phone number properties detected." : "Phone number format appears valid.",
    recommendation: score > 0 ? "Do not call back or share OTPs over the call." : "Verify identity if requested."
  };
}
