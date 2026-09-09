import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

/* ---------------------------------------------------------------- Ripple -- */

/** Global click ripple on buttons and links. Pure DOM, zero re-renders. */
export function RippleLayer() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "button, a, [role='button']",
      );
      if (!target || target.hasAttribute("data-no-ripple")) return;

      const rect = target.getBoundingClientRect();
      if (rect.width === 0) return;

      const style = getComputedStyle(target);
      if (style.position === "static") target.style.position = "relative";
      target.style.overflow = "hidden";

      const size = Math.max(rect.width, rect.height) * 2;
      const span = document.createElement("span");
      span.className = "ui-ripple";
      span.style.width = `${size}px`;
      span.style.height = `${size}px`;
      span.style.left = `${e.clientX - rect.left - size / 2}px`;
      span.style.top = `${e.clientY - rect.top - size / 2}px`;
      target.appendChild(span);
      span.addEventListener("animationend", () => span.remove(), { once: true });
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}

/* ------------------------------------------------------- Page transitions -- */

/**
 * Stable wrapper — deliberately NOT keyed by pathname.
 *
 * Keying it remounted the entire route tree (sidebar, providers, queries)
 * on every navigation, which is what made pages blink back to the old view
 * and then jump forward. Page-level fades are done with CSS on the content
 * itself instead, so nothing unmounts.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="contents">{children}</div>;
}

/* ---------------------------------------------------------- Loading veil -- */

export function LoadingScreen() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Only on the very first visit of a browser session — never again, so it
    // can't veil an in-app navigation.
    if (sessionStorage.getItem("munhub:booted")) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => {
      sessionStorage.setItem("munhub:booted", "1");
      setDone(true);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col items-center gap-4">
            <motion.span
              className="size-10 border-2 border-foreground bg-foreground"
              animate={{ rotate: [0, 90, 180, 270, 360], borderRadius: ["30%", "50%", "30%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              className="font-display text-sm tracking-wide text-muted-foreground"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              MUN Hub
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
