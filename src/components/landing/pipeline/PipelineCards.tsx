"use client";

import { motion } from "framer-motion";

interface PipelineCardsProps {
  onHover: (index: number | null) => void;
}

const cards = [
  { title: "Message Analysis", description: "NLP scans text for fraud patterns, urgency markers, and impersonation signals.", stageIndex: 1 },
  { title: "Website Intelligence", description: "Analyzes domain age, SSL validity, and phishing pattern matches.", stageIndex: 2 },
  { title: "UPI Detection", description: "Traces UPI IDs across reported fraud networks and transaction chains.", stageIndex: 3 },
  { title: "Voice Analysis", description: "Detects deepfake audio and social engineering speech patterns.", stageIndex: 1 },
  { title: "Fraud Graph", description: "Maps relationships between entities to uncover organized networks.", stageIndex: 3 },
  { title: "Recommendation Engine", description: "Generates personalized safety actions based on threat context.", stageIndex: 5 },
];

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const cardVariants = {
  hidden: { opacity: 0, y: 14, filter: "blur(3px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, delay: 0.2 + i * 0.08, ease },
  }),
};

export function PipelineCards({ onHover }: PipelineCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          className="group relative p-4 rounded-xl
                     bg-[#12121A]/60 backdrop-blur-sm
                     border border-[rgba(236,154,163,0.12)]
                     cursor-default
                     transition-[border-color,box-shadow,transform] duration-[220ms] ease-out"
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-5%" }}
          custom={i}
          whileHover={{
            y: -3,
            boxShadow: "0 8px 28px rgba(236,154,163,0.07)",
            borderColor: "rgba(236,154,163,0.28)",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          onHoverStart={() => onHover(card.stageIndex)}
          onHoverEnd={() => onHover(null)}
          tabIndex={0}
          role="article"
          aria-label={`${card.title}: ${card.description}`}
          onFocus={() => onHover(card.stageIndex)}
          onBlur={() => onHover(null)}
        >
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-[rgba(236,154,163,0.04)] to-transparent" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EC9AA3] group-hover:shadow-[0_0_6px_rgba(236,154,163,0.5)] group-hover:scale-125 transition-all duration-200" />
              <h4 className="text-sm font-semibold text-[#F8F8FA]">{card.title}</h4>
            </div>
            <p className="text-xs text-[#B6B8C4] leading-relaxed pl-3.5">
              {card.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
