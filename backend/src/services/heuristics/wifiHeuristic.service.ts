export function analyzeWifi(content: string) {
  const matchT = content.match(/T:([^;]*)/i);
  const matchS = content.match(/S:([^;]*)/i);
  
  const type = matchT ? matchT[1] : "WEP";
  const ssid = matchS ? matchS[1] : "Unknown";

  const signals: any[] = [];
  let score = 0;

  if (type === "nopass" || type === "" || type.toLowerCase() === "none") {
    signals.push({
      label: "Unsecured WiFi Network",
      severity: "HIGH",
      confidence: 0.95,
      description: "This WiFi network uses no encryption. Trapped portals or snooping could capture your traffic."
    });
    score += 50;
  } else if (type.toUpperCase() === "WEP") {
    signals.push({
      label: "Weak WiFi Encryption",
      severity: "MEDIUM",
      confidence: 0.9,
      description: "WEP encryption is deprecated and can be cracked in minutes."
    });
    score += 30;
  }

  const suspiciousSsids = ["Free_Airport_WiFi", "Public_WiFi", "Free_Internet", "Railway_WiFi", "Gov_Free_WiFi"];
  if (suspiciousSsids.some(s => ssid.toLowerCase().includes(s.toLowerCase()))) {
    signals.push({
      label: "Suspicious SSID",
      severity: "MEDIUM",
      confidence: 0.8,
      description: "Network name mimics public or free services, frequently used in rogue access point attacks."
    });
    score += 20;
  }

  if (signals.length === 0) {
    signals.push({
      label: "Encrypted WiFi Config",
      severity: "LOW",
      confidence: 0.9,
      description: "WiFi network uses standard WPA/WPA2 encryption."
    });
  }

  return {
    score,
    signals,
    summary: score > 0 ? "Suspicious WiFi configuration patterns detected." : "WiFi configuration appears secure.",
    recommendation: score > 0 ? "Avoid connecting to unencrypted public networks." : "Use secure passwords."
  };
}
