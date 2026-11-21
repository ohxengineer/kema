import { useSyncExternalStore } from "react";

/**
 * Whether a media query matches, kept in sync as it changes. On the server
 * (and the first client render) it reports `false`, so mobile is the default.
 */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
