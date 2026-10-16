import { cn } from "./cn";

type Tone = "brand" | "green" | "yellow" | "red" | "indigo" | "muted";

/**
 * Text colour for small text sitting on a 12–20% tint of the same token (badges, status and
 * archetype chips, initials circles). The raw token fails WCAG AA there: indigo #6686ff on its
 * 20% tint over #0f1a2b is 3.98:1 and red #ec4667 is 3.81:1 (2026-10-16 browser measurement).
 * Mixing 30% of `--color-fg` in lifts them to 5.5:1 and 5.1:1 (5.5:1 for red on the /15 tint)
 * while one token still drives the colour, and because the mix is toward the foreground rather
 * than white it moves the right way in the light theme too.
 */
export const tintText = {
  indigo: "text-[color:color-mix(in_srgb,var(--color-indigo)_70%,var(--color-fg))]",
  red: "text-[color:color-mix(in_srgb,var(--color-red)_70%,var(--color-fg))]",
} as const;

const tones: Record<Tone, string> = {
  brand: "bg-brand/15 text-brand",
  green: "bg-green/15 text-green",
  yellow: "bg-yellow/20 text-yellow",
  red: `bg-red/15 ${tintText.red}`,
  indigo: `bg-indigo/20 ${tintText.indigo}`,
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
