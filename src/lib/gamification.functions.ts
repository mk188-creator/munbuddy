import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import type { Rarity } from "@/lib/leveling";

export const getGamificationState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("@/lib/gamification.server");
    const userId = context.userId;

    await engine.ensureStats(userId);
    await engine.ensureMissions(userId);
    const founder = await engine.isFounder(userId);

    const [stats, missions, achievements, unlocked, crates, inventory, ranks, myRanks, profile, roles] =
      await Promise.all([
        context.supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
        context.supabase
          .from("user_missions")
          .select("id, progress, cadence, period_start, completed_at, claimed_at, mission_templates!inner(*)")
          .eq("user_id", userId),
        context.supabase.from("achievements").select("*").order("rarity"),
        context.supabase.from("user_achievements").select("achievement_id, progress, unlocked_at").eq("user_id", userId),
        context.supabase.from("user_crates").select("rarity, quantity").eq("user_id", userId),
        context.supabase
          .from("user_cosmetics")
          .select("cosmetic_id, acquired_from, cosmetics!inner(*)")
          .eq("user_id", userId),
        context.supabase.from("ranks").select("*").order("priority", { ascending: false }),
        context.supabase.from("user_ranks").select("rank_id").eq("user_id", userId),
        context.supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        context.supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);

    return {
      founder,
      roles: (roles.data ?? []).map((r) => r.role as string),
      stats: stats.data,
      missions: (missions.data ?? []).map((m) => ({
        id: m.id,
        progress: m.progress,
        cadence: m.cadence,
        completedAt: m.completed_at,
        claimedAt: m.claimed_at,
        template: m.mission_templates as unknown as Tables<"mission_templates">,
      })),
      achievements: achievements.data ?? [],
      unlocked: unlocked.data ?? [],
      crates: crates.data ?? [],
      inventory: (inventory.data ?? []).map((i) => ({
        acquiredFrom: i.acquired_from,
        cosmetic: i.cosmetics as unknown as Tables<"cosmetics">,
      })),
      ranks: ranks.data ?? [],
      myRankIds: (myRanks.data ?? []).map((r) => r.rank_id),
      profile: profile.data,
    };
  });

export const claimDaily = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("@/lib/gamification.server");
    return engine.claimDailyLogin(context.userId);
  });

export const trackActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { metric: string; amount?: number; xp?: number; coins?: number }) => input)
  .handler(async ({ data, context }) => {
    const engine = await import("@/lib/gamification.server");
    await engine.trackMetric(context.userId, data.metric, data.amount ?? 1);
    if (data.xp) return engine.awardXp(context.userId, data.metric, data.xp, data.coins ?? 0);
    return { xpGained: 0, coinsGained: 0, level: 0, levelsGained: 0, newTitleUnlocked: false };
  });

export const claimMissionReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { missionId: string }) => input)
  .handler(async ({ data, context }) => {
    const engine = await import("@/lib/gamification.server");
    return engine.claimMission(context.userId, data.missionId);
  });

export const openCrateFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { rarity: Rarity }) => input)
  .handler(async ({ data, context }) => {
    const engine = await import("@/lib/gamification.server");
    return engine.openCrate(context.userId, data.rarity);
  });

export const getShop = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const engine = await import("@/lib/gamification.server");
    await engine.ensureShopRotation();
    const day = engine.todayISO();
    const [rotation, all, owned] = await Promise.all([
      context.supabase
        .from("shop_rotation")
        .select("cosmetic_id, featured, discount_pct, cosmetics!inner(*)")
        .eq("rotation_date", day),
      context.supabase.from("cosmetics").select("*").eq("founder_only", false).order("price"),
      context.supabase.from("user_cosmetics").select("cosmetic_id").eq("user_id", context.userId),
    ]);
    return {
      day,
      rotation: (rotation.data ?? []).map((r) => ({
        featured: r.featured,
        discount: r.discount_pct,
        cosmetic: r.cosmetics as unknown as Tables<"cosmetics">,
      })),
      catalog: all.data ?? [],
      ownedIds: (owned.data ?? []).map((o) => o.cosmetic_id),
    };
  });

export const buyCosmetic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { cosmeticId: string }) => input)
  .handler(async ({ data, context }) => {
    const engine = await import("@/lib/gamification.server");
    return engine.purchaseCosmetic(context.userId, data.cosmeticId);
  });

export const buyCrate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { rarity: Rarity; price: number }) => input)
  .handler(async ({ data, context }) => {
    const engine = await import("@/lib/gamification.server");
    return engine.purchaseCrate(context.userId, data.rarity, data.price);
  });

