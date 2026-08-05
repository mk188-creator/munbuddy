import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { levelProgress, RARITY_META, type Rarity } from "@/lib/leveling";
import { Progress } from "@/components/ui/progress";

export type RankLike = {
  id: string;
  key: string;
  label: string;
  color: string;
  icon: string;
  animation: string;
};

export function RankBadge({ rank, className }: { rank: RankLike | null | undefined; className?: string }) {
  if (!rank) return null;
  const rainbow = rank.animation === "rainbow";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        rank.animation === "glow" && "shadow-[0_0_16px_-4px_currentColor]",
        className,
      )}
      style={{
        color: rainbow ? undefined : rank.color,
        borderColor: `${rank.color}55`,
        backgroundColor: `${rank.color}14`,
        ...(rainbow
          ? {
              backgroundImage:
                "linear-gradient(90deg,#f87171,#fbbf24,#34d399,#38bdf8,#a78bfa,#f472b6,#f87171)",
              backgroundSize: "300% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              animation: "rank-rainbow 4s linear infinite",
            }
          : {}),
      }}
    >
      {rank.label}
    </span>
  );
}

export function LevelPill({ level, className }: { level: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-primary/12 px-1.5 py-0.5 text-[10px] font-bold text-primary tabular-nums",
        className,
      )}
    >
      LV {level}
    </span>
  );
}

export function XPBar({
  level,
  xp,
  lifetimeXp,
  className,
}: {
  level: number;
  xp: number;
  lifetimeXp?: number;
  className?: string;
}) {
  const progress = levelProgress(level, xp);
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-end justify-between text-xs">
        <span className="font-semibold text-foreground">Level {level}</span>
        <span className="tabular-nums text-muted-foreground">
          {progress.xpIntoLevel.toLocaleString()} / {progress.xpForNext.toLocaleString()} XP
        </span>
      </div>
      <div className="relative">
        <Progress value={progress.percent} className="h-2.5" />
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-primary/30 blur-md"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percent}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {lifetimeXp !== undefined && (
        <p className="text-[11px] text-muted-foreground">
          Lifetime XP <span className="tabular-nums text-foreground">{lifetimeXp.toLocaleString()}</span>
        </p>
      )}
    </div>
  );
}

export function RarityChip({ rarity, className }: { rarity: string; className?: string }) {
  const meta = RARITY_META[(rarity as Rarity) in RARITY_META ? (rarity as Rarity) : "common"];
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
        meta.color,
        meta.ring,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function UserChip({
  username,
  displayName,
  avatarUrl,
  level,
  rank,
  frameAnimated,
  className,
}: {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  level?: number;
  rank?: RankLike | null;
  frameAnimated?: boolean;
  className?: string;
}) {
  return (
    <Link
      to="/u/$username"
      params={{ username }}
      className={cn("group inline-flex items-center gap-2 transition-opacity hover:opacity-90", className)}
    >
      <span className={cn("relative rounded-full p-[2px]", frameAnimated ? "bg-[conic-gradient(from_0deg,#34d399,#38bdf8,#a78bfa,#f472b6,#34d399)]" : "bg-border")}>
        <Avatar className="size-7 border border-background">
          <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="text-[10px]">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-sm font-semibold group-hover:underline">{displayName}</span>
        {level !== undefined && <LevelPill level={level} />}
        <RankBadge rank={rank} />
      </span>
    </Link>
  );
}
