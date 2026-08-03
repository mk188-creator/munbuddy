import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2, Mail, Sparkles, Target } from "lucide-react";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import logo from "@/assets/mun-hub-logo.png";

export const Route = createFileRoute("/creator")({
  head: () => ({
    meta: [
      { title: "Meet the Creator — MUN Hub" },
      {
        name: "description",
        content:
          "The story behind MUN Hub: why a Model UN delegate built a complete platform for research, writing, speaking and conference discovery.",
      },
      { property: "og:title", content: "Meet the Creator — MUN Hub" },
      {
        property: "og:description",
        content: "The story and mission behind MUN Hub, your complete Model United Nations platform.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreatorPage,
});

const values = [
  {
    icon: Target,
    title: "Built from committee",
    body: "Every tool started as a real problem in a real committee session — not a feature list.",
  },
  {
    icon: Sparkles,
    title: "AI as a co-delegate",
    body: "Research, position papers, speeches and crisis strategy assisted, never outsourced.",
  },
  {
    icon: Globe2,
    title: "Open to every circuit",
    body: "The conference directory is free for organizers to list and free for delegates to browse.",
  },
];

function CreatorPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      <section className="relative overflow-hidden px-4 pb-10 pt-16 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-52 left-1/2 size-[34rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--gradient-emerald)" }}
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center animate-rise">
          <img
            src={logo}
            alt="Portrait placeholder for the creator of MUN Hub"
            className="size-24 rounded-2xl border border-border/70 shadow-lg"
          />
          <h1 className="mt-6 text-balance font-display text-3xl font-semibold sm:text-4xl">
            Meet the <span className="text-gradient">creator</span>
          </h1>
          <p className="mt-4 text-pretty text-sm text-muted-foreground sm:text-base">
            MUN Hub is built by a Model UN delegate turned builder, with one goal: give every
            delegate — regardless of school, budget or circuit — the same preparation quality that
            the best-resourced teams take for granted.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6">
        <article className="panel space-y-4 px-6 py-8 text-sm leading-relaxed text-muted-foreground">
          <p>
            It started with the usual pre-conference scramble: twelve browser tabs, a half-written
            position paper at 2am, and no idea which conferences were even open for registration.
            The information existed — it was just scattered across Instagram posts, PDFs and group
            chats.
          </p>
          <p>
            MUN Hub pulls that into one workspace. Eighteen AI tools cover research, drafting,
            speaking and crisis strategy. The document editor keeps every paper and speech in one
            place. And the conference directory is a shared, permanent listing that organizers
            publish once and delegates can search forever.
          </p>
          <p>
            It is still growing. If you organize a conference, list it. If you are a delegate with
            an idea for a tool, say so — the roadmap is shaped by the people using it.
          </p>
        </article>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {values.map((item) => (
            <article key={item.title} className="panel px-5 py-6 transition-transform hover:-translate-y-0.5">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <item.icon className="size-5" />
              </span>
              <h2 className="mt-4 font-display text-base font-semibold text-foreground">
                {item.title}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6">
        <div className="panel flex flex-col items-center gap-4 px-6 py-10 text-center">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">
            Want to shape what comes next?
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            List your conference in the directory or start using the workspace — feedback from real
            committees drives every release.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="hero" size="lg">
              <Link to="/hub">Browse conferences</Link>
            </Button>
            <Button asChild variant="surface" size="lg">
              <a href="mailto:hello@munhub.app">
                <Mail className="size-4" /> Get in touch
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
