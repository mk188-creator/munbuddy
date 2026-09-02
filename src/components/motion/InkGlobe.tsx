import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Hand-drawn rotating ink globe: meridians drawn in imperfect strokes, with
 * delegation nodes and diplomatic connection arcs. SVG-only so it stays fast
 * on mobile (no WebGL context, no texture loading).
 */
const NODES = [
  { x: 96, y: 62 },
  { x: 132, y: 96 },
  { x: 72, y: 124 },
  { x: 148, y: 148 },
  { x: 104, y: 168 },
  { x: 56, y: 92 },
];

export function InkGlobe({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <div className={cn("relative aspect-square w-full max-w-[26rem]", className)}>
      <svg viewBox="0 0 220 220" className="h-full w-full text-foreground" aria-hidden>
        {/* paper shadow disc */}
        <ellipse cx="112" cy="196" rx="70" ry="8" className="fill-foreground/10" />

        {/* outline */}
        <circle
          cx="110"
          cy="110"
          r="86"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="540 6"
        />
        <circle cx="110" cy="110" r="86" className="fill-background" opacity="0.55" />

        {/* halftone shading */}
        <defs>
          <pattern id="ink-dots" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.4" cy="1.4" r="1.05" className="fill-foreground/25" />
          </pattern>
          <clipPath id="globe-clip">
            <circle cx="110" cy="110" r="85" />
          </clipPath>
        </defs>
        <circle cx="110" cy="110" r="85" fill="url(#ink-dots)" opacity="0.5" />

        <g clipPath="url(#globe-clip)">
          {/* latitudes */}
          {[46, 78, 110, 142, 174].map((y, i) => (
            <path
              key={y}
              d={`M20 ${y}c30 ${i % 2 ? 7 : -7} 150 ${i % 2 ? -7 : 7} 180 0`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              opacity="0.5"
              strokeLinecap="round"
            />
          ))}

          {/* rotating meridians */}
          <motion.g
            animate={reduce ? undefined : { rotateY: 360 }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "110px 110px", transformStyle: "preserve-3d" }}
          >
            {[18, 42, 66].map((rx) => (
              <ellipse
                key={rx}
                cx="110"
                cy="110"
                rx={rx}
                ry="85"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                opacity="0.55"
              />
            ))}
          </motion.g>

          {/* diplomatic arcs */}
          {NODES.slice(0, 4).map((node, i) => {
            const next = NODES[(i + 2) % NODES.length];
            return (
              <motion.path
                key={`arc-${i}`}
                d={`M${node.x} ${node.y}Q${(node.x + next.x) / 2} ${Math.min(node.y, next.y) - 26} ${next.x} ${next.y}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray="4 5"
                initial={reduce ? { pathLength: 1 } : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.75 }}
                transition={{ duration: 1.6, delay: 0.4 + i * 0.25, ease: [0.65, 0, 0.35, 1] }}
              />
            );
          })}

          {/* delegation nodes */}
          {NODES.map((node, i) => (
            <motion.g
              key={`node-${i}`}
              initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.12, type: "spring", stiffness: 240, damping: 14 }}
              style={{ transformOrigin: `${node.x}px ${node.y}px` }}
            >
              <circle cx={node.x} cy={node.y} r="4.5" className="fill-background" />
              <circle
                cx={node.x}
                cy={node.y}
                r="4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </motion.g>
          ))}
        </g>

        {/* hand-drawn annotation flag */}
        <path
          d="M168 46c14-10 26-12 38-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          opacity="0.5"
          strokeLinecap="round"
        />
      </svg>

      <span className="hand absolute -right-1 top-2 text-base text-muted-foreground sm:text-lg">
        193 delegations
      </span>
      <span className="hand absolute bottom-4 -left-2 text-base text-muted-foreground sm:text-lg">
        one committee room
      </span>
    </div>
  );
}
