import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Compass,
  FileText,
  Gavel,
  Globe2,
  Mic,
  Package,
  ScrollText,
  Siren,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import logo from "@/assets/mun-hub-logo.png";
import { Button } from "@/components/ui/button";
import { Counter, Magnetic, Reveal } from "@/components/motion/primitives";
import { Annotation, InkArrow, SectionMark, SketchRule, Stamp } from "@/components/motion/Doodles";
import { InkGlobe } from "@/components/motion/InkGlobe";
import { MUN_TOOLS } from "@/lib/mun-tools";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MUN Hub — The Operating System for Model United Nations" },
      {
        name: "description",
        content:
          "Research your delegation, draft position papers and resolutions, rehearse speeches, find conferences and rank up — the complete Model UN platform.",
      },
      { property: "og:title", content: "MUN Hub — The Operating System for Model United Nations" },
      {
        property: "og:description",
        content:
          "Research, draft, rehearse, compete. The complete Model United Nations platform for delegates and conferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const workspace = [
  { icon: Compass, title: "Country research", body: "Official stance, allies, red lines and voting history in seconds." },
  { icon: FileText, title: "Position papers", body: "Conference-ready papers in formal diplomatic register." },
  { icon: ScrollText, title: "Resolution builder", body: "Preambulatory and operative clauses, punctuated correctly." },
  { icon: Mic, title: "Speech writer", body: "30, 60 and 90 second speeches, word-counted for pace." },
  { icon: Gavel, title: "Motion coach", body: "The right motion, the exact wording, the vote threshold." },
  { icon: Siren, title: "Crisis desk", body: "Directives, press statements and escalation forecasting." },
];

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b-[1.5px] border-foreground/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <motion.img
            src={logo}
            alt="MUN Hub logo"
            className="size-8 border-[1.5px] border-foreground"
            whileHover={{ rotate: -6, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 320, damping: 14 }}
          />
          <span className="font-display text-base font-extrabold uppercase tracking-tight">
            MUN&nbsp;Hub
          </span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/hub">Conferences</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/creator">Creator</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden xs:inline-flex sm:inline-flex">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Magnetic strength={0.18}>
            <Button asChild variant="hero" size="sm">
              <Link to="/auth">Get started</Link>
            </Button>
          </Magnetic>
        </nav>
      </div>
    </header>
  );
}

