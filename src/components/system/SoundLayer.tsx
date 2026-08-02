import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import { playSound } from "@/lib/sound";

/**
 * Global UI feedback layer: a soft click on interactive elements and a
 * navigation tone whenever the route changes. Purely additive — it never
 * intercepts or blocks the underlying event.
 */
export function SoundLayer() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest(
        "button, a[href], [role='button'], [role='menuitem'], [role='tab'], [role='switch'], summary",
      );
      if (!interactive) return;
      if (interactive.getAttribute("aria-disabled") === "true") return;
      playSound("click");
    };
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const first = usePathnameChange(pathname);
  useEffect(() => {
    if (first) return;
    playSound("navigate");
  }, [pathname, first]);

  return null;
}

function usePathnameChange(pathname: string) {
  // Returns true only for the very first render so we don't chime on load.
  const key = `${pathname}`;
  return useFirstRender(key);
}

let mounted = false;
function useFirstRender(_key: string) {
  const isFirst = !mounted;
  useEffect(() => {
    mounted = true;
  }, []);
  return isFirst;
}
