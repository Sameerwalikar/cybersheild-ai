import validator from "validator";

export type ContentType =
  | "URL"
  | "UPI"
  | "PHONE"
  | "SMS"
  | "EMAIL"
  | "WIFI"
  | "VCARD"
  | "DEEP_LINK"
  | "PLAIN_TEXT"
  | "UNKNOWN";

export interface ClassificationResult {
  contentType: ContentType;
  confidence: "high" | "medium" | "low";
  parsedFields: any;
}

export function classifyQrContent(content: string): ClassificationResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return { contentType: "UNKNOWN", confidence: "low", parsedFields: {} };
  }

  // 1. URL
  if (/^https?:\/\//i.test(trimmed)) {
    return { contentType: "URL", confidence: "high", parsedFields: { url: trimmed } };
  }
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}(\/.*)?$/i;
  if (domainRegex.test(trimmed)) {
    return { contentType: "URL", confidence: "medium", parsedFields: { url: "http://" + trimmed } };
  }

  // 2. UPI
  if (/^upi:\/\//i.test(trimmed)) {
    const parsedFields: any = {};
    try {
      const url = new URL(trimmed);
      parsedFields.pa = url.searchParams.get("pa") || "";
      parsedFields.pn = url.searchParams.get("pn") || "";
      parsedFields.am = url.searchParams.get("am") || "";
      parsedFields.tn = url.searchParams.get("tn") || "";
    } catch {
      const matchPa = trimmed.match(/[?&]pa=([^&]*)/i);
      parsedFields.pa = matchPa ? decodeURIComponent(matchPa[1]) : "";
    }
    return { contentType: "UPI", confidence: "high", parsedFields };
  }

  // 3. Phone
  if (/^tel:/i.test(trimmed)) {
    return { contentType: "PHONE", confidence: "high", parsedFields: { phone: trimmed.slice(4) } };
  }

  // 4. SMS
  if (/^(sms|smsto):/i.test(trimmed)) {
    const parts = trimmed.split(":");
    const recipient = parts[1]?.split("?")[0] || "";
    const bodyMatch = trimmed.match(/[?&]body=([^&]*)/i);
    const body = bodyMatch ? decodeURIComponent(bodyMatch[1]) : "";
    return { contentType: "SMS", confidence: "high", parsedFields: { recipient, body } };
  }

  // 5. Email
  if (/^mailto:/i.test(trimmed)) {
    const emailOnly = trimmed.slice(7).split("?")[0];
    return { contentType: "EMAIL", confidence: "high", parsedFields: { email: emailOnly } };
  }
  if (validator.isEmail(trimmed)) {
    return { contentType: "EMAIL", confidence: "medium", parsedFields: { email: trimmed } };
  }

  // 6. WiFi
  if (/^WIFI:/i.test(trimmed)) {
    const matchT = trimmed.match(/T:([^;]*)/i);
    const matchS = trimmed.match(/S:([^;]*)/i);
    const matchP = trimmed.match(/P:([^;]*)/i);
    return {
      contentType: "WIFI",
      confidence: "high",
      parsedFields: {
        encryption: matchT ? matchT[1] : "",
        ssid: matchS ? matchS[1] : "",
        password: matchP ? matchP[1] : "",
      }
    };
  }

  // 7. vCard
  if (/^BEGIN:VCARD/i.test(trimmed)) {
    const fields: any = {};
    const matchFN = trimmed.match(/FN:([^\n\r]*)/i);
    const matchTEL = trimmed.match(/TEL[;:][^\n\r]*:?([^\n\r]+)/i);
    const matchEMAIL = trimmed.match(/EMAIL[;:][^\n\r]*:?([^\n\r]+)/i);
    const matchURL = trimmed.match(/URL[;:][^\n\r]*:?([^\n\r]+)/i);

    if (matchFN) fields.name = matchFN[1].trim();
    if (matchTEL) fields.phone = matchTEL[1].replace(/[\r\n]/g, "").trim();
    if (matchEMAIL) fields.email = matchEMAIL[1].replace(/[\r\n]/g, "").trim();
    if (matchURL) fields.url = matchURL[1].replace(/[\r\n]/g, "").trim();

    return { contentType: "VCARD", confidence: "high", parsedFields: fields };
  }

  // 8. Deep Link
  const schemeMatch = trimmed.match(/^([a-z0-9+.-]+):\/\//i);
  if (schemeMatch) {
    return { contentType: "DEEP_LINK", confidence: "medium", parsedFields: { scheme: schemeMatch[1], content: trimmed } };
  }

  // 9. Plain Text
  return { contentType: "PLAIN_TEXT", confidence: "low", parsedFields: { text: trimmed } };
}
