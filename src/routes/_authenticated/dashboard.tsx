import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, FileText, MessagesSquare, Sparkle, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getUsageStats, getProfile } from "@/lib/profile.functions";
import { listThreads, createThread } from "@/lib/chat.functions";
import { MUN_TOOLS, getTool } from "@/lib/mun-tools";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MUN Hub" },
      { name: "description", content: "Your MUN preparation at a glance: recent chats, tool usage and documents." },
      { property: "og:title", content: "Dashboard — MUN Hub" },
      { property: "og:description", content: "Your Model UN preparation workspace." },
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

  const cards = [
    { label: "AI runs", value: stats.data?.totalRuns ?? 0, icon: Sparkle },
    { label: "This week", value: stats.data?.runsThisWeek ?? 0, icon: Wrench },
    { label: "Conversations", value: stats.data?.threadCount ?? 0, icon: MessagesSquare },
    { label: "Documents", value: stats.data?.documentCount ?? 0, icon: FileText },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pick up where you left off, or start a fresh brief.
          </p>
        </div>
        <Button variant="hero" onClick={() => start.mutate()} disabled={start.isPending}>
          {start.isPending ? "Opening…" : "New chat"}
        </Button>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {card.label}
              </span>
              <card.icon className="size-4 text-primary" />
            </div>
            {stats.isLoading ? (
              <Skeleton className="mt-3 h-8 w-16" />
            ) : (
              <p className="mt-2 font-display text-3xl font-semibold">{card.value}</p>
            )}
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Recent conversations</h2>
            <Link to="/chat" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {threads.isLoading && <Skeleton className="h-14 w-full" />}
            {threads.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No conversations yet. Start one to see it here.
              </p>
            )}
            {threads.data?.slice(0, 6).map((thread) => (
              <Link
                key={thread.id}
                to="/chat/$threadId"
                params={{ threadId: thread.id }}
                className="flex items-center justify-between panel px-4 py-3 transition-colors hover:border-primary/40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{thread.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {getTool(thread.tool)?.name ?? "Chat"} ·{" "}
                    {new Date(thread.updated_at).toLocaleDateString()}
                  </span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="font-display text-base font-semibold">Jump into a tool</h2>
          <div className="mt-4 grid gap-2">
            {MUN_TOOLS.slice(0, 6).map((tool) => (
              <Link
                key={tool.id}
                to="/tools/$toolId"
                params={{ toolId: tool.id }}
                className="panel px-4 py-3 transition-colors hover:border-primary/40"
              >
                <span className="block text-sm">{tool.name}</span>
                <span className="line-clamp-1 text-xs text-muted-foreground">{tool.tagline}</span>
              </Link>
            ))}
          </div>
          <Button asChild variant="surface" className="mt-4 w-full">
            <Link to="/tools">All {MUN_TOOLS.length} tools</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
