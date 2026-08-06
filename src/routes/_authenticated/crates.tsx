import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "motion/react";
import { Coins, History, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RarityChip } from "@/components/gamification/Identity";
import { CrateOpener, type CrateReward } from "@/components/gamification/CrateOpener";
import { openCrateFn } from "@/lib/gamification.functions";
import { getCrateHistory } from "@/lib/crates.functions";
import { RARITIES, RARITY_META, type Rarity } from "@/lib/leveling";
import { playSound } from "@/lib/sound";
import { useGamification } from "@/lib/use-gamification";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/crates")({
  head: () => ({
    meta: [
      { title: "Mystery Crates — MUN Hub" },
      { name: "description", content: "Open Common to Mythic mystery crates for coins, XP and exclusive cosmetics." },
      { property: "og:title", content: "Mystery Crates — MUN Hub" },
      { property: "og:description", content: "Premium crate openings with real rewards for Model UN delegates." },
    ],
  }),
  component: CratesPage,
});

function CratesPage() {
  const gamification = useGamification();
  const queryClient = useQueryClient();
  const open = useServerFn(openCrateFn);
  const fetchHistory = useServerFn(getCrateHistory);

  const history = useQuery({ queryKey: ["crate-history"], queryFn: () => fetchHistory({}) });

  const [active, setActive] = useState<Rarity | null>(null);
  const [reward, setReward] = useState<CrateReward | null>(null);

  const openMutation = useMutation({
    mutationFn: (rarity: Rarity) => open({ data: { rarity } }),
    onMutate: (rarity) => {
      setReward(null);
      setActive(rarity);
      playSound("click");
    },
    onSuccess: (result) => {
      setReward(result as CrateReward);
      void queryClient.invalidateQueries({ queryKey: ["gamification"] });
      void queryClient.invalidateQueries({ queryKey: ["crate-history"] });
    },
    onError: (error: Error) => {
      setActive(null);
      playSound("error");
      toast.error(error.message);
    },
  });

  const crates = gamification.data?.crates ?? [];
  const owned = new Map(crates.map((c) => [c.rarity as Rarity, c.quantity]));
  const founder = gamification.data?.founder ?? false;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold sm:text-3xl">
          <Package className="size-6 text-primary" />
          Mystery crates
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Earn crates from missions, streaks and level-ups — or buy them in the shop.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {RARITIES.map((rarity, index) => {
          const meta = RARITY_META[rarity];
          const quantity = founder ? 999 : (owned.get(rarity) ?? 0);
          return (
            <motion.div
              key={rarity}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border/70 bg-card/60 p-5 text-center backdrop-blur"
              style={{ boxShadow: `0 0 50px -28px ${meta.glow}` }}
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Package className={cn("mx-auto size-10", meta.color)} />
              </motion.div>
              <p className={cn("mt-3 font-display text-sm font-semibold", meta.color)}>{meta.label}</p>
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                {founder ? "Unlimited" : `${quantity} owned`}
              </p>
              <Button
                size="sm"
                className="mt-3 w-full"
                disabled={(!founder && quantity < 1) || openMutation.isPending}
                onClick={() => openMutation.mutate(rarity)}
              >
                <Sparkles className="size-3.5" />
                Open
              </Button>
            </motion.div>
          );
        })}
      </div>

      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <History className="size-4" /> Reward history
        </h2>
        {history.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : history.data?.rows.length ? (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card/60 backdrop-blur">
            {history.data.rows.map((row, index) => (
              <motion.li
                key={row.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.3 }}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <RarityChip rarity={row.rarity} />
                  <span className="text-muted-foreground">crate</span>
                </span>
                <span className="flex items-center gap-1.5">
                  {row.rewardType === "cosmetic" ? (
                    <>
                      <Sparkles className="size-3.5 text-primary" />
                      {row.rewardName}
                    </>
                  ) : (
                    <>
                      <Coins className="size-3.5 text-primary" />
                      {row.amount?.toLocaleString()} {row.rewardType === "xp" ? "XP" : "coins"}
                    </>
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString()}
                </span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No crates opened yet — your rewards will appear here.</p>
        )}
      </section>

      <CrateOpener
        open={active !== null}
        rarity={active ?? "common"}
        reward={reward}
        onClose={() => {
          setActive(null);
          setReward(null);
        }}
      />
    </div>
  );
}
