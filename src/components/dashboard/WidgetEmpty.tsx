interface WidgetEmptyProps {
  message: string;
  icon?: React.ReactNode;
}

export function WidgetEmpty({ message, icon }: WidgetEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      {icon && <div className="mb-2 text-[#EC9AA3]/30">{icon}</div>}
      <p className="text-xs text-[#B6B8C4]/60">{message}</p>
    </div>
  );
}
