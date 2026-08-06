import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import * as Icons from "lucide-react";
import {
  CalendarDays,
  Coins,
  Flame,
  Globe2,
  GraduationCap,
  Instagram,
  Mail,
  Trophy,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelPill, RankBadge, RarityChip, XPBar } from "@/components/gamification/Identity";
import { getPublicProfile } from "@/lib/gamification.functions";
import { getFriendState, toggleFriend } from "@/lib/leaderboard.functions";
import { titleForLevel, KIND_LABEL, type CosmeticKind } from "@/lib/leveling";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — MUN Hub` },
      { name: "description", content: `Delegate profile for @${params.username} on MUN Hub.` },
      { property: "og:title", content: `@${params.username} — MUN Hub` },
      { property: "og:description", content: "Level, XP, ranks, badges and achievements on MUN Hub." },
    ],
  }),
  component: ProfilePage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="font-display text-xl font-semibold">Profile unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button asChild className="mt-4">
        <Link to="/leaderboard">Browse delegates</Link>
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="font-display text-xl font-semibold">Delegate not found</h1>
    </div>
  ),
});

function isOnline(lastSeen: string | null | undefined) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60_000;
}

function ProfilePage() {
  const { username } = Route.useParams();
  const fetchProfile = useServerFn(getPublicProfile);
  const fetchFriend = useServerFn(getFriendState);
  const follow = useServerFn(toggleFriend);
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["public-profile", username],
    queryFn: () => fetchProfile({ data: { username } }),
  });

  const userId = profileQuery.data?.profile.id;

  const friendQuery = useQuery({
    queryKey: ["friend-state", userId],
    queryFn: () => fetchFriend({ data: { userId: userId! } }),
    enabled: Boolean(userId),
  });

  const followMutation = useMutation({
    mutationFn: () => follow({ data: { friendId: userId! } }),
    onSuccess: (result) => {
      playSound(result.following ? "success" : "click");
      toast.success(result.following ? "Added to friends." : "Removed from friends.");
      void queryClient.invalidateQueries({ queryKey: ["friend-state", userId] });
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (error: Error) => {
      playSound("error");
      toast.error(error.message);
    },
  });

  if (profileQuery.isLoading || !profileQuery.data) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 px-6 py-8">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const { profile, stats, roles, achievements, cosmetics, ranks, equippedRank, conferenceCount } = profileQuery.data;
  const level = stats?.level ?? 1;
  const founder = roles.includes("founder");
  const online = isOnline(profile.last_seen_at);
  const displayName = profile.display_name || profile.full_name || profile.username;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur"
      >
        <div className="h-28 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--primary)_35%,transparent),transparent_70%)]" />
        <div className="flex flex-wrap items-end gap-4 px-5 pb-5">
          <div className="-mt-12 shrink-0">
            <span
              className={cn(
                "relative block rounded-full p-[3px]",
                founder
                  ? "bg-[conic-gradient(from_0deg,#f87171,#fbbf24,#34d399,#38bdf8,#a78bfa,#f87171)]"
                  : "bg-border",
              )}
            >
              <Avatar className="size-24 border-4 border-background">
                <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
                <AvatarFallback className="text-xl">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute bottom-1.5 right-1.5 size-4 rounded-full border-2 border-background",
                  online ? "bg-emerald-400" : "bg-muted-foreground/50",
                )}
                title={online ? "Online" : "Offline"}
              />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-semibold sm:text-2xl">{displayName}</h1>
              <LevelPill level={level} />
              <RankBadge rank={equippedRank} />
              {founder && (
                <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-300">
                  Founder
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              @{profile.username} · {titleForLevel(level)}
            </p>
            {profile.bio && <p className="mt-2 max-w-xl text-sm text-foreground/90">{profile.bio}</p>}
          </div>
          {!friendQuery.data?.isMe && (
            <Button
              variant={friendQuery.data?.following ? "surface" : "default"}
              disabled={followMutation.isPending || !userId}
              onClick={() => followMutation.mutate()}
            >
              {friendQuery.data?.following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
              {friendQuery.data?.following ? "Friends" : "Add friend"}
            </Button>
          )}
        </div>
      </motion.section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur">
          <XPBar level={level} xp={stats?.xp ?? 0} lifetimeXp={Number(stats?.lifetime_xp ?? 0)} />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className="inline-flex items-center gap-1 text-muted-foreground">
                <Coins className="size-3.5" /> Coins
              </p>
              <p className="font-semibold tabular-nums">{Number(stats?.coins ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="inline-flex items-center gap-1 text-muted-foreground">
                <Flame className="size-3.5" /> Streak
              </p>
              <p className="font-semibold tabular-nums">{stats?.login_streak ?? 0}</p>
            </div>
            <div>
              <p className="inline-flex items-center gap-1 text-muted-foreground">
                <Trophy className="size-3.5" /> MUNs
              </p>
              <p className="font-semibold tabular-nums">{conferenceCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 p-5 text-sm backdrop-blur">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">About</h2>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </li>
            {profile.country && (
              <li className="flex items-center gap-2">
                <Globe2 className="size-4" />
                {profile.country}
              </li>
            )}
            {profile.school && (
              <li className="flex items-center gap-2">
                <GraduationCap className="size-4" />
                {profile.school}
              </li>
            )}
            <li className="flex items-center gap-2">
              <UserCheck className="size-4" />
              {friendQuery.data?.followers ?? 0} friend{friendQuery.data?.followers === 1 ? "" : "s"}
            </li>
            {founder && (
              <li className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="https://instagram.com/M_Mustafa_khans"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-foreground hover:text-primary"
                >
                  <Instagram className="size-4" /> @M_Mustafa_khans
                </a>
                <a
                  href="mailto:mk0690188@gmail.com"
                  className="inline-flex items-center gap-1.5 text-foreground hover:text-primary"
                >
                  <Mail className="size-4" /> Email
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {ranks.length > 0 && (
        <section className="mt-4 rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ranks</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ranks.map((rank) => (
              <RankBadge key={rank.id} rank={rank} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Achievements ({achievements.length})
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement, index) => {
            const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[achievement.icon] ?? Trophy;
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.3 }}
                className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/40 p-3"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{achievement.title}</span>
                    <RarityChip rarity={achievement.rarity} />
                  </span>
                  <span className="block text-[11px] text-muted-foreground">{achievement.description}</span>
                </span>
              </motion.div>
            );
          })}
          {!achievements.length && <p className="text-sm text-muted-foreground">No achievements unlocked yet.</p>}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Cosmetics ({cosmetics.length})
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {cosmetics.map((cosmetic) => (
            <span
              key={cosmetic.id}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs"
            >
              {cosmetic.name}
              <span className="text-[10px] text-muted-foreground">
                {KIND_LABEL[cosmetic.kind as CosmeticKind] ?? cosmetic.kind}
              </span>
              <RarityChip rarity={cosmetic.rarity} />
            </span>
          ))}
          {!cosmetics.length && <p className="text-sm text-muted-foreground">No cosmetics collected yet.</p>}
        </div>
      </section>
    </div>
  );
}
