import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type StoredReward = {
  type?: string;
  amount?: number;
  cosmetic?: { name?: string };
};

export const getCrateHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("crate_openings")
      .select("id, rarity, reward, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);

    return {
      rows: (data ?? []).map((row) => {
        const reward = (row.reward ?? {}) as StoredReward;
        return {
          id: row.id,
          rarity: row.rarity,
          rewardType: reward.type ?? "coins",
          amount: reward.amount ?? null,
          rewardName: reward.cosmetic?.name ?? null,
          createdAt: row.created_at,
        };
      }),
    };
  });
