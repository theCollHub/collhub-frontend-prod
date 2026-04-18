import { useRef, useCallback } from "react";

/**
 * Hook to detect double-tap on mobile.
 * Prevents click navigation immediately after a double-tap.
 *
 * @param {Function} callback - Function to call on double-tap.
 * @param {number} delay - Maximum interval (ms) between taps to count as double-tap.
 * @returns {Function} handleTap - Event handler to attach to touch events.
 */
export default function useDoubleTap(callback, delay = 300) {
  const lastTapRef = useRef(0);

  const handleTap = useCallback(
    (event, arg) => {
      const now = Date.now();

      if (now - lastTapRef.current < delay) {
        callback?.(arg); // Trigger double-tap callback
        lastTapRef.current = 0; // Reset to prevent triple tap
        event?.preventDefault?.(); // Prevent default click/navigation
      } else {
        lastTapRef.current = now;
      }
    },
    [callback, delay]
  );

  return handleTap;
}