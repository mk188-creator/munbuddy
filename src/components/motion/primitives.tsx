import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform, animate } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Scroll-triggered reveal (with optional stagger index)                      */
/* -------------------------------------------------------------------------- */

export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "span";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}

/* -------------------------------------------------------------------------- */
/*  3D tilt card                                                               */
/* -------------------------------------------------------------------------- */

export function TiltCard({
  children,
  className,
  intensity = 8,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [intensity, -intensity]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-intensity, intensity]), { stiffness: 180, damping: 18 });
  const glowX = useTransform(mx, (v) => `${v * 100}%`);
  const glowY = useTransform(my, (v) => `${v * 100}%`);

  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        if (reduce) return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
      {...(reduce
        ? {}
        : {
            style: { rotateX: rx, rotateY: ry, transformPerspective: 900 },
            whileHover: { y: -4 },
          })}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className={cn("group relative [transform-style:preserve-3d]", className)}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={
          {
            background:
              "radial-gradient(240px circle at var(--gx) var(--gy), color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%)",
            "--gx": glowX,
            "--gy": glowY,
          } as never
        }
      />

      <div className="relative [transform:translateZ(0)]">{children}</div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Magnetic wrapper + ripple                                                  */
/* -------------------------------------------------------------------------- */

export function Magnetic({
  children,
  className,
  strength = 0.28,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });

  return (
    <motion.span
      ref={ref}
      className={cn("inline-flex", className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce) return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Animated counter                                                           */
/* -------------------------------------------------------------------------- */

export function Counter({
  to,
  suffix = "",
  duration = 1.4,
  className,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Decorative layers: particles, floating glass shapes, mouse glow            */
/* -------------------------------------------------------------------------- */

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: (i * 37) % 100,
  top: (i * 61) % 100,
  size: 2 + (i % 3),
  delay: (i % 7) * 0.6,
  duration: 9 + (i % 5) * 2,
}));

export function Particles({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-primary/40"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -28, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

const SHAPES = [
  { className: "left-[6%] top-[18%] size-24 rounded-3xl", rotate: 18, dur: 12 },
  { className: "right-[8%] top-[12%] size-16 rounded-full", rotate: -14, dur: 15 },
  { className: "left-[16%] bottom-[14%] size-14 rounded-2xl", rotate: 32, dur: 13 },
  { className: "right-[14%] bottom-[20%] size-20 rounded-[38%]", rotate: -22, dur: 17 },
];

/** Lightweight CSS-3D "glass" objects — depth + float without a WebGL scene. */
export function FloatingGlass({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 hidden [perspective:1000px] sm:block", className)}
    >
      {SHAPES.map((s, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute border border-primary/20 bg-primary/5 shadow-[0_20px_60px_-30px_var(--primary)] backdrop-blur-md",
            s.className,
          )}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -18, 0],
            rotateX: [s.rotate / 2, -s.rotate / 2, s.rotate / 2],
            rotateY: [-s.rotate, s.rotate, -s.rotate],
          }}
          transition={{
            opacity: { duration: 0.8, delay: i * 0.12 },
            scale: { duration: 0.8, delay: i * 0.12 },
            y: { duration: s.dur, repeat: Infinity, ease: "easeInOut" },
            rotateX: { duration: s.dur * 1.4, repeat: Infinity, ease: "easeInOut" },
            rotateY: { duration: s.dur * 1.6, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ))}
    </div>
  );
}

export function MouseGlow() {
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(-500), { stiffness: 120, damping: 22, mass: 0.6 });
  const y = useSpring(useMotionValue(-500), { stiffness: 120, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (reduce) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y, reduce]);

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-[5] hidden size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl md:block"
      style={{
        x,
        y,
        left: 0,
        top: 0,
        background:
          "radial-gradient(circle, color-mix(in oklab, var(--primary) 26%, transparent), transparent 65%)",
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Parallax                                                                   */
/* -------------------------------------------------------------------------- */

export function useParallax(distance = 60) {
  const reduce = useReducedMotion();
  const y = useMotionValue(0);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = Math.min(1, window.scrollY / 900);
        y.set(p * distance);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [distance, y, reduce]);

  return y;
}
