import { cn } from "./cn";

type Tone = "brand" | "green" | "yellow" | "red" | "indigo" | "muted";

/**
 * Text colour for small text sitting on a 12–20% tint of the same token (badges, status and
 * archetype chips, initials circles). The raw token fails WCAG AA there: indigo #6686ff on its
 * 20% tint over #0f1a2b is 3.98:1 and red #ec4667 is 3.81:1 (2026-10-16 browser measurement).
 * Mixing 30% of `--color-fg` in lifts them to 5.5:1 and 5.1:1 (5.5:1 for red on the /15 tint)
 * while one token still drives the colour, and because the mix is toward the foreground rather
 * than white it moves the right way in the light theme too.
 *
 * v0.23.0: green, yellow and brand take the same mix. With the light tokens the hubs adopt
 * alongside it (brand #05698f, green #057064, yellow #7f5408, red #c0253f) every tone reaches
 * ≥5.0:1 on its /12–/20 tint over bg, panel and panel-2 in both themes (raw green on its /15
 * tint was 3.13:1 and brand 2.66:1 with the earlier light tokens). Plain coloured status text
 * (CRS momentum, overview percentages) uses it too: raw red on panel-2 is 4.28:1 in the dark.
 */
export const tintText = {
  brand: "text-[color:color-mix(in_srgb,var(--color-brand)_70%,var(--color-fg))]",
  green: "text-[color:color-mix(in_srgb,var(--color-green)_70%,var(--color-fg))]",
  yellow: "text-[color:color-mix(in_srgb,var(--color-yellow)_70%,var(--color-fg))]",
  indigo: "text-[color:color-mix(in_srgb,var(--color-indigo)_70%,var(--color-fg))]",
  red: "text-[color:color-mix(in_srgb,var(--color-red)_70%,var(--color-fg))]",
} as const;

const tones: Record<Tone, string> = {
  brand: `bg-brand/15 ${tintText.brand}`,
  green: `bg-green/15 ${tintText.green}`,
  yellow: `bg-yellow/20 ${tintText.yellow}`,
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
