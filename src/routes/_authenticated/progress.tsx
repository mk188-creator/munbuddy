import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import * as Icons from "lucide-react";
import { Coins, Flame, Gift, Sparkles, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RarityChip, XPBar } from "@/components/gamification/Identity";
import { Counter } from "@/components/motion/primitives";
import { claimDaily, claimMissionReward } from "@/lib/gamification.functions";
import { titleForLevel } from "@/lib/leveling";
import { playSound } from "@/lib/sound";
import { useGamification } from "@/lib/use-gamification";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress — MUN Hub" },
      { name: "description", content: "Track your XP, level, streaks, daily missions and MUN achievements." },
      { property: "og:title", content: "Progress — MUN Hub" },
      { property: "og:description", content: "Level up your Model UN journey with XP, missions and achievements." },
    ],
  }),
  component: ProgressPage,
});

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: Icons.LucideIcon;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-border/70 bg-card/60 p-4 backdrop-blur"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
        <Counter value={value} />
      </p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </motion.div>
  );
}

function ProgressPage() {
  const state = useGamification();
  const queryClient = useQueryClient();
  const daily = useServerFn(claimDaily);
  const claimMission = useServerFn(claimMissionReward);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["gamification"] });

  const claimLogin = useMutation({
    mutationFn: () => daily({}),
    onSuccess: (result) => {
      if (result && "alreadyClaimed" in result && result.alreadyClaimed) {
        toast.info("Daily reward already claimed today.");
        return;
      }
      playSound("success");
      toast.success("Daily reward claimed!");
      void refresh();
    },
    onError: (error: Error) => {
      playSound("error");
      toast.error(error.message);
    },
  });

  const claim = useMutation({
    mutationFn: (missionId: string) => claimMission({ data: { missionId } }),
    onSuccess: () => {
      playSound("success");
      toast.success("Mission reward claimed!");
      void refresh();
    },
    onError: (error: Error) => {
      playSound("error");
      toast.error(error.message);
    },
  });

  if (state.isLoading || !state.data) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-6 py-8">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { stats, missions, achievements, unlocked, crates, founder } = state.data;
  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;
  const unlockedMap = new Map(unlocked.map((u) => [u.achievement_id, u]));
  const totalCrates = crates.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Progress</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {titleForLevel(level)}
            {founder && " · Founder"} — keep using MUN Hub to climb the ranks.
          </p>
        </div>
        <Button onClick={() => claimLogin.mutate()} disabled={claimLogin.isPending}>
          <Gift className="size-4" />
          Claim daily reward
        </Button>
      </header>

      <div className="mt-6 rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur">
        <XPBar level={level} xp={xp} lifetimeXp={Number(stats?.lifetime_xp ?? 0)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Coins} label="MUN Coins" value={Number(stats?.coins ?? 0)} />
        <Stat icon={Flame} label="Login streak" value={stats?.login_streak ?? 0} hint={`Best ${stats?.best_streak ?? 0} days`} />
        <Stat icon={Zap} label="Lifetime XP" value={Number(stats?.lifetime_xp ?? 0)} />
        <Stat icon={Gift} label="Crates" value={totalCrates} hint={`${stats?.crate_keys ?? 0} keys`} />
      </div>

      <Tabs defaultValue="missions" className="mt-8">
        <TabsList>
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="mt-4 space-y-6">
          {(["daily", "weekly"] as const).map((cadence) => {
            const list = missions.filter((m) => m.cadence === cadence);
            if (!list.length) return null;
            return (
              <section key={cadence}>
                <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {cadence} missions
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {list.map((mission, index) => {
                    const goal = mission.template.goal;
                    const percent = Math.min(100, Math.round((mission.progress / goal) * 100));
                    const done = Boolean(mission.completedAt) || mission.progress >= goal;
                    const claimed = Boolean(mission.claimedAt);
                    return (
                      <motion.div
                        key={mission.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.35 }}
                        className={cn(
                          "rounded-xl border border-border/70 bg-card/60 p-4 backdrop-blur transition-colors",
                          done && !claimed && "border-primary/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{mission.template.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{mission.template.description}</p>
                          </div>
                          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {Math.min(mission.progress, goal)}/{goal}
                          </span>
                        </div>
                        <Progress value={percent} className="mt-3 h-2" />
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <p className="text-[11px] text-muted-foreground">
                            +{mission.template.xp_reward} XP · +{mission.template.coin_reward} coins
                            {mission.template.crate_reward ? ` · ${mission.template.crate_reward} crate` : ""}
                          </p>
                          <Button
                            size="sm"
                            variant={claimed ? "ghost" : "default"}
                            disabled={!done || claimed || claim.isPending}
                            onClick={() => claim.mutate(mission.id)}
                          >
                            {claimed ? "Claimed" : done ? "Claim" : "In progress"}
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {!missions.length && (
            <p className="text-sm text-muted-foreground">Missions refresh shortly — check back in a moment.</p>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement, index) => {
              const mine = unlockedMap.get(achievement.id);
              const done = Boolean(mine?.unlocked_at);
              const percent = Math.min(100, Math.round(((mine?.progress ?? 0) / achievement.goal) * 100));
              const Icon =
                (Icons as unknown as Record<string, Icons.LucideIcon>)[achievement.icon] ?? Trophy;
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.35 }}
                  className={cn(
                    "rounded-xl border border-border/70 bg-card/60 p-4 backdrop-blur",
                    done ? "border-primary/50" : "opacity-90",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-lg border border-border/70",
                          done ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground",
                        )}
                      >
                        {done ? <Icon className="size-4" /> : <Sparkles className="size-4" />}
                      </span>
                      <p className="font-medium">{achievement.title}</p>
                    </div>
                    <RarityChip rarity={achievement.rarity} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{achievement.description}</p>
                  <Progress value={percent} className="mt-3 h-1.5" />
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    +{achievement.xp_reward} XP · +{achievement.coin_reward} coins
                  </p>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
