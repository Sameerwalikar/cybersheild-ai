"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { ThreatNotification } from "./ThreatNotification";
import { ThreatCard } from "./ThreatCard";

gsap.registerPlugin(ScrollTrigger);

type Phase = "idle" | "title" | "notifications" | "surrounded" | "scanning" | "settled";

const notifications = [
  { title: "🏦 SBI", message: "Your account has been blocked. Verify Now.", entryX: -60, entryY: -30 },
  { title: "📞 Unknown Call", message: "Cyber Police: Aadhaar compromised...", entryX: 50, entryY: -20 },
  { title: "💸 UPI Cashback", message: "Enter PIN to receive ₹5,000 reward.", entryX: -40, entryY: 30 },
  { title: "🏛️ Government Portal", message: "Register for PM scheme, enter bank details.", entryX: 55, entryY: 25 },
  { title: "📈 Investment", message: "Guaranteed 40% monthly returns.", entryX: -50, entryY: -10 },
  { title: "🆔 Identity Verify", message: "Confirm PAN + Aadhaar for tax refund.", entryX: 45, entryY: -35 },
  { title: "🎤 Voice Call", message: "AI-generated voice impersonation detected.", entryX: -30, entryY: 35 },
  { title: "🤖 Deepfake Audio", message: "Synthetic speech: 94% AI confidence.", entryX: 40, entryY: 20 },
];

const notificationPositions = [
  { top: "8%", left: "10%" }, { top: "5%", right: "12%" },
  { top: "28%", left: "5%" }, { top: "25%", right: "8%" },
  { top: "48%", left: "8%" }, { top: "45%", right: "10%" },
  { top: "65%", left: "12%" }, { top: "62%", right: "5%" },
];

const threats = [
  { title: "SMS Scam", example: "Dear customer, your SBI account will be blocked. Click here to verify immediately.", riskLevel: "Critical", confidence: 96, recommendation: "Block & Report" },
  { title: "Fake Banking Website", example: "sbi-netbanking-verify.xyz — Domain age: 3 days, no SSL certificate detected.", riskLevel: "High", confidence: 94, recommendation: "URL Blocked" },
  { title: "UPI Fraud", example: "Receive ₹5,000 cashback — enter UPI PIN to claim. Sent from unknown@ybl.", riskLevel: "Critical", confidence: 98, recommendation: "Transaction Blocked" },
  { title: "Voice Scam", example: "This is calling from Cyber Police. Your Aadhaar has been compromised...", riskLevel: "High", confidence: 89, recommendation: "Deepfake Detected" },
  { title: "Fake Government Portal", example: "gov-india-scheme.com — Register for PM Kisan Yojana, enter bank details.", riskLevel: "High", confidence: 92, recommendation: "Domain Flagged" },
  { title: "Investment Scam", example: "Guaranteed 40% returns monthly. Join our exclusive WhatsApp trading group.", riskLevel: "Medium", confidence: 87, recommendation: "Scam Pattern Match" },
  { title: "Identity Theft", example: "Confirm your PAN, Aadhaar and bank details for income tax refund processing.", riskLevel: "Critical", confidence: 95, recommendation: "PII Request Blocked" },
  { title: "Deepfake Voice", example: "Audio analysis: synthetic speech detected, 94% confidence AI-generated voice.", riskLevel: "High", confidence: 94, recommendation: "Voice Flagged" },
];

export function ThreatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const hasPlayed = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [visibleNotifications, setVisibleNotifications] = useState<number>(0);
  const [allProtected, setAllProtected] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    if (mq.matches) { setPhase("settled"); setShowCards(true); setAllProtected(true); }
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const startSequence = useCallback(() => {
    if (hasPlayed.current || reducedMotion) return;
    hasPlayed.current = true;
    setPhase("title");
    let spawned = 0;
    const spawnInterval = setInterval(() => {
      spawned++;
      setVisibleNotifications(spawned);
      if (spawned >= notifications.length) {
        clearInterval(spawnInterval);
        setPhase("surrounded");
        setTimeout(() => { setPhase("scanning"); setAllProtected(true); setTimeout(() => { setPhase("settled"); setShowCards(true); }, 1800); }, 2000);
      }
    }, 750);
    setTimeout(() => setPhase("notifications"), 1200);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current, { opacity: 0, y: 36 }, {
        opacity: 1, y: 0, duration: 0.9, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 72%", once: true, onEnter: startSequence },
      });
      gsap.fromTo(subtitleRef.current, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.7, delay: 0.12, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 68%", once: true },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion, startSequence]);

  return (
    <section ref={sectionRef} className="relative w-full py-24 lg:py-36 overflow-hidden" aria-labelledby="threats-heading">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #EC9AA3 0%, transparent 60%)" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 ref={titleRef} id="threats-heading" className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F8F8FA] leading-[1.1] ${reducedMotion ? "" : "opacity-0"}`}>
          Cyber Threats Hide In Plain Sight.
        </h2>
        <p ref={subtitleRef} className={`mt-5 text-lg text-[#B6B8C4] leading-relaxed max-w-2xl mx-auto ${reducedMotion ? "" : "opacity-0"}`}>
          Every day millions of people receive messages, calls and websites designed to steal money, identities and trust. CyberShield detects these threats before they become victims.
        </p>

        <AnimatePresence>
          {phase !== "settled" && phase !== "idle" && (
            <motion.div className="relative w-full h-[420px] mt-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.6 }}>
              {notifications.map((notif, i) => (
                <div key={notif.title} className="absolute" style={notificationPositions[i] as React.CSSProperties}>
                  <ThreatNotification title={notif.title} message={notif.message} visible={i < visibleNotifications} protected={allProtected} index={i} entryX={notif.entryX} entryY={notif.entryY} />
                </div>
              ))}
              {phase === "scanning" && (
                <motion.div className="absolute top-0 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-transparent via-[#EC9AA3] to-transparent opacity-60" initial={{ y: 0 }} animate={{ y: 420 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {allProtected && phase === "settled" && (
          <motion.div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#12121A] border border-[rgba(236,154,163,0.2)]" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
            <div className="w-2 h-2 rounded-full bg-[#EC9AA3]" />
            <span className="text-xs font-medium text-[#EC9AA3]">All threats neutralized by CyberShield AI</span>
          </motion.div>
        )}

        {showCards && (
          <motion.div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}>
            {threats.map((threat, i) => (
              <ThreatCard key={threat.title} title={threat.title} example={threat.example} riskLevel={threat.riskLevel} confidence={threat.confidence} recommendation={threat.recommendation} index={i} protected={allProtected} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
