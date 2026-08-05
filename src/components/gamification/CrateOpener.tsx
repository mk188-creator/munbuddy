import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RARITY_META, type Rarity } from "@/lib/leveling";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { RarityChip } from "@/components/gamification/Identity";

export type CrateReward = {
  type: "coins" | "xp" | "cosmetic";
  rarity: Rarity;
  amount?: number;
  cosmetic?: { id: string; name: string; kind: string; key: string };
};

const REEL = ["common", "rare", "epic", "common", "legendary", "rare", "epic", "mythic", "rare", "common"] as Rarity[];

function Confetti({ color }: { color: string }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 420,
        y: -120 - Math.random() * 260,
        r: Math.random() * 540,
        d: 0.9 + Math.random() * 0.9,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-1/2 size-1.5 rounded-[2px]"
          style={{ backgroundColor: p.id % 3 === 0 ? color : "oklch(0.85 0.14 160)" }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.r }}
          transition={{ duration: p.d, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export function CrateOpener({
  open,
  rarity,
  reward,
  onClose,
}: {
  open: boolean;
  rarity: Rarity;
  reward: CrateReward | null;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"spinning" | "revealed">("spinning");
  const played = useRef(false);

  useEffect(() => {
    if (!open) {
      setPhase("spinning");
      played.current = false;
      return;
    }
    playSound("click");
    const timer = setTimeout(() => setPhase(reward ? "revealed" : "spinning"), 2200);
    return () => clearTimeout(timer);
  }, [open, reward]);

  useEffect(() => {
    if (phase === "revealed" && reward && !played.current) {
      played.current = true;
      playSound(reward.rarity === "mythic" || reward.rarity === "legendary" ? "notify" : "success");
    }
  }, [phase, reward]);

  const meta = RARITY_META[reward?.rarity ?? rarity];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md overflow-hidden border-border/60 bg-background/85 backdrop-blur-2xl"
      >
        <div className="relative flex min-h-[320px] flex-col items-center justify-center gap-6 py-4">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            style={{ background: `radial-gradient(closest-side, ${meta.glow}33, transparent 70%)` }}
          />

          <AnimatePresence mode="wait">
            {phase === "spinning" ? (
              <motion.div
                key="spin"
                className="relative w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <p className="mb-4 text-center text-sm text-muted-foreground">Opening {rarity} crate…</p>
                <div className="relative h-20 overflow-hidden rounded-xl border border-border/60 bg-card/60">
                  <motion.div
                    className="flex h-full items-center gap-3 px-3"
                    animate={{ x: [0, -1200] }}
                    transition={{ duration: 2.2, ease: [0.15, 0.6, 0.2, 1] }}
                  >
                    {[...REEL, ...REEL, ...REEL].map((r, i) => (
                      <span
                        key={i}
                        className={cn(
                          "flex size-14 shrink-0 items-center justify-center rounded-lg ring-1",
                          RARITY_META[r].ring,
                        )}
                        style={{ background: `${RARITY_META[r].glow}22` }}
                      >
                        <Sparkles className={cn("size-5", RARITY_META[r].color)} />
                      </span>
                    ))}
                  </motion.div>
                  <span className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-primary" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="reveal"
                className="relative flex flex-col items-center gap-3 text-center"
                initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 16 }}
              >
                <Confetti color={meta.glow} />
                <motion.span
                  className={cn("flex size-24 items-center justify-center rounded-2xl ring-2", meta.ring)}
                  style={{ background: `${meta.glow}26`, boxShadow: `0 0 60px -10px ${meta.glow}` }}
                  animate={
                    reward?.rarity === "mythic"
                      ? { rotate: [0, 6, -6, 0], scale: [1, 1.06, 1] }
                      : { scale: [1, 1.03, 1] }
                  }
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className={cn("size-10", meta.color)} />
                </motion.span>
                <RarityChip rarity={reward?.rarity ?? rarity} />
                <p className="font-display text-xl font-semibold">
                  {reward?.type === "cosmetic"
                    ? reward.cosmetic?.name
                    : reward?.type === "coins"
                      ? `${reward.amount?.toLocaleString()} MUN Coins`
                      : `${reward?.amount?.toLocaleString()} XP`}
                </p>
                {reward?.type === "cosmetic" && (
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {reward.cosmetic?.kind.replace("_", " ")}
                  </p>
                )}
                {reward?.rarity === "mythic" && (
                  <motion.p
                    className="text-xs font-semibold text-fuchsia-300"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    MYTHIC PULL — one in a thousand.
                  </motion.p>
                )}
                <Button variant="hero" size="sm" className="mt-2" onClick={onClose}>
                  Collect
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
