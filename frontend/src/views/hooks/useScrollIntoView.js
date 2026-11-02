import { useEffect } from 'react';

/** Smooth-scrolls to #elementId once `ready` is true (after a short delay so a highlight animation stays visible). */
export function useScrollIntoView(elementId, ready, delayMs = 300) {
  useEffect(() => {
    if (!elementId || !ready) return undefined;
    const timer = setTimeout(() => {
      document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' });
    }, delayMs);
    return () => clearTimeout(timer);
  }, [elementId, ready, delayMs]);
}
