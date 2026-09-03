import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "motion/react";
import { Coins, Crown, Flame, Globe2, Medal, Trophy, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LevelPill, RankBadge } from "@/components/gamification/Identity";
import { getLeaderboardRows, type LeaderboardScope } from "@/lib/leaderboard.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboards — MUN Hub" },
      { name: "description", content: "Global, country, friends and conference leaderboards for MUN Hub delegates." },
      { property: "og:title", content: "Leaderboards — MUN Hub" },
      { property: "og:description", content: "See who leads the Model UN world on MUN Hub." },
    ],
  }),
  component: LeaderboardPage,
});

const SCOPES: Array<{ value: LeaderboardScope; label: string; icon: typeof Globe2 }> = [
  { value: "global", label: "Global", icon: Globe2 },
  { value: "country", label: "Country", icon: Medal },
  { value: "friends", label: "Friends", icon: Users },
  { value: "conference", label: "Conferences", icon: Trophy },
];

function LeaderboardPage() {
  const fetchRows = useServerFn(getLeaderboardRows);
  const [scope, setScope] = useState<LeaderboardScope>("global");

  const board = useQuery({
    queryKey: ["leaderboard", scope],
    queryFn: () => fetchRows({ data: { scope } }),
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold sm:text-3xl">
          <Trophy className="size-6 text-primary" />
          Leaderboards
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ranked by lifetime XP — conferences board ranks by MUNs listed.
        </p>
      </header>

      <Tabs value={scope} onValueChange={(value) => setScope(value as LeaderboardScope)} className="mt-6">
        <TabsList className="flex-wrap">
          {SCOPES.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="gap-1.5">
              <item.icon className="size-3.5" />
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4 overflow-hidden panel">
        {board.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : board.data?.rows.length ? (
          <ul className="divide-y divide-border/60">
            {board.data.rows.map((row, index) => (
              <motion.li
                key={row.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 15) * 0.025, duration: 0.3 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 sm:px-4",
                  row.isMe && "bg-primary/8",
                )}
              >
                <span
                  className={cn(
                    "w-7 shrink-0 text-center text-sm font-bold tabular-nums",
                    row.rank === 1 && "text-amber-300",
                    row.rank === 2 && "text-slate-300",
                    row.rank === 3 && "text-orange-300",
                    row.rank > 3 && "text-muted-foreground",
                  )}
                >
                  {row.rank <= 3 ? <Crown className="mx-auto size-4" /> : row.rank}
                </span>
                <Link
                  to="/u/$username"
                  params={{ username: row.username }}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Avatar className="size-9 border border-border/70">
                    <AvatarImage src={row.avatarUrl ?? undefined} alt={row.displayName} />
                    <AvatarFallback className="text-xs">{row.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold">{row.displayName}</span>
                      <LevelPill level={row.level} />
                      <RankBadge rank={row.rankBadge} />
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      @{row.username}
                      {row.country ? ` · ${row.country}` : ""}
                    </span>
                  </span>
                </Link>
                <span className="hidden shrink-0 items-center gap-3 text-xs tabular-nums text-muted-foreground sm:flex">
                  <span className="inline-flex items-center gap-1">
                    <Flame className="size-3.5" />
                    {row.streak}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Coins className="size-3.5" />
                    {row.coins.toLocaleString()}
                  </span>
                </span>
                <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {scope === "conference"
                    ? `${row.conferences} MUN${row.conferences === 1 ? "" : "s"}`
                    : `${row.lifetimeXp.toLocaleString()} XP`}
                </span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            {scope === "friends"
              ? "Add friends from their profile pages to build your friends board."
              : scope === "country"
                ? "Set your country in Settings to see your national ranking."
                : "No delegates on this board yet."}
          </p>
        )}
      </div>
    </div>
  );
}
