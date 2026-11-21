import { useRef, type TouchEvent } from "react";

/**
 * Horizontal swipe handlers for an element. A swipe counts when the finger
 * travels at least 40px, mostly sideways; vertical drags are left to the
 * page, so pair it with `touch-pan-y` to keep scrolling native.
 *
 *   swipe left (finger moves left)   → onNext
 *   swipe right (finger moves right) → onPrevious
 */
export function useSwipe(onPrevious: () => void, onNext: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) onNext();
      else onPrevious();
    },
  };
}
