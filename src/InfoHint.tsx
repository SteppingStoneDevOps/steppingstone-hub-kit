import { Info } from "lucide-react";
import { cn } from "./cn";

/**
 * A small hoverable info affordance — an (i) icon that reveals a short descriptor on hover or
 * keyboard focus. Replaces always-visible subhead text: the guidance is there when wanted and
 * out of the way otherwise. CSS-only (group-hover + group-focus-within), so it needs no client
 * state and works inside server components. Drop it right after a header's text:
 *
 *   <h3 className="flex items-center gap-1.5 ...">Email Domains<InfoHint>…</InfoHint></h3>
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
  return (
    <span className={cn("group relative inline-flex align-middle", className)}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex items-center justify-center rounded-full text-muted/70 transition-colors hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo/50"
      >
        <Info className="size-3.5" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-30 mt-1.5 w-max max-w-sm rounded-lg border border-border bg-panel px-3 py-2 text-xs font-normal leading-snug text-muted opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}
