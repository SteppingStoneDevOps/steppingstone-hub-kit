import { cn } from "./cn";

export function IconButton({
  children,
  label,
  className,
  tone = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: "default" | "bright";
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-hover",
        tone === "bright" ? "text-fg hover:text-fg" : "text-muted hover:text-fg",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
