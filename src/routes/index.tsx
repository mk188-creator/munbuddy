import { createFileRoute, Link } from "@tanstack/react-router";
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
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="MUN Hub logo" className="size-9 rounded-xl" />
          <span className="font-display text-lg font-semibold">MUN Hub</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/auth">Get started</Link>
          </Button>
        </nav>
      </header>

      <section className="relative overflow-hidden px-6 pb-24 pt-14 sm:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-56 left-1/2 size-[44rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--gradient-emerald)" }}
        />
        <div className="relative mx-auto max-w-3xl text-center animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Built for delegates, chairs and crisis directors
          </span>
          <h1 className="mt-6 text-balance font-display text-4xl font-semibold leading-[1.05] sm:text-6xl">
            Walk into committee <span className="text-gradient">already prepared</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            MUN Hub researches your country, drafts your papers, formats your clauses and
            rehearses your speeches — so you spend committee negotiating, not scrambling.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/auth">
                Start preparing <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="surface" size="xl">
              <Link to="/auth">See the toolkit</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {MUN_TOOLS.length} specialised tools · Threaded AI chat · Document workspace
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="panel p-6">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <item.icon className="size-5" />
              </span>
              <h2 className="mt-4 font-display text-base font-semibold">{item.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="panel px-6 py-12 text-center sm:px-12">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Every tool a delegate needs, in one workspace
          </h2>
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
            {MUN_TOOLS.map((tool) => (
              <span
                key={tool.id}
                className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground"
              >
                {tool.name}
              </span>
            ))}
          </div>
          <Button asChild variant="hero" size="lg" className="mt-9">
            <Link to="/auth">Create your free account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/70 px-6 py-8">
        <p className="mx-auto max-w-6xl text-xs text-muted-foreground">
          MUN Hub — AI assistance for Model United Nations. Always verify sourced facts before
          committee.
        </p>
      </footer>
    </div>
  );
}
