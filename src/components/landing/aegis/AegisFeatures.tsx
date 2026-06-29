"use client";

import { motion } from "framer-motion";

interface AegisFeaturesProps {
  onHover: (index: number | null) => void;
  reducedMotion: boolean;
}

const features = [
  { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>), title: "Always Vigilant", description: "Continuously monitors cyber threats around the clock." },
  { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4c0 2 1 3 2 4l2 2 2-2c1-1 2-2 2-4a4 4 0 0 0-4-4Z" /><path d="M12 12v10" /><path d="M8 18h8" /></svg>), title: "AI Intelligence", description: "Connects millions of digital signals into meaningful intelligence." },
  { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>), title: "Citizen First", description: "Protects people before attacks become successful." },
  { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>), title: "Mission Ready", description: "Built for citizens, organizations and cybercrime investigators." },
];

const ease = [0.22, 0.03, 0.26, 1] as [number, number, number, number];

const itemVariant = {
  hidden: { opacity: 0, x: -10, filter: "blur(2px)" },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, delay: 0.4 + i * 0.1, ease },
  }),
};

export function AegisFeatures({ onHover, reducedMotion }: AegisFeaturesProps) {
  return (
    <div className="space-y-3">
      {features.map((feature, i) => (
        <motion.div
          key={feature.title}
          className="group flex items-start gap-4 p-3 -ml-3 rounded-xl cursor-default transition-[background-color,transform] duration-200 ease-out hover:bg-[rgba(236,154,163,0.04)] hover:-translate-y-0.5"
          variants={itemVariant}
          initial={reducedMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-5%" }}
          custom={i}
          onHoverStart={() => onHover(i)}
          onHoverEnd={() => onHover(null)}
          onFocus={() => onHover(i)}
          onBlur={() => onHover(null)}
          tabIndex={0}
          role="article"
          aria-label={`${feature.title}: ${feature.description}`}
        >
          <div className="mt-0.5 w-9 h-9 rounded-lg bg-[#12121A] border border-[rgba(236,154,163,0.15)] flex items-center justify-center text-[#EC9AA3] flex-shrink-0 group-hover:bg-[rgba(236,154,163,0.08)] group-hover:border-[rgba(236,154,163,0.25)] group-hover:scale-105 transition-all duration-200">
            {feature.icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F8F8FA] group-hover:text-[#F3B3BA] transition-colors duration-200">{feature.title}</h4>
            <p className="text-sm text-[#B6B8C4] mt-0.5">{feature.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
