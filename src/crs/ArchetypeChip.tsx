"use client";

import { useId } from "react";
import { tintText } from "../Badge";
import { HINT_LAYER, useHoverHint } from "../useHoverHint";
import { ARCHETYPE_META, type ArchetypeTone } from "./archetypes";
import type { Archetype } from "./types";

/**
 * Color-coded archetype chip with a tooltip (definition + what-to-do) on hover or keyboard
 * focus. Tokens flip with the theme.
 *
 * WCAG 1.4.13 (v0.22.0, via `useHoverHint`): the chip is a focusable button, so keyboard users
 * reach the tooltip too (it was hover-only); Escape hides it without moving the pointer or
 * focus; the pointer can move onto the tooltip and it stays; nothing hides it on a timer.
 */
const TONE: Record<ArchetypeTone, string> = {
  danger: `${tintText.red} border-red/40 bg-red/12`,
  warn: "text-yellow border-yellow/40 bg-yellow/12",
  info: `${tintText.indigo} border-indigo/40 bg-indigo/12`,
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
  return <ArchetypeChipWithHint archetype={archetype} tone={meta.tone} definition={meta.definition} intervention={meta.intervention} />;
}

function ArchetypeChipWithHint({
  archetype,
  tone,
  definition,
  intervention,
}: {
  archetype: Archetype;
  tone: ArchetypeTone;
  definition: string;
  intervention: string;
}) {
  const tipId = useId();
  const { open, rootProps, triggerProps, bubbleRef } = useHoverHint();
  return (
    <span className="relative inline-flex" {...rootProps}>
      <button
        type="button"
        aria-describedby={tipId}
        ref={triggerProps.ref}
        onClick={(e) => {
          triggerProps.onClick();
          // Enter or Space on the chip shows its tooltip; it must not also fire a clickable
          // table row's navigation (StudentListView). A mouse click (detail > 0) still does.
          if (e.detail === 0) e.stopPropagation();
        }}
        className={`inline-flex cursor-default rounded-full border px-2.5 py-0.5 text-xs font-medium focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo/50 ${TONE[tone]}`}
      >
        {archetype}
      </button>
      {/* Padding, not margin, so the pointer crosses into the tooltip without leaving the wrapper.
          Fixed and placed by useHoverHint, `hidden` while closed (WCAG 1.4.10, v0.22.1). */}
      <span ref={bubbleRef} className={`${HINT_LAYER} ${open ? "block" : "hidden"}`}>
        <span
          id={tipId}
          role="tooltip"
          className="block w-64 max-w-[calc(100vw-2rem)] max-sm:w-auto max-sm:max-w-none rounded-lg border border-border bg-panel-2 p-3 text-left shadow-lg shadow-black/40"
        >
          <span className="mb-1 block text-xs font-semibold text-fg">{archetype}</span>
          <span className="mb-2 block text-xs leading-snug text-muted">{definition}</span>
          <span className="block text-xs leading-snug text-fg">
            <span className="font-semibold">Do:</span> {intervention}
          </span>
        </span>
      </span>
    </span>
  );
}
