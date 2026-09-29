"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-md",
  dismissable = true,
}: {
  /**
   * When false, Escape, the X and a backdrop click are ignored — pass `!pending` from a write
   * modal so it cannot be closed while its save is in flight (a dismissed modal unmounts, and the
   * failure it was about to show is lost; audit F-A14). The caller's own Cancel button stays the
   * caller's to disable.
   */
  dismissable?: boolean;
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, dismissable]);

  if (!open) return null;
  const close = () => {
    if (dismissable) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[8vh]"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "w-full rounded-xl border border-border bg-panel shadow-2xl",
          width,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-3.5">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          <button
            onClick={close}
            disabled={!dismissable}
            className="text-muted transition-colors hover:text-fg disabled:opacity-40"
            aria-label="Close"
          >
            <X className="size-4.5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 pb-5 pt-1">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
