interface SecurityTipsWidgetProps {
  tips: string[];
}

export function SecurityTipsWidget({ tips }: SecurityTipsWidgetProps) {
  return (
    <div className="space-y-2.5">
      {tips.map((tip, i) => (
        <div key={i} className="flex items-start gap-2.5 py-2 px-3 rounded-lg bg-[#12121A]/40">
          <span className="text-[#EC9AA3]/60 mt-0.5 flex-shrink-0">💡</span>
          <p className="text-[11px] text-[#B6B8C4] leading-relaxed">{tip}</p>
        </div>
      ))}
    </div>
  );
}
