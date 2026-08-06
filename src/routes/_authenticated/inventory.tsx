import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "motion/react";
import { Backpack, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RankBadge, RarityChip } from "@/components/gamification/Identity";
import { equipCosmetic, equipRank } from "@/lib/gamification.functions";
import { COSMETIC_KINDS, KIND_LABEL, type CosmeticKind } from "@/lib/leveling";
import { playSound } from "@/lib/sound";
import { useGamification } from "@/lib/use-gamification";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — MUN Hub" },
      { name: "description", content: "Equip your frames, titles, badges, themes, backgrounds and chat effects." },
      { property: "og:title", content: "Inventory — MUN Hub" },
      { property: "og:description", content: "Your MUN Hub cosmetics collection." },
    ],
  }),
  component: InventoryPage,
});

const EQUIPPABLE: Record<string, "equipped_frame" | "equipped_background" | "equipped_title" | "equipped_chat_effect"> = {
  frame: "equipped_frame",
  background: "equipped_background",
  title: "equipped_title",
  chat_effect: "equipped_chat_effect",
};

function InventoryPage() {
  const state = useGamification();
  const queryClient = useQueryClient();
  const equip = useServerFn(equipCosmetic);
  const setRank = useServerFn(equipRank);
  const [kind, setKind] = useState<CosmeticKind | "all">("all");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["gamification"] });

  const equipMutation = useMutation({
    mutationFn: (input: { slot: string; cosmeticId: string | null }) => equip({ data: input }),
    onSuccess: () => {
      playSound("success");
      toast.success("Loadout updated.");
      void refresh();
    },
    onError: (error: Error) => {
      playSound("error");
      toast.error(error.message);
    },
  });

  const rankMutation = useMutation({
    mutationFn: (rankId: string | null) => setRank({ data: { rankId } }),
    onSuccess: () => {
      playSound("success");
      toast.success("Showcased rank updated.");
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
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const { inventory, profile, ranks, myRankIds } = state.data;
  const myRanks = ranks.filter((rank) => myRankIds.includes(rank.id));
  const items = inventory.filter((entry) => kind === "all" || entry.cosmetic.kind === kind);

  const equippedIds = new Set(
    [profile?.equipped_frame, profile?.equipped_background, profile?.equipped_title, profile?.equipped_chat_effect].filter(
      Boolean,
    ) as string[],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold sm:text-3xl">
          <Backpack className="size-6 text-primary" />
          Inventory
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {inventory.length} item{inventory.length === 1 ? "" : "s"} collected. Equip what represents you.
        </p>
      </header>

      <section className="mt-6 rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Showcased rank
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => rankMutation.mutate(null)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              !profile?.equipped_rank
                ? "border-primary/60 bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            None
          </button>
          {myRanks.map((rank) => (
            <button
              key={rank.id}
              type="button"
              onClick={() => rankMutation.mutate(rank.id)}
              className={cn(
                "rounded-full border px-2 py-1 transition-transform hover:-translate-y-0.5",
                profile?.equipped_rank === rank.id ? "border-primary/60" : "border-border",
              )}
            >
              <RankBadge rank={rank} />
            </button>
          ))}
          {!myRanks.length && <p className="text-sm text-muted-foreground">Level up to unlock ranks.</p>}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        {(["all", ...COSMETIC_KINDS] as Array<CosmeticKind | "all">).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setKind(item)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              kind === item
                ? "border-primary/60 bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {item === "all" ? "All" : KIND_LABEL[item]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((entry, index) => {
          const slot = EQUIPPABLE[entry.cosmetic.kind];
          const isEquipped = equippedIds.has(entry.cosmetic.id);
          return (
            <motion.article
              key={entry.cosmetic.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 14) * 0.03, duration: 0.35 }}
              className={cn(
                "rounded-xl border border-border/70 bg-card/60 p-4 backdrop-blur transition-transform hover:-translate-y-0.5",
                isEquipped && "border-primary/60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <RarityChip rarity={entry.cosmetic.rarity} />
                <span className="text-[11px] text-muted-foreground">
                  {KIND_LABEL[entry.cosmetic.kind as CosmeticKind] ?? entry.cosmetic.kind}
                </span>
              </div>
              <h3 className="mt-2 font-medium">{entry.cosmetic.name}</h3>
              <p className="text-[11px] text-muted-foreground">From {entry.acquiredFrom.replace("_", " ")}</p>
              {slot ? (
                <Button
                  size="sm"
                  variant={isEquipped ? "surface" : "default"}
                  className="mt-3 w-full"
                  disabled={equipMutation.isPending}
                  onClick={() =>
                    equipMutation.mutate({
                      slot: entry.cosmetic.kind,
                      cosmeticId: isEquipped ? null : entry.cosmetic.id,
                    })
                  }
                >
                  {isEquipped ? (
                    <>
                      <Check className="size-3.5" /> Equipped
                    </>
                  ) : (
                    "Equip"
                  )}
                </Button>
              ) : (
                <p className="mt-3 text-[11px] text-muted-foreground">Collectible — shown on your profile.</p>
              )}
            </motion.article>
          );
        })}
      </div>
      {!items.length && (
        <p className="mt-6 text-sm text-muted-foreground">
          Nothing here yet. Visit the shop or open a mystery crate to start your collection.
        </p>
      )}
    </div>
  );
}
