"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * State for content shown on hover or keyboard focus (InfoHint, ArchetypeChip), built to meet
 * WCAG 1.4.13 Content on Hover or Focus:
 *
 * - Dismissible: Escape hides it without moving the pointer or the focus. The listener runs in
 *   the capture phase on `window` and stops the event, so the first Escape closes the hint and
 *   not an enclosing Modal or menu; the next Escape reaches them as usual.
 * - Hoverable: the hover is tracked on the wrapper that holds both the trigger and the bubble,
 *   so the pointer can move onto the bubble (render it without a gap and without
 *   `pointer-events-none`) and it stays.
 * - Persistent: no timers. It stays until hover and focus have both left the wrapper or the
 *   user dismisses it. A fresh hover, focus or click on the trigger shows it again.
 *
 * Mouse events, not pointer events: a tap on a touch screen fires the compatibility
 * mouseenter but no mouseleave until the user taps elsewhere, so the hint stays put on touch
 * the way a CSS `:hover` used to.
 *
 * Spread `rootProps` on the wrapper and `triggerProps` on the focusable trigger; point the
 * trigger's `aria-describedby` at the bubble and hide the bubble with `invisible` (not
 * `display: none`) when `open` is false, so the description is still computed.
 */
export function useHoverHint() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = !dismissed && (hovered || focused);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setDismissed(true);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  const onMouseEnter = useCallback(() => {
    setHovered(true);
    setDismissed(false);
  }, []);
  const onMouseLeave = useCallback(() => setHovered(false), []);
  const onFocus = useCallback((e: React.FocusEvent<HTMLElement>) => {
    // Focus moving between elements inside the wrapper is not a fresh focus.
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    setFocused(true);
    setDismissed(false);
  }, []);
  const onBlur = useCallback((e: React.FocusEvent<HTMLElement>) => {
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    setFocused(false);
  }, []);
  const onClick = useCallback(() => setDismissed(false), []);

  return {
    open,
    rootProps: { onMouseEnter, onMouseLeave, onFocus, onBlur },
    triggerProps: { onClick },
  };
}
