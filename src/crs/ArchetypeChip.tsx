import { ARCHETYPE_META, type ArchetypeTone } from "./archetypes";
import type { Archetype } from "./types";

/**
 * Color-coded archetype chip with a hover tooltip (definition + what-to-do).
 * Pure CSS hover (Tailwind group-hover) — no client JS. Tokens flip with the theme.
 */
const TONE: Record<ArchetypeTone, string> = {
  danger: "text-red border-red/40 bg-red/12",
  warn: "text-yellow border-yellow/40 bg-yellow/12",
  info: "text-indigo border-indigo/40 bg-indigo/12",
  good: "text-green border-green/40 bg-green/12",
  neutral: "text-muted border-border bg-chip",
};

export function ArchetypeChip({ archetype }: { archetype: Archetype | null }) {
  if (!archetype) return <span className="text-faint">—</span>;
  const meta = ARCHETYPE_META[archetype];
  if (!meta) {
    return (
      <span className="inline-flex rounded-full border border-border bg-chip px-2.5 py-0.5 text-xs font-medium">
        {archetype}
      </span>
    );
  }
  return (
    <span className="group relative inline-flex">
      <span
        className={`inline-flex cursor-default rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE[meta.tone]}`}
      >
        {archetype}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 hidden w-64 rounded-lg border border-border bg-panel-2 p-3 text-left shadow-lg shadow-black/40 group-hover:block"
      >
        <span className="mb-1 block text-xs font-semibold text-fg">{archetype}</span>
        <span className="mb-2 block text-xs leading-snug text-muted">{meta.definition}</span>
        <span className="block text-xs leading-snug text-fg">
          <span className="font-semibold">Do:</span> {meta.intervention}
        </span>
      </span>
    </span>
  );
}
