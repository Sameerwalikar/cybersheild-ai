"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Metric {
  label: string;
  value: number;
  prefix: string;
  suffix: string;
}

const metrics: Metric[] = [
  { label: "Protected", prefix: "₹", value: 12.4, suffix: " Cr" },
  { label: "Messages Scanned", prefix: "", value: 1.3, suffix: "M" },
  { label: "Threats Prevented", prefix: "", value: 94000, suffix: "" },
  { label: "Fraud Networks Detected", prefix: "", value: 18000, suffix: "" },
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

interface JourneyMetricsProps {
  visible: boolean;
}

export function JourneyMetrics({ visible }: JourneyMetricsProps) {
  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-20"
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} visible={visible} />
      ))}
    </motion.div>
  );
}

function MetricCard({ metric, visible }: { metric: Metric; visible: boolean }) {
  const isDecimal = metric.value % 1 !== 0;
  const value = useCountUp(metric.value, 1800, visible, isDecimal);

  const formatValue = () => {
    if (metric.value >= 1000 && !isDecimal) {
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <div className="relative p-4 lg:p-5 rounded-xl bg-[#12121A]/60 backdrop-blur-sm border border-[rgba(236,154,163,0.1)] text-center">
      <p className="text-2xl lg:text-3xl font-bold text-[#F8F8FA] tabular-nums">
        {metric.prefix}{formatValue()}{metric.suffix}
      </p>
      <p className="mt-1 text-xs text-[#B6B8C4]">{metric.label}</p>
    </div>
  );
}