export const equipCosmetic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slot: string; cosmeticId: string | null }) => input)
  .handler(async ({ data, context }) => {
    const columns: Record<string, string> = {
      frame: "equipped_frame",
      background: "equipped_background",
      title: "equipped_title",
      chat_effect: "equipped_chat_effect",
    };
    const column = columns[data.slot];
    if (!column) throw new Error("That slot cannot be equipped.");

    if (data.cosmeticId) {
      const { data: owned } = await context.supabase
        .from("user_cosmetics")
        .select("id")
        .eq("user_id", context.userId)
        .eq("cosmetic_id", data.cosmeticId)
        .maybeSingle();
      if (!owned) throw new Error("You don't own that item.");
    }

    const { error } = await context.supabase
      .from("profiles")
      .update({ [column]: data.cosmeticId } as TablesUpdate<"profiles">)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const equipRank = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { rankId: string | null }) => input)
  .handler(async ({ data, context }) => {
    if (data.rankId) {
      const { data: owned } = await context.supabase
        .from("user_ranks")
        .select("id")
        .eq("user_id", context.userId)
        .eq("rank_id", data.rankId)
        .maybeSingle();
      if (!owned) throw new Error("You don't have that rank.");
    }
    const { error } = await context.supabase
      .from("profiles")
      .update({ equipped_rank: data.rankId })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createRank = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { key: string; label: string; color: string; icon: string; animation: string; priority: number }) => input,
  )
  .handler(async ({ data, context }) => {
    const engine = await import("@/lib/gamification.server");
    if (!(await engine.isFounder(context.userId))) throw new Error("Founder only.");
    const { error } = await context.supabase.from("ranks").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { scope?: "global" | "country" } = {}) => input)
  .handler(async ({ data, context }) => {
    let country: string | null = null;
    if (data.scope === "country") {
      const { data: me } = await context.supabase
        .from("profiles")
        .select("country")
        .eq("id", context.userId)
        .maybeSingle();
      country = me?.country ?? null;
    }

    const { data: stats } = await context.supabase
      .from("user_stats")
      .select("user_id, level, lifetime_xp, coins, login_streak")
      .order("lifetime_xp", { ascending: false })
      .limit(200);

    const ids = (stats ?? []).map((s) => s.user_id);
    if (!ids.length) return { rows: [] };

    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, username, display_name, full_name, avatar_url, country, equipped_rank")
      .in("id", ids);
    const { data: ranks } = await context.supabase.from("ranks").select("*");

    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    const rankById = new Map((ranks ?? []).map((r) => [r.id, r]));

    const rows = (stats ?? [])
      .map((s) => {
        const profile = byId.get(s.user_id);
        return {
          userId: s.user_id,
          level: s.level,
          lifetimeXp: Number(s.lifetime_xp),
          coins: Number(s.coins),
          streak: s.login_streak,
          username: profile?.username ?? "delegate",
          displayName: profile?.display_name || profile?.full_name || profile?.username || "Delegate",
          avatarUrl: profile?.avatar_url ?? null,
          country: profile?.country ?? "",
          rank: profile?.equipped_rank ? (rankById.get(profile.equipped_rank) ?? null) : null,
        };
      })
      .filter((row) => (country ? row.country === country : true))
      .slice(0, 100);

    return { rows };
  });

export const getPublicProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { username: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("*")
      .ilike("username", data.username)
      .maybeSingle();
    if (!profile) throw new Error("Profile not found.");

    const [stats, roles, achievements, inventory, ranks, myRanks, conferences] = await Promise.all([
      context.supabase.from("user_stats").select("*").eq("user_id", profile.id).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", profile.id),
      context.supabase
        .from("user_achievements")
        .select("unlocked_at, achievements!inner(*)")
        .eq("user_id", profile.id)
        .not("unlocked_at", "is", null),
      context.supabase.from("user_cosmetics").select("cosmetics!inner(*)").eq("user_id", profile.id),
      context.supabase.from("ranks").select("*"),
      context.supabase.from("user_ranks").select("rank_id").eq("user_id", profile.id),
      context.supabase.from("conferences").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    ]);

    const rankList = ranks.data ?? [];
    const ownedRankIds = new Set((myRanks.data ?? []).map((r) => r.rank_id));

    return {
      profile,
      stats: stats.data,
      roles: (roles.data ?? []).map((r) => r.role as string),
      achievements: (achievements.data ?? []).map((a) => a.achievements as unknown as Tables<"achievements">),
      cosmetics: (inventory.data ?? []).map((c) => c.cosmetics as unknown as Tables<"cosmetics">),
      ranks: rankList.filter((r) => ownedRankIds.has(r.id)),
      equippedRank: profile.equipped_rank ? (rankList.find((r) => r.id === profile.equipped_rank) ?? null) : null,
      conferenceCount: conferences.count ?? 0,
    };
  });

export const updateIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { username?: string; display_name?: string; bio?: string }) => input)
  .handler(async ({ data, context }) => {
    if (data.username && !/^[a-zA-Z0-9_]{3,24}$/.test(data.username)) {
      throw new Error("Username must be 3-24 characters: letters, numbers or underscores.");
    }
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) {
      throw new Error(error.code === "23505" ? "That username is taken." : error.message);
    }
    return { ok: true };
  });