function Landing() {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Nav />

      {/* 01 — HERO ------------------------------------------------------- */}
      <section className="relative border-b-[1.5px] border-foreground/80">
        <div className="gridpaper pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-wrap items-center gap-3"
            >
              <span className="tag">Est. 2026 · Delegate Edition</span>
              <Stamp>Committee ready</Stamp>
            </motion.div>

            <motion.h1
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="headline mt-6 text-[clamp(2.6rem,11vw,5.6rem)] uppercase"
            >
              The operating
              <br />
              system for
              <br />
              <span className="relative inline-block">
                <span className="marker">Model UN</span>
              </span>
            </motion.h1>

            <div className="mt-6 flex items-start gap-3">
              <div className="mt-1 h-16 w-1.5 shrink-0 bg-foreground" aria-hidden />
              <p className="max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Research your country, draft your papers, format your clauses, rehearse your
                speeches — then find the conference worth flying to. One desk for the whole
                circuit.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Button asChild variant="hero" size="xl">
                  <Link to="/auth">
                    Start preparing <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </Magnetic>
              <Button asChild variant="outline" size="xl">
                <Link to="/hub">Browse conferences</Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 divide-x-[1.5px] divide-foreground/30 border-y-[1.5px] border-foreground/30">
              {[
                { to: MUN_TOOLS.length, suffix: "+", label: "AI tools" },
                { to: 193, suffix: "", label: "Delegations" },
                { to: 100, suffix: "%", label: "Formal format" },
              ].map((stat) => (
                <div key={stat.label} className="px-3 py-4 first:pl-0">
                  <dt className="font-display text-2xl font-extrabold sm:text-3xl">
                    <Counter to={stat.to} suffix={stat.suffix} />
                  </dt>
                  <dd className="kicker mt-1 text-[9px]">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <InkGlobe />
          </div>
        </div>
      </section>

      {/* 02 — WHAT IT IS -------------------------------------------------- */}
      <section className="border-b-[1.5px] border-foreground/80 bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionMark no="02" label="The brief" />
          <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <h2 className="headline text-[clamp(2rem,6vw,3.4rem)] uppercase">
                Preparation is the
                <br />
                whole competition.
              </h2>
              <Annotation className="mt-4 block">…and it usually happens at 2am.</Annotation>
            </Reveal>
            <Reveal delay={0.1} className="space-y-5">
              <p className="text-lg leading-relaxed">
                Delegates lose awards to logistics: a clause phrased wrong, a stance half
                researched, a speech that overruns by twenty seconds. MUN Hub collapses that
                overhead into one workspace so the only thing left to do is{" "}
                <span className="marker-stamp font-semibold">think</span>.
              </p>
              <SketchRule />
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { n: "I", t: "Research", d: "Positions, blocs, history." },
                  { n: "II", t: "Draft", d: "Papers, clauses, speeches." },
                  { n: "III", t: "Perform", d: "Motions, crisis, debate." },
                ].map((step) => (
                  <div key={step.n} className="border-l-[1.5px] border-foreground pl-3">
                    <span className="font-mono text-xs tracking-[0.2em]">{step.n}</span>
                    <h3 className="mt-1 font-display text-lg font-bold">{step.t}</h3>
                    <p className="text-sm text-muted-foreground">{step.d}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 03 — AI WORKSPACE ------------------------------------------------ */}
      <section className="border-b-[1.5px] border-foreground/80">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionMark no="03" label="AI workspace" />
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="headline max-w-xl text-[clamp(1.9rem,5.5vw,3rem)] uppercase">
              {MUN_TOOLS.length} specialised tools, none of them a chatbot toy
            </h2>
            <InkArrow className="hidden sm:block" />
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {workspace.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <article
                  className={`ink-card hover-lift h-full p-5 ${i % 3 === 1 ? "tilt-1" : i % 3 === 2 ? "tilt-2" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center border-[1.5px] border-foreground">
                      <item.icon className="size-4" />
                    </span>
                    <h3 className="font-display text-base font-bold uppercase tracking-tight">
                      {item.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 04 — CONFERENCES -------------------------------------------------- */}
      <section className="border-b-[1.5px] border-foreground/80 bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionMark no="04" label="The circuit" />
            <h2 className="headline mt-6 text-[clamp(1.9rem,5.5vw,3rem)] uppercase">
              Every conference,
              <br />
              one directory.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Search by city, date, committee size and fee. Bookmark the ones you want, share a
              link with your delegation, or list your own MUN in minutes.
            </p>
            <Button asChild variant="outline" size="lg" className="mt-6">
              <Link to="/hub">
                Open the directory <Globe2 className="size-4" />
              </Link>
            </Button>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative">
              {["Geneva Summit", "Nairobi MUN", "Karachi Model UN"].map((name, i) => (
                <div
                  key={name}
                  className={`comic mb-3 flex items-center justify-between gap-3 p-4 ${i === 1 ? "tilt-1 ml-4" : i === 2 ? "tilt-2 ml-8" : ""}`}
                >
                  <div>
                    <p className="font-display text-base font-bold uppercase">{name}</p>
                    <p className="kicker mt-1">Hybrid · 400 delegates</p>
                  </div>
                  <span className="tag">Open</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 05 — COMMUNITY + 06 GAMIFICATION ---------------------------------- */}
      <section className="border-b-[1.5px] border-foreground/80">
        <div className="mx-auto grid w-full max-w-6xl gap-0 px-0 sm:px-6 lg:grid-cols-2">
          <Reveal className="border-b-[1.5px] border-foreground/40 px-4 py-14 sm:px-8 lg:border-b-0 lg:border-r-[1.5px]">
            <SectionMark no="05" label="Global community" />
            <h2 className="headline mt-6 text-[clamp(1.7rem,5vw,2.6rem)] uppercase">
              A committee room that never adjourns
            </h2>
            <p className="mt-4 text-muted-foreground">
              Live chat with delegates worldwide. Trade strategy, find co-submitters, post wins,
              react in the margins.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Users className="size-5" />
              <Annotation>bring your bloc</Annotation>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="px-4 py-14 sm:px-8">
            <SectionMark no="06" label="Progression" />
            <h2 className="headline mt-6 text-[clamp(1.7rem,5vw,2.6rem)] uppercase">
              XP, streaks, crates, ranks
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every paper drafted and speech rehearsed earns XP and MUN Coins. Missions renew
              daily. Crates drop cosmetics from Common to Mythic.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Level 42", "7-day streak", "Mythic crate"].map((chip) => (
                <span key={chip} className="tag">
                  {chip}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 07 — COSMETICS ---------------------------------------------------- */}
      <section className="border-b-[1.5px] border-foreground/80 bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionMark no="07" label="Identity" />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <h2 className="headline text-[clamp(1.9rem,5.5vw,3rem)] uppercase">
                Your placard, your rules
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Frames, titles, badges and backgrounds — drawn in the same ink as everything else.
                Equip them and they follow you into chat, leaderboards and your public profile.
              </p>
              <Button asChild variant="outline" size="lg" className="mt-6">
                <Link to="/auth">
                  Claim your handle <Sparkles className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: Trophy, label: "Titles" },
                { icon: Package, label: "Crates" },
                { icon: Sparkles, label: "Frames" },
                { icon: Globe2, label: "Flags" },
              ].map((c, i) => (
                <div
                  key={c.label}
                  className={`sketch grid aspect-square place-items-center gap-2 p-3 text-center ${i % 2 ? "tilt-2" : "tilt-1"}`}
                >
                  <c.icon className="size-6" />
                  <span className="kicker text-[9px]">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 08 — CTA ---------------------------------------------------------- */}
      <section className="relative border-b-[1.5px] border-foreground/80 bg-primary text-primary-foreground">
        <div className="halftone pointer-events-none absolute inset-0 opacity-20" aria-hidden />
        <div className="relative mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="kicker text-primary-foreground/70">Motion to adjourn debate</span>
          <h2 className="headline mt-4 text-[clamp(2.2rem,8vw,4.5rem)] uppercase">
            Be the delegate everyone yields to
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-primary-foreground/75">
            Free to start. No card. Your drafts, XP and cosmetics save to your account.
          </p>
          <div className="mt-8 flex justify-center">
            <Magnetic>
              <Button
                asChild
                size="xl"
                className="border-2 border-background bg-background text-foreground shadow-[5px_6px_0_0_var(--color-background)] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <Link to="/auth">
                  Create your account <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Magnetic>
          </div>
        </div>
      </section>

      {/* FOOTER ------------------------------------------------------------ */}
      <footer className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="" className="size-7 border-[1.5px] border-foreground" />
            <span className="font-display text-sm font-extrabold uppercase">MUN Hub</span>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link to="/hub" className="pen-link">
              Conferences
            </Link>
            <Link to="/creator" className="pen-link">
              Meet the creator
            </Link>
            <Link to="/auth" className="pen-link">
              Sign in
            </Link>
          </nav>
        </div>
        <SketchRule className="my-5" />
        <p className="kicker text-[9px]">
          © {new Date().getFullYear()} MUN Hub · The operating system for Model United Nations
        </p>
      </footer>
    </div>
  );
}
