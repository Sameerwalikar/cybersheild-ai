"use client";

import Link from "next/link";
import styles from "./PremiumActionButton.module.css";

type Variant = "primary" | "secondary";

interface PremiumActionButtonProps {
  variant?: Variant;
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  icon?: React.ReactNode;
}

export function PremiumActionButton({
  variant = "primary",
  href,
  onClick,
  children,
  ariaLabel,
  icon,
}: PremiumActionButtonProps) {
  const className = `${styles.button} ${variant === "primary" ? styles.primary : styles.secondary}`;

  const content = (
    <>
      <span className={styles.outlineRing} aria-hidden="true" />
      <span className={styles.fill} aria-hidden="true" />
      <span className={styles.label}>
        {icon}
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick} aria-label={ariaLabel}>
      {content}
    </button>
  );
}
