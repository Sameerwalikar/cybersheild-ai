"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/60 bg-transparent p-0 m-auto max-w-lg w-full outline-none"
      onClose={onClose}
    >
      <div className="rounded-2xl bg-[#0D0D12] border border-[rgba(236,154,163,0.12)] p-6 shadow-2xl">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#F8F8FA]">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#B6B8C4] hover:text-[#F8F8FA] hover:bg-[rgba(236,154,163,0.05)] transition-colors"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
