"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focus management for an open dialog (HECVAT / WCAG 2.4.3): on open, focus moves to the first
 * focusable element in the panel (or the panel itself when there is none); Tab and Shift+Tab
 * cycle inside the panel; on close, focus returns to whatever had it before the dialog opened.
 */
function useFocusTrap(open: boolean, panelRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const previous = document.activeElement;
    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    (focusables()[0] ?? panel).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = focusables();
      const active = document.activeElement;
      const inside = active instanceof Node && panel.contains(active);
      if (list.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && (!inside || active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open, panelRef]);
}

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
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(open, panelRef);

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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "w-full rounded-xl border border-border bg-panel shadow-2xl focus:outline-none",
          width,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-3.5">
          <h2 id={titleId} className="text-sm font-semibold text-fg">
            {title}
          </h2>
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
