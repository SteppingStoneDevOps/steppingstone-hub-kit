"use client";

import { useId } from "react";
import { Info } from "lucide-react";
import { cn } from "./cn";
import { useHoverHint } from "./useHoverHint";

/**
 * A small hoverable info affordance — an (i) icon that reveals a short descriptor on hover or
 * keyboard focus. Replaces always-visible subhead text: the guidance is there when wanted and
 * out of the way otherwise. Drop it right after a header's text:
 *
 *   <h3 className="flex items-center gap-1.5 ...">Email Domains<InfoHint>…</InfoHint></h3>
 *
 * WCAG 1.4.13 (v0.22.0, via `useHoverHint`): Escape hides the bubble without moving the pointer
 * or focus; the pointer can move from the icon onto the bubble (no gap, no
 * `pointer-events-none`) and it stays; nothing hides it on a timer. The icon's
 * `aria-describedby` points at the bubble, so a screen reader reads the guidance on focus.
 * A client component since v0.22.0; server components can still render it.
 *
 * The bubble anchors to the icon's left edge and opens downward, so it never clips off the left
 * of a card. `label` is the icon's accessible name.
 */
export function InfoHint({
  children,
  className,
  label = "More information",
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  const bubbleId = useId();
  const { open, rootProps, triggerProps } = useHoverHint();
  return (
    <span className={cn("relative inline-flex align-middle", className)} {...rootProps}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={bubbleId}
        {...triggerProps}
        // text-muted/80: the icon is the only thing that identifies the control (WCAG 1.4.11),
        // ≥3.29:1 on bg, panel and panel-2 in both themes (was /70: 2.76:1 on the light bg).
        className="inline-flex items-center justify-center rounded-full text-muted/80 transition-colors hover:text-fg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo/50"
      >
        <Info className="size-3.5" aria-hidden />
      </button>
      {/* The padding, not a margin, spaces the bubble from the icon: the pointer crosses it
          without leaving the wrapper, so the bubble stays while it is reached (hoverable). */}
      <span
        className={cn(
          "absolute left-0 top-full z-30 pt-1.5 transition-[opacity,visibility] duration-150",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <span
          id={bubbleId}
          role="tooltip"
          className="block w-max max-w-sm rounded-lg border border-border bg-panel px-3 py-2 text-xs font-normal leading-snug text-muted shadow-lg"
        >
          {children}
        </span>
      </span>
    </span>
  );
}
