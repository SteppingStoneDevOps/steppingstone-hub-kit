import { cn } from "./cn";

/**
 * The standard tile/card for the platform. One look everywhere: an opaque panel
 * surface, a defined border, and a soft shadow so tiles read clearly against the
 * background in BOTH dark and light themes (tokens flip with the theme). Prefer
 * this over hand-rolled `bg-panel/… border-border-soft` divs.
 */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-panel p-5 shadow-sm shadow-black/20",
        className,
      )}
    >
      {children}
    </div>
  );
}
