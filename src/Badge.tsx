import { cn } from "./cn";

type Tone = "brand" | "green" | "yellow" | "red" | "indigo" | "muted";

const tones: Record<Tone, string> = {
  brand: "bg-brand/15 text-brand",
  green: "bg-green/15 text-green",
  yellow: "bg-yellow/20 text-yellow",
  red: "bg-red/15 text-red",
  indigo: "bg-indigo/20 text-indigo",
  muted: "bg-chip text-muted",
};

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
