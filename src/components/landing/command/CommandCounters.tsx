"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Counter {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
}

const counters: Counter[] = [
  { label: "Threats Today", value: 4287, prefix: "", suffix: "" },
  { label: "Investigations", value: 342, prefix: "", suffix: "" },
  { label: "Citizens Protected", value: 1.8, prefix: "", suffix: "M" },
  { label: "Fraud Networks", value: 847, prefix: "", suffix: "" },
];

function useCountUp(target: number, duration: number, trigger: boolean, isDecimal: boolean) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger) return;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setValue(isDecimal ? parseFloat(current.toFixed(1)) : Math.round(current));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, trigger, isDecimal]);

  return value;
}

interface CommandCountersProps {
  visible: boolean;
}

export function CommandCounters({ visible }: CommandCountersProps) {
  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      initial={{ opacity: 0, y: 16 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {counters.map((counter) => (
        <CounterCard key={counter.label} counter={counter} visible={visible} />
      ))}
    </motion.div>
  );
}

function CounterCard({ counter, visible }: { counter: Counter; visible: boolean }) {
  const isDecimal = counter.value % 1 !== 0;
  const value = useCountUp(counter.value, 2000, visible, isDecimal);

  const formatValue = () => {
    if (counter.value >= 1000 && !isDecimal) {
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <div className="p-3 lg:p-4 rounded-xl bg-[#12121A]/60 backdrop-blur-sm border border-[rgba(236,154,163,0.08)] text-center">
      <p className="text-xl lg:text-2xl font-bold text-[#F8F8FA] tabular-nums">
        {counter.prefix}{formatValue()}{counter.suffix}
      </p>
      <p className="mt-0.5 text-[10px] text-[#B6B8C4] uppercase tracking-wider">{counter.label}</p>
    </div>
  );
}
