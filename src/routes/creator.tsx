import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Compass,
  Globe2,
  Instagram,
  Mail,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import {
  FloatingGlass,
  Magnetic,
  Particles,
  Reveal,
  TiltCard,
  useParallax,
} from "@/components/motion/primitives";
import portrait from "@/assets/creator-portrait.jpg";

export const Route = createFileRoute("/creator")({
  head: () => ({
    meta: [
      { title: "Meet the Creator — M_Mustafa_khan, Founder of MUN Hub" },
      {
        name: "description",
        content:
          "Meet M_Mustafa_khan, founder of MUN Hub — the mission, vision and journey behind an AI platform that makes Model United Nations preparation smarter and more accessible.",
      },
      { property: "og:title", content: "Meet the Creator — M_Mustafa_khan, Founder of MUN Hub" },
      {
        property: "og:description",
        content:
          "The mission, vision and journey behind MUN Hub, your complete Model United Nations platform.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreatorPage,
});

const INSTAGRAM = "https://instagram.com/M_Mustafa_khans";
const EMAIL = "mk0690188@gmail.com";

const sections = [
  {
    icon: Target,
    title: "My Mission",
    body: "To remove every unfair advantage in Model UN preparation. Whether a delegate has a coach, a research department and a decade of school archives — or nothing but a laptop and a deadline — MUN Hub should get them to the same standard of readiness.",
  },
  {
    icon: Compass,
    title: "My Vision",
    body: "A world where every delegate walks into committee informed, articulate and confident. MUN Hub is built to become the single platform where delegates research, write, rehearse and discover the conferences worth attending.",
  },
  {
    icon: Sparkles,
    title: "Why I Built MUN Hub",
    body: "Because the hardest part of MUN was never the debate — it was everything before it. Twelve open tabs, a half-finished position paper at 2am, and no reliable place to even find which conferences were open. The information existed; it was just scattered. MUN Hub pulls it into one workspace.",
  },
  {
    icon: Rocket,
    title: "My Journey",
    body: "It started in committee: as a delegate learning the format the slow way, session by session. Each tool in MUN Hub began as a real problem in a real debate — a stance I couldn't find, a clause I formatted wrong, a speech that ran forty seconds long. Building the platform became the natural continuation of the same work.",
  },
];

function CreatorPage() {
  const reduce = useReducedMotion();
  const parallax = useParallax(60);

  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative overflow-hidden px-4 pb-14 pt-16 sm:px-6">
        <motion.div
          aria-hidden
          className="aurora pointer-events-none absolute -top-48 left-1/2 size-[38rem] -translate-x-1/2 rounded-full opacity-60"
          style={{ y: parallax }}
        />
        <Particles />
        <FloatingGlass />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
          >
            <Globe2 className="size-3.5 text-primary" /> The person behind the platform
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-balance font-display text-4xl font-semibold sm:text-5xl"
          >
            Meet the <span className="text-gradient">creator</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base"
          >
            MUN Hub is built by a Model UN delegate turned builder — with one goal: give every
            delegate the preparation quality that the best-resourced teams take for granted.
          </motion.p>
        </div>
      </section>

      {/* --------------------------- Profile card ---------------------------- */}
      <section className="mx-auto w-full max-w-3xl px-4 pb-14 sm:px-6">
        <Reveal>
          <TiltCard className="rounded-3xl" intensity={6}>
            <div className="glass relative overflow-hidden px-6 py-10 text-center sm:px-10">
              <div aria-hidden className="aurora pointer-events-none absolute inset-0 opacity-35" />
              <div className="relative flex flex-col items-center">
                <motion.div
                  className="relative"
                  animate={reduce ? {} : { y: [0, -8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span
                    aria-hidden
                    className="absolute -inset-2 rounded-full opacity-60 blur-xl"
                    style={{ background: "var(--gradient-emerald)" }}
                  />
                  <img
                    src={portrait}
                    alt="Portrait of M_Mustafa_khan, founder of MUN Hub"
                    width={768}
                    height={768}
                    loading="lazy"
                    className="relative size-32 rounded-full border border-primary/30 object-cover shadow-2xl sm:size-40"
                  />
                </motion.div>

                <h2 className="mt-6 font-display text-2xl font-semibold sm:text-3xl">
                  M_Mustafa_khan
                </h2>
                <p className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Founder of MUN Hub
                </p>

                <p className="mt-6 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
                  “M_Mustafa_khan founded MUN Hub with the vision of making Model United Nations
                  preparation easier, smarter, and more accessible through AI, empowering delegates
                  around the world with high-quality research and diplomatic tools.”
                </p>

                <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                  <Magnetic>
                    <Button asChild variant="hero" size="lg">
                      <a href={`mailto:${EMAIL}`}>
                        <Mail className="size-4" /> {EMAIL}
                      </a>
                    </Button>
                  </Magnetic>
                  <Magnetic strength={0.18}>
                    <Button asChild variant="surface" size="lg">
                      <a href={INSTAGRAM} target="_blank" rel="noreferrer noopener">
                        <Instagram className="size-4" /> @M_Mustafa_khans
                      </a>
                    </Button>
                  </Magnetic>
                </div>
              </div>
            </div>
          </TiltCard>
        </Reveal>
      </section>

      {/* ------------------------- Mission / vision -------------------------- */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((item, i) => (
            <Reveal key={item.title} delay={(i % 2) * 0.08}>
              <TiltCard className="h-full rounded-xl" intensity={6}>
                <article className="panel h-full px-6 py-7">
                  <motion.span
                    className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"
                    animate={{ y: reduce ? 0 : [0, -5, 0] }}
                    transition={{ duration: 4.5 + i, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <item.icon className="size-5" />
                  </motion.span>
                  <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------ Contact ------------------------------ */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="glass relative overflow-hidden px-6 py-12 text-center sm:px-12">
            <div aria-hidden className="aurora pointer-events-none absolute inset-0 opacity-40" />
            <div className="relative flex flex-col items-center">
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">Get in touch</h2>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                Ideas for a new tool, feedback from your last committee, or a conference to list —
                messages go straight to me.
              </p>

              <a
                href={`mailto:${EMAIL}`}
                className="mt-6 font-display text-lg font-semibold text-gradient sm:text-xl"
              >
                {EMAIL}
              </a>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <motion.a
                  href={INSTAGRAM}
                  target="_blank"
                  rel="noreferrer noopener"
                  whileHover={{ y: -4, scale: 1.06 }}
                  transition={{ type: "spring", stiffness: 300, damping: 16 }}
                  aria-label="Instagram — @M_Mustafa_khans"
                  className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-background/60 text-muted-foreground hover:text-primary"
                >
                  <Instagram className="size-5" />
                </motion.a>
                <motion.a
                  href={`mailto:${EMAIL}`}
                  whileHover={{ y: -4, scale: 1.06 }}
                  transition={{ type: "spring", stiffness: 300, damping: 16 }}
                  aria-label={`Email ${EMAIL}`}
                  className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-background/60 text-muted-foreground hover:text-primary"
                >
                  <Mail className="size-5" />
                </motion.a>
              </div>

              <Magnetic className="mt-8">
                <Button asChild variant="hero" size="lg">
                  <Link to="/hub">
                    Browse conferences <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </Magnetic>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
