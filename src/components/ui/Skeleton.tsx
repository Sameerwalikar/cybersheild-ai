interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[rgba(236,154,163,0.05)] ${className}`}
      aria-hidden="true"
    />
  );
}
