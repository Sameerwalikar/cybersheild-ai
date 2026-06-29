interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <div className={`w-full rounded-2xl bg-[#0D0D12]/90 backdrop-blur-md border border-[rgba(236,154,163,0.1)] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${className}`}>
      {children}
    </div>
  );
}
