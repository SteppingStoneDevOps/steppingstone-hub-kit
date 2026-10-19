"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

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
 * trigger's `aria-describedby` at the bubble.
 *
 * Reflow (WCAG 1.4.10, v0.22.1): put `bubbleRef` on the bubble's positioning wrapper, give it
 * `HINT_LAYER` and render it only while `open` (`hidden` otherwise: display none takes no layout
 * width, and `aria-describedby` still reads hidden content). While open the hook places it
 * `position: fixed` under the trigger, so it never widens the page or gets clipped by an
 * `overflow-hidden` card: below 640px it spans the viewport less a 16px gutter each side; from
 * 640px it keeps its own width (cap it with `HINT_MAX_WIDTH`) and slides left to stay inside
 * the viewport. It follows the trigger on scroll and resize.
 */
export const HINT_LAYER = "fixed z-30 pt-1.5";
/** Bubble width cap: 24rem, or the viewport less the two 16px gutters when that is narrower. */
export const HINT_MAX_WIDTH = "max-w-[min(24rem,calc(100vw-2rem))]";
const GUTTER = 16;
const NARROW = 640;

function place(trigger: HTMLElement, layer: HTMLElement) {
  const r = trigger.getBoundingClientRect();
  const vw = document.documentElement.clientWidth || window.innerWidth;
  layer.style.top = `${r.bottom}px`;
  if (vw < NARROW) {
    layer.style.left = `${GUTTER}px`;
    layer.style.right = `${GUTTER}px`;
    return;
  }
  layer.style.right = "";
  const w = layer.offsetWidth;
  layer.style.left = `${Math.max(GUTTER, Math.min(r.left, vw - GUTTER - w))}px`;
}
export function useHoverHint() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = !dismissed && (hovered || focused);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const layer = bubbleRef.current;
    if (!open || !trigger || !layer) return;
    const update = () => place(trigger, layer);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

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
    triggerProps: { onClick, ref: triggerRef },
    bubbleRef,
  };
}
