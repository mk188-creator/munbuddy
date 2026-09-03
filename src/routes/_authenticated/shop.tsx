import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "motion/react";
import { Coins, Flame, KeyRound, Package, Store } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RarityChip } from "@/components/gamification/Identity";
import { buyCosmetic, buyCrate, getShop } from "@/lib/gamification.functions";
import { CRATE_PRICE, KIND_LABEL, RARITIES, RARITY_META, type CosmeticKind, type Rarity } from "@/lib/leveling";
import { playSound } from "@/lib/sound";
import { useGamification } from "@/lib/use-gamification";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/shop")({
  head: () => ({
    meta: [
      { title: "Cosmetic Shop — MUN Hub" },
      { name: "description", content: "Spend MUN Coins on frames, titles, themes, chat effects and mystery crates." },
      { property: "og:title", content: "Cosmetic Shop — MUN Hub" },
      { property: "og:description", content: "A daily rotating shop of premium Model UN cosmetics." },
    ],
  }),
  component: ShopPage,
});

const KIND_FILTERS: Array<CosmeticKind | "all"> = [
  "all",
  "frame",
  "badge",
  "title",
  "theme",
  "background",
  "chat_effect",
  "sticker",
];

function ShopPage() {
  const fetchShop = useServerFn(getShop);
  const purchase = useServerFn(buyCosmetic);
  const purchaseCrate = useServerFn(buyCrate);
  const queryClient = useQueryClient();
  const gamification = useGamification();
  const [kind, setKind] = useState<CosmeticKind | "all">("all");

  const shop = useQuery({ queryKey: ["shop"], queryFn: () => fetchShop({}) });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["shop"] }),
      queryClient.invalidateQueries({ queryKey: ["gamification"] }),
    ]);
  };

  const buyItem = useMutation({
    mutationFn: (cosmeticId: string) => purchase({ data: { cosmeticId } }),
    onSuccess: () => {
      playSound("success");
      toast.success("Purchased! Equip it from your inventory.");
      void refresh();
    },
    onError: (error: Error) => {
      playSound("error");
      toast.error(error.message);
    },
  });

  const buyCrateItem = useMutation({
    mutationFn: (rarity: Rarity) => purchaseCrate({ data: { rarity, price: CRATE_PRICE[rarity] } }),
    onSuccess: () => {
      playSound("success");
      toast.success("Crate added to your stash. Open it on the Crates page!");
      void refresh();
    },
    onError: (error: Error) => {
      playSound("error");
      toast.error(error.message);
    },
  });

  const coins = Number(gamification.data?.stats?.coins ?? 0);

  if (shop.isLoading || !shop.data) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-6 py-8">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const owned = new Set(shop.data.ownedIds);
  const catalog = shop.data.catalog.filter((item) => kind === "all" || item.kind === kind);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold sm:text-3xl">
            <Store className="size-6 text-primary" />
            Cosmetic shop
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Rotation for {shop.data.day} — new featured items every 24 hours.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 tag rounded-none px-3 py-1.5 text-sm font-semibold tabular-nums backdrop-blur">
          <Coins className="size-4 text-primary" />
          {coins.toLocaleString()}
        </span>
      </header>

      {shop.data.rotation.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Flame className="size-4" /> Daily rotation
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shop.data.rotation.map((entry, index) => {
              const meta = RARITY_META[(entry.cosmetic.rarity as Rarity) ?? "common"] ?? RARITY_META.common;
              const price = Math.round(entry.cosmetic.price * (1 - entry.discount / 100));
              const isOwned = owned.has(entry.cosmetic.id);
              return (
                <motion.article
                  key={entry.cosmetic.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "relative overflow-hidden panel p-4",
                    entry.featured && "border-primary/60",
                  )}
                  style={{ boxShadow: entry.featured ? `0 0 40px -22px ${meta.glow}` : undefined }}
                >
                  {entry.featured && (
                    <span className="absolute right-3 top-3 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      Featured
                    </span>
                  )}
                  <RarityChip rarity={entry.cosmetic.rarity} />
                  <h3 className="mt-2 font-display text-lg font-semibold">{entry.cosmetic.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {KIND_LABEL[entry.cosmetic.kind as CosmeticKind] ?? entry.cosmetic.kind}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                      <Coins className="size-4 text-primary" />
                      {price.toLocaleString()}
                      {entry.discount > 0 && (
                        <span className="text-xs font-normal text-muted-foreground line-through">
                          {entry.cosmetic.price.toLocaleString()}
                        </span>
                      )}
                    </span>
                    <Button
                      size="sm"
                      disabled={isOwned || buyItem.isPending}
                      onClick={() => buyItem.mutate(entry.cosmetic.id)}
                    >
                      {isOwned ? "Owned" : "Buy"}
                    </Button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Package className="size-4" /> Mystery crates
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {RARITIES.map((rarity, index) => {
            const meta = RARITY_META[rarity];
            return (
              <motion.div
                key={rarity}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.35 }}
                className="panel p-4 text-center"
                style={{ boxShadow: `0 0 40px -26px ${meta.glow}` }}
              >
                <Package className={cn("mx-auto size-8", meta.color)} />
                <p className={cn("mt-2 text-sm font-semibold", meta.color)}>{meta.label}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                  <Coins className="size-3" /> {CRATE_PRICE[rarity].toLocaleString()}
                </p>
                <Button
                  size="sm"
                  variant="surface"
                  className="mt-3 w-full"
                  disabled={buyCrateItem.isPending}
                  onClick={() => buyCrateItem.mutate(rarity)}
                >
                  <KeyRound className="size-3.5" />
                  Buy crate
                </Button>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {KIND_FILTERS.map((item) => (
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
              {item === "all" ? "All items" : KIND_LABEL[item]}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((item, index) => {
            const isOwned = owned.has(item.id);
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 14) * 0.03, duration: 0.32 }}
                className="panel p-4 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <RarityChip rarity={item.rarity} />
                  <span className="text-[11px] text-muted-foreground">
                    {KIND_LABEL[item.kind as CosmeticKind] ?? item.kind}
                  </span>
                </div>
                <h3 className="mt-2 font-medium">{item.name}</h3>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                    <Coins className="size-4 text-primary" />
                    {item.price.toLocaleString()}
                  </span>
                  <Button size="sm" variant="surface" disabled={isOwned || buyItem.isPending} onClick={() => buyItem.mutate(item.id)}>
                    {isOwned ? "Owned" : "Buy"}
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
        {!catalog.length && <p className="text-sm text-muted-foreground">Nothing in this category yet.</p>}
      </section>
    </div>
  );
}
