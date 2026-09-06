import { cn } from "./cn";

// The one button system (see memory: button-style-standard). Pill shape, indigo
// primary (no gradient), Title Case labels. Sizes: md (default) + sm. No red/danger
// variant — red is reserved for alert/error text only.
type Variant = "primary" | "secondary" | "ghost" | "subtle";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[filter,transform,box-shadow,background-color,border-color,color] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo/60 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // Indigo pill, white ink, soft glow, subtle hover lift. The main action, one per view.
  primary:
    "bg-indigo text-white shadow-[var(--shadow-primary)] hover:brightness-110 hover:-translate-y-px hover:shadow-[var(--shadow-primary-hover)]",
  // Filled neutral — supporting action.
  secondary: "bg-chip text-fg hover:bg-hover",
  // Outline — low-emphasis / tertiary.
  ghost: "border border-border text-fg hover:bg-hover",
  // Text-only — least emphasis (modal Cancel, inline dismiss).
  subtle: "text-muted hover:text-fg",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs",
  md: "h-9 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
