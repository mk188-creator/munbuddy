import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionMark, SketchRule, Annotation, Stamp } from "@/components/motion/Doodles";
import { getUsageStats, getProfile } from "@/lib/profile.functions";
import { listThreads, createThread } from "@/lib/chat.functions";
import { MUN_TOOLS, getTool } from "@/lib/mun-tools";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Desk — MUN Hub" },
      {
        name: "description",
        content: "Your Model UN command desk: recent briefs, tool usage, documents and progress.",
      },
      { property: "og:title", content: "Command Desk — MUN Hub" },
      { property: "og:description", content: "Your Model UN preparation workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchStats = useServerFn(getUsageStats);
  const fetchProfile = useServerFn(getProfile);
  const fetchThreads = useServerFn(listThreads);
  const newThread = useServerFn(createThread);

  const stats = useQuery({ queryKey: ["usage-stats"], queryFn: () => fetchStats({}) });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile({}) });
  const threads = useQuery({ queryKey: ["threads"], queryFn: () => fetchThreads({}) });

  const start = useMutation({
    mutationFn: () => newThread({ data: {} }),
    onSuccess: async (thread) => {
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      void navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
    },
  });

  const firstName = profile.data?.full_name?.split(" ")[0];

  const ledger = [
    { label: "AI runs", value: stats.data?.totalRuns ?? 0, note: "all sessions" },
    { label: "This week", value: stats.data?.runsThisWeek ?? 0, note: "last 7 days" },
    { label: "Briefs", value: stats.data?.threadCount ?? 0, note: "conversations" },
    { label: "Documents", value: stats.data?.documentCount ?? 0, note: "in the file" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Masthead */}
      <header className="relative border-b-2 border-foreground pb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="kicker">The MUN Hub · Command desk</span>
            <h1 className="headline mt-2 text-4xl sm:text-5xl">
              {firstName ? `Good to see you, ${firstName}.` : "Good to see you."}
            </h1>
            <Annotation className="mt-3 max-w-md">
              Pick up an open brief, or open the floor with a fresh one.
            </Annotation>
          </div>
          <div className="flex items-center gap-3">
            <Stamp className="hidden sm:block">In session</Stamp>
            <Button variant="hero" onClick={() => start.mutate()} disabled={start.isPending}>
              {start.isPending ? "Opening…" : "New brief"}
            </Button>
          </div>
        </div>
      </header>

      {/* Ledger strip — typographic, not four identical cards */}
      <section className="grid grid-cols-2 divide-foreground/25 border-b border-foreground/25 sm:grid-cols-4 sm:divide-x">
        {ledger.map((item) => (
          <div key={item.label} className="px-1 py-5 sm:px-5">
            <p className="kicker">{item.label}</p>
            {stats.isLoading ? (
              <Skeleton className="mt-2 h-9 w-16" />
            ) : (
              <p className="font-display text-4xl font-extrabold tabular-nums">{item.value}</p>
            )}
            <p className="hand text-sm text-muted-foreground">{item.note}</p>
          </div>
        ))}
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        {/* Dispatches */}
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="flex items-center gap-3 font-display text-xl font-extrabold">
              <SectionMark>01</SectionMark> Recent dispatches
            </h2>
            <Link to="/chat" className="pen-link font-mono text-[11px] uppercase tracking-widest">
              View all
            </Link>
          </div>
          <SketchRule className="mt-3" />

          <ol className="mt-4">
            {threads.isLoading && <Skeleton className="h-16 w-full" />}
            {threads.data?.length === 0 && (
              <p className="hand py-6 text-base text-muted-foreground">
                Nothing filed yet — your first brief will appear here.
              </p>
            )}
            {threads.data?.slice(0, 6).map((thread, index) => (
              <li key={thread.id}>
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: thread.id }}
                  className="group flex items-center gap-4 border-b border-dashed border-foreground/25 py-3.5 transition-colors hover:bg-accent/60"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{thread.title}</span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {getTool(thread.tool)?.name ?? "Chat"} ·{" "}
                      {new Date(thread.updated_at).toLocaleDateString()}
                    </span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* Instruments */}
        <section className="relative">
          <h2 className="flex items-center gap-3 font-display text-xl font-extrabold">
            <SectionMark>02</SectionMark> Instruments
          </h2>
          <SketchRule className="mt-3" />

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {MUN_TOOLS.slice(0, 6).map((tool) => (
              <Link
                key={tool.id}
                to="/tools/$toolId"
                params={{ toolId: tool.id }}
                className="ink-card hover-lift block px-4 py-3"
              >
                <span className="block text-sm font-semibold">{tool.name}</span>
                <span className="line-clamp-1 text-xs text-muted-foreground">{tool.tagline}</span>
              </Link>
            ))}
          </div>

          <Button asChild variant="surface" className="mt-4 w-full">
            <Link to="/tools">All {MUN_TOOLS.length} instruments</Link>
          </Button>

          <div className="mt-8 dashed-rule p-4">
            <p className="kicker">Standing orders</p>
            <p className="hand mt-1 text-base">
              Draft early, cite hard, and never let the chair catch you unprepared.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/progress">Progress</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/community">Community</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/hub">Conferences</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
