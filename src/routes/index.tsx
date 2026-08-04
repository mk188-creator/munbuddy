import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Compass,
  FileText,
  Gavel,
  Mic,
  ScrollText,
  ShieldCheck,
  Siren,
} from "lucide-react";

import logo from "@/assets/mun-hub-logo.png";
import { Button } from "@/components/ui/button";
import {
  Counter,
  FloatingGlass,
  Magnetic,
  Particles,
  Reveal,
  TiltCard,
  useParallax,
} from "@/components/motion/primitives";
import { MUN_TOOLS } from "@/lib/mun-tools";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MUN Hub — Your Complete Model United Nations Platform" },
      {
        name: "description",
        content:
          "Research your delegation, draft position papers and resolutions, and rehearse speeches with an AI coach built for Model UN delegates.",
      },
      { property: "og:title", content: "MUN Hub — Your Complete Model United Nations Platform" },
      {
        property: "og:description",
        content:
          "Research your delegation, draft position papers and resolutions, and rehearse speeches with an AI coach built for Model UN delegates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const highlights = [
  { icon: Compass, title: "Know your delegation", body: "Official stance, allies, red lines and voting history in seconds." },
  { icon: FileText, title: "Conference-ready papers", body: "Position papers and working papers in formal diplomatic register." },
  { icon: ScrollText, title: "Real resolution format", body: "Preambulatory and operative clauses with correct openers and punctuation." },
  { icon: Mic, title: "Speeches that fit the clock", body: "30, 60 and 90 second speeches, word-counted for speaking pace." },
  { icon: Gavel, title: "The right motion, now", body: "Situational motion coaching with exact wording and vote thresholds." },
  { icon: Siren, title: "Crisis-ready", body: "Private directives, press statements and escalation forecasting." },
];

function Landing() {
  const reduce = useReducedMotion();
  const parallax = useParallax(70);
  const parallaxSlow = useParallax(-40);

  const stats = [
    { value: MUN_TOOLS.length, suffix: "+", label: "Specialised AI tools" },
    { value: 3, suffix: "s", label: "To a first draft" },
    { value: 100, suffix: "%", label: "Committee-ready formatting" },
  ];

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <motion.img
            src={logo}
            alt="MUN Hub logo"
            className="size-9 rounded-xl"
            whileHover={{ rotate: 8, scale: 1.08 }}
            transition={{ type: "spring", stiffness: 320, damping: 14 }}
          />
          <span className="font-display text-lg font-semibold">MUN Hub</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/hub">MUN Hub</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/creator">Creator</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Magnetic>
            <Button asChild variant="hero" size="sm">
              <Link to="/auth">Get started</Link>
            </Button>
          </Magnetic>
        </nav>
      </header>

      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative overflow-hidden px-6 pb-24 pt-14 sm:pt-24">
        <motion.div
          aria-hidden
          className="aurora pointer-events-none absolute -top-56 left-1/2 size-[46rem] -translate-x-1/2 rounded-full opacity-60"
          style={reduce ? undefined : { y: parallax }}
        />
        <Particles />
        <FloatingGlass />

        <motion.div
          className="relative mx-auto max-w-3xl text-center"
          style={reduce ? undefined : { y: parallaxSlow }}
        >
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
          >
            <ShieldCheck className="size-3.5 text-primary" />
            Your Complete Model United Nations Platform
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-balance font-display text-4xl font-semibold leading-[1.05] sm:text-6xl"
          >
            Walk into committee <span className="text-gradient">already prepared</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg"
          >
            MUN Hub researches your country, drafts your papers, formats your clauses and
            rehearses your speeches — and lists the conferences worth attending next.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Magnetic>
              <Button asChild variant="hero" size="xl">
                <Link to="/auth">
                  Start preparing <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Magnetic>
            <Magnetic strength={0.18}>
              <Button asChild variant="surface" size="xl">
                <Link to="/hub">Browse conferences</Link>
              </Button>
            </Magnetic>
          </motion.div>

          <p className="mt-4 text-xs text-muted-foreground">
            {MUN_TOOLS.length} specialised tools · Threaded AI chat · Conference directory
          </p>
        </motion.div>
      </section>

      {/* ------------------------------ Stats ------------------------------- */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <div className="panel px-6 py-7 text-center">
                <p className="font-display text-4xl font-semibold text-gradient">
                  <Counter to={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ----------------------------- Features ----------------------------- */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 0.08}>
              <TiltCard className="h-full rounded-xl">
                <article className="panel h-full p-6">
                  <motion.span
                    className="inline-flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground"
                    animate={reduce ? undefined : { y: [0, -4, 0] }}
                    transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <item.icon className="size-5" />
                  </motion.span>
                  <h2 className="mt-4 font-display text-base font-semibold">{item.title}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------- CTA -------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <Reveal>
          <div className="panel relative overflow-hidden px-6 py-12 text-center sm:px-12">
            <div aria-hidden className="aurora pointer-events-none absolute inset-0 opacity-40" />
            <div className="relative">
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                Every tool a delegate needs, in one workspace
              </h2>
              <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
                {MUN_TOOLS.map((tool, i) => (
                  <motion.span
                    key={tool.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.5) }}
                    whileHover={{ y: -3, scale: 1.05 }}
                    className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    {tool.name}
                  </motion.span>
                ))}
              </div>
              <Magnetic className="mt-9">
                <Button asChild variant="hero" size="lg">
                  <Link to="/auth">Create your free account</Link>
                </Button>
              </Magnetic>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border/70 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            MUN Hub — AI assistance for Model United Nations. Always verify sourced facts before
            committee.
          </p>
          <nav className="flex gap-4">
            <Link to="/hub" className="transition-colors hover:text-foreground">
              Conferences
            </Link>
            <Link to="/creator" className="transition-colors hover:text-foreground">
              Meet the creator
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
