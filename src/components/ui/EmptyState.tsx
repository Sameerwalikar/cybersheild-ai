interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-[#EC9AA3]/40">{icon}</div>}
      <h3 className="text-base font-semibold text-[#F8F8FA]">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-[#B6B8C4] max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
