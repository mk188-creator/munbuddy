import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  MUN Hub hand-drawn decor primitives.                                       */
/*  Pure inline SVG, currentColor, no runtime cost. Use sparingly.             */
/* -------------------------------------------------------------------------- */

/** A rough ink rule used instead of a plain <hr>. */
export function SketchRule({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 8"
      preserveAspectRatio="none"
      className={cn("h-2 w-full text-foreground/40", className)}
    >
      <path
        d="M2 5.2C60 2.4 118 6.1 176 3.9c58-2.2 116 2.6 174 .8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Hand-drawn circle used to ring a word or number. */
export function InkCircle({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 60"
      className={cn("pointer-events-none absolute inset-0 h-full w-full text-foreground", className)}
    >
      <motion.path
        d="M60 4C28 4 6 15 6 30c0 16 24 26 55 26s53-11 53-26C114 15 91 4 60 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  );
}

/** Curved hand-drawn arrow for editorial annotations. */
export function InkArrow({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 90 60"
      className={cn("h-12 w-16 text-foreground/60", flip && "-scale-x-100", className)}
    >
      <path
        d="M6 8c22 2 44 12 54 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M50 44l11-2-3-11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Handwritten margin note. */
export function Annotation({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("hand text-lg leading-tight text-muted-foreground", className)}>
      {children}
    </span>
  );
}

/** Numbered editorial section header: 03 / GLOBAL COMMUNITY */
export function SectionMark({
  no,
  label,
  className,
}: {
  no: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="section-no">{no}</span>
      <span className="kicker">{label}</span>
      <span className="h-px flex-1 bg-foreground/25" />
    </div>
  );
}

/** Stamped "approved"-style rotated label. */
export function Stamp({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block -rotate-6 border-[2.5px] border-current px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--stamp)] opacity-80",
        className,
      )}
    >
      {children}
    </span>
  );
}
