// Horizontal edge auto-scroll: when the cursor hovers within a threshold of the
// scroll container's left/right edge, the board scrolls that way on its own —
// handy for wide boards without reaching for the scrollbar or trackpad. Speed
// ramps up the closer you get to the edge.
//
// Disabled while dragging (dnd-kit runs its own auto-scroll during a drag) and
// whenever the container isn't horizontally overflowing.

import { useEffect, useRef, useState } from "react";

interface Options {
  /** Distance from an edge, in px, that arms scrolling. */
  threshold?: number;
  /** Peak scroll speed in px per frame at the very edge. */
  maxSpeed?: number;
  /** Turn the behavior off (e.g. during a drag). */
  enabled?: boolean;
}

type Edge = "left" | "right" | null;

export function useEdgeAutoScroll<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  { threshold = 90, maxSpeed = 22, enabled = true }: Options = {},
) {
  // Exposed so the UI can show a subtle cue on the active edge.
  const [activeEdge, setActiveEdge] = useState<Edge>(null);
  const speedRef = useRef(0);
  const directionRef = useRef<Edge>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) {
      setActiveEdge(null);
      return;
    }

    const canScroll = () => el.scrollWidth - el.clientWidth > 1;

    const step = () => {
      const dir = directionRef.current;
      if (dir && canScroll()) {
        const delta = dir === "left" ? -speedRef.current : speedRef.current;
        el.scrollLeft += delta;
      }
      frameRef.current = requestAnimationFrame(step);
    };

    const stop = () => {
      directionRef.current = null;
      speedRef.current = 0;
      setActiveEdge(null);
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!canScroll()) {
        stop();
        return;
      }
      const rect = el.getBoundingClientRect();
      // Only react when the cursor is vertically over the board area.
      if (e.clientY < rect.top || e.clientY > rect.bottom) {
        stop();
        return;
      }

      const fromLeft = e.clientX - rect.left;
      const fromRight = rect.right - e.clientX;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;

      let dir: Edge = null;
      let intensity = 0;
      if (fromLeft < threshold && !atStart) {
        dir = "left";
        intensity = (threshold - fromLeft) / threshold;
      } else if (fromRight < threshold && !atEnd) {
        dir = "right";
        intensity = (threshold - fromRight) / threshold;
      }

      if (!dir) {
        stop();
        return;
      }

      directionRef.current = dir;
      speedRef.current = Math.max(2, intensity * maxSpeed);
      setActiveEdge(dir);
      if (frameRef.current == null) frameRef.current = requestAnimationFrame(step);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", stop);
    window.addEventListener("blur", stop);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", stop);
      window.removeEventListener("blur", stop);
      stop();
    };
  }, [ref, threshold, maxSpeed, enabled]);

  return activeEdge;
}
