/**
 * Server-only gamification engine. All XP / coin / crate / inventory mutations
 * live here and run with the service client, because clients intentionally have
 * no write grants on the progression tables.
 */
import {
  applyXp,
  CRATE_TABLE,
  RARITIES,
  type Rarity,
} from "@/lib/leveling";

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function todayISO(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function weekStartISO(date = new Date()): string {
  const d = new Date(date);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return todayISO(d);
}

export async function isFounder(userId: string): Promise<boolean> {
  const db = await admin();
  const { data } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "founder")
    .maybeSingle();
  return Boolean(data);
}

export async function ensureStats(userId: string) {
  const db = await admin();
  const { data } = await db.from("user_stats").select("*").eq("user_id", userId).maybeSingle();
  if (data) return data;
  const { data: created } = await db
    .from("user_stats")
    .insert({ user_id: userId, coins: 250, crate_keys: 1 })
    .select("*")
    .single();
  return created!;
}

export type AwardResult = {
  xpGained: number;
  coinsGained: number;
  level: number;
  levelsGained: number;
  newTitleUnlocked: boolean;
};

export async function awardXp(
  userId: string,
  source: string,
  xp: number,
  coins = 0,
  meta: Record<string, unknown> = {},
): Promise<AwardResult> {
  const db = await admin();
  const stats = await ensureStats(userId);
  const next = applyXp(stats.level, stats.xp, xp);

  await db
    .from("user_stats")
    .update({
      level: next.level,
      xp: next.xpIntoLevel,
      lifetime_xp: Number(stats.lifetime_xp) + Math.max(0, xp),
      coins: Number(stats.coins) + Math.max(0, coins),
    })
    .eq("user_id", userId);

  await db.from("xp_events").insert({ user_id: userId, source, amount: xp, coins, meta: meta as never });

  if (next.levelsGained > 0) {
    await grantLevelRewards(userId, next.level);
    await trackMetric(userId, "level", next.level, true);
  }

  return {
    xpGained: xp,
    coinsGained: coins,
    level: next.level,
    levelsGained: next.levelsGained,
    newTitleUnlocked: next.levelsGained > 0,
  };
}

async function grantLevelRewards(userId: string, level: number) {
  const db = await admin();
  await db.rpc; // no-op guard for typing
  const stats = await ensureStats(userId);
  const bonusCoins = level * 25;
  await db
    .from("user_stats")
    .update({ coins: Number(stats.coins) + bonusCoins })
    .eq("user_id", userId);
  if (level % 5 === 0) await grantCrate(userId, level >= 50 ? "epic" : "rare", 1);

  // Auto-unlock any level-gated ranks.
  const { data: ranks } = await db.from("ranks").select("id, min_level").lte("min_level", level).gt("min_level", 0);
  for (const rank of ranks ?? []) {
    await db.from("user_ranks").upsert({ user_id: userId, rank_id: rank.id }, { onConflict: "user_id,rank_id" });
  }
}

export async function grantCrate(userId: string, rarity: Rarity, quantity = 1) {
  const db = await admin();
  const { data } = await db
    .from("user_crates")
    .select("quantity")
    .eq("user_id", userId)
    .eq("rarity", rarity)
    .maybeSingle();
  if (data) {
    await db
      .from("user_crates")
      .update({ quantity: data.quantity + quantity })
      .eq("user_id", userId)
      .eq("rarity", rarity);
  } else {
    await db.from("user_crates").insert({ user_id: userId, rarity, quantity });
  }
}

/** Advances mission + achievement progress for a metric. */
export async function trackMetric(userId: string, metric: string, amount = 1, absolute = false) {
  const db = await admin();
  await ensureMissions(userId);

  const { data: missions } = await db
    .from("user_missions")
    .select("id, progress, cadence, period_start, completed_at, mission_templates!inner(goal, metric)")
    .eq("user_id", userId)
    .is("completed_at", null);

  for (const row of missions ?? []) {
    const template = row.mission_templates as unknown as { goal: number; metric: string };
    if (template.metric !== metric) continue;
    const progress = Math.min(template.goal, absolute ? amount : row.progress + amount);
    await db
      .from("user_missions")
      .update({
        progress,
        completed_at: progress >= template.goal ? new Date().toISOString() : null,
      })
      .eq("id", row.id);
  }

  const { data: achievements } = await db.from("achievements").select("*").eq("metric", metric);
  for (const achievement of achievements ?? []) {
    const { data: existing } = await db
      .from("user_achievements")
      .select("id, progress, unlocked_at")
      .eq("user_id", userId)
      .eq("achievement_id", achievement.id)
      .maybeSingle();
    if (existing?.unlocked_at) continue;
    const progress = Math.min(achievement.goal, absolute ? amount : (existing?.progress ?? 0) + amount);
    const unlocked = progress >= achievement.goal;
    if (existing) {
      await db
        .from("user_achievements")
        .update({ progress, unlocked_at: unlocked ? new Date().toISOString() : null })
        .eq("id", existing.id);
    } else {
      await db.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
        progress,
        unlocked_at: unlocked ? new Date().toISOString() : null,
      });
    }
    if (unlocked) {
      const stats = await ensureStats(userId);
      const next = applyXp(stats.level, stats.xp, achievement.xp_reward);
      await db
        .from("user_stats")
        .update({
          level: next.level,
          xp: next.xpIntoLevel,
          lifetime_xp: Number(stats.lifetime_xp) + achievement.xp_reward,
          coins: Number(stats.coins) + achievement.coin_reward,
        })
        .eq("user_id", userId);
      if (achievement.crate_reward) await grantCrate(userId, achievement.crate_reward as Rarity, 1);
      if (achievement.cosmetic_key) {
        const { data: cosmetic } = await db
          .from("cosmetics")
          .select("id")
          .eq("key", achievement.cosmetic_key)
          .maybeSingle();
        if (cosmetic) {
          await db
            .from("user_cosmetics")
            .upsert(
              { user_id: userId, cosmetic_id: cosmetic.id, acquired_from: "achievement" },
              { onConflict: "user_id,cosmetic_id" },
            );
        }
      }
    }
  }
}

function pick<T>(items: T[], count: number, seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const pool = [...items];
  const out: T[] = [];
  while (pool.length && out.length < count) {
    h = (h * 1664525 + 1013904223) >>> 0;
    out.push(pool.splice(h % pool.length, 1)[0]!);
  }
  return out;
}

export async function ensureMissions(userId: string) {
  const db = await admin();
  const day = todayISO();
  const week = weekStartISO();

  const { data: templates } = await db.from("mission_templates").select("*").eq("active", true);
  if (!templates?.length) return;

  const daily = pick(
    templates.filter((t) => t.cadence === "daily"),
    3,
    userId + day,
  );
  const weekly = pick(
    templates.filter((t) => t.cadence === "weekly"),
    3,
    userId + week,
  );

  const rows = [
    ...daily.map((t) => ({ user_id: userId, template_id: t.id, cadence: "daily", period_start: day })),
    ...weekly.map((t) => ({ user_id: userId, template_id: t.id, cadence: "weekly", period_start: week })),
  ];
  if (rows.length) {
    await db.from("user_missions").upsert(rows, { onConflict: "user_id,template_id,period_start" });
  }
}

export async function claimDailyLogin(userId: string) {
  const db = await admin();
  const stats = await ensureStats(userId);
  const day = todayISO();
  if (stats.last_login_date === day) return { alreadyClaimed: true, streak: stats.login_streak, xp: 0, coins: 0 };

  const yesterday = todayISO(new Date(Date.now() - 86_400_000));
  const streak = stats.last_login_date === yesterday ? stats.login_streak + 1 : 1;
  const xp = 50 + Math.min(streak, 30) * 10;
  const coins = 25 + Math.min(streak, 30) * 5;

  await db
    .from("user_stats")
    .update({
      last_login_date: day,
      login_streak: streak,
      best_streak: Math.max(stats.best_streak, streak),
    })
    .eq("user_id", userId);

  await awardXp(userId, "daily_login", xp, coins, { streak });
  await trackMetric(userId, "login", 1);
  await trackMetric(userId, "streak", streak, true);
  if (streak % 7 === 0) await grantCrate(userId, streak >= 28 ? "legendary" : "epic", 1);

  return { alreadyClaimed: false, streak, xp, coins };
}

export type CrateReward = {
  type: "coins" | "xp" | "cosmetic";
  rarity: Rarity;
  amount?: number;
  cosmetic?: { id: string; name: string; kind: string; key: string };
};

export async function openCrate(userId: string, rarity: Rarity): Promise<CrateReward> {
  const db = await admin();
  const founder = await isFounder(userId);

  if (!founder) {
    const { data: owned } = await db
      .from("user_crates")
      .select("quantity")
      .eq("user_id", userId)
      .eq("rarity", rarity)
      .maybeSingle();
    if (!owned || owned.quantity < 1) throw new Error(`You have no ${rarity} crates.`);
    await db
      .from("user_crates")
      .update({ quantity: owned.quantity - 1 })
      .eq("user_id", userId)
      .eq("rarity", rarity);
  }

  const table = CRATE_TABLE[rarity];
  const total = RARITIES.reduce((sum, r) => sum + table.odds[r], 0);
  let roll = Math.random() * total;
  let rolled: Rarity = "common";
  for (const r of RARITIES) {
    roll -= table.odds[r];
    if (roll <= 0) {
      rolled = r;
      break;
    }
  }

  const { data: pool } = await db
    .from("cosmetics")
    .select("id, key, name, kind, rarity")
    .eq("rarity", rolled)
    .eq("founder_only", false);

  const { data: ownedItems } = await db.from("user_cosmetics").select("cosmetic_id").eq("user_id", userId);
  const ownedIds = new Set((ownedItems ?? []).map((r) => r.cosmetic_id));
  const candidates = (pool ?? []).filter((c) => !ownedIds.has(c.id));

  let reward: CrateReward;
  if (candidates.length && Math.random() < 0.72) {
    const item = candidates[Math.floor(Math.random() * candidates.length)]!;
    await db
      .from("user_cosmetics")
      .upsert({ user_id: userId, cosmetic_id: item.id, acquired_from: "crate" }, { onConflict: "user_id,cosmetic_id" });
    reward = { type: "cosmetic", rarity: rolled, cosmetic: item };
  } else if (Math.random() < 0.5) {
    const amount = Math.round(table.coins[0] + Math.random() * (table.coins[1] - table.coins[0]));
    const stats = await ensureStats(userId);
    await db.from("user_stats").update({ coins: Number(stats.coins) + amount }).eq("user_id", userId);
    reward = { type: "coins", rarity: rolled, amount };
  } else {
    const amount = Math.round(table.xp[0] + Math.random() * (table.xp[1] - table.xp[0]));
    await awardXp(userId, "crate", amount, 0, { rarity });
    reward = { type: "xp", rarity: rolled, amount };
  }

  await db.from("crate_openings").insert({ user_id: userId, rarity, reward: reward as never });
  await trackMetric(userId, "crate_open", 1);
  return reward;
}

export async function ensureShopRotation() {
  const db = await admin();
  const day = todayISO();
  const { data: existing } = await db.from("shop_rotation").select("id").eq("rotation_date", day).limit(1);
  if (existing?.length) return;

  const { data: cosmetics } = await db.from("cosmetics").select("id, rarity").eq("founder_only", false);
  if (!cosmetics?.length) return;

  const chosen = pick(cosmetics, Math.min(8, cosmetics.length), day);
  const rows = chosen.map((c, index) => ({
    rotation_date: day,
    cosmetic_id: c.id,
    featured: index < 2,
    discount_pct: index % 3 === 0 ? 20 : index % 4 === 0 ? 35 : 0,
  }));
  await db.from("shop_rotation").upsert(rows, { onConflict: "rotation_date,cosmetic_id" });
}

export async function purchaseCosmetic(userId: string, cosmeticId: string) {
  const db = await admin();
  const founder = await isFounder(userId);

  const { data: cosmetic } = await db.from("cosmetics").select("*").eq("id", cosmeticId).maybeSingle();
  if (!cosmetic) throw new Error("Item not found.");
  if (cosmetic.founder_only && !founder) throw new Error("This item is Founder-exclusive.");

  const { data: owned } = await db
    .from("user_cosmetics")
    .select("id")
    .eq("user_id", userId)
    .eq("cosmetic_id", cosmeticId)
    .maybeSingle();
  if (owned) throw new Error("You already own this item.");

  const day = todayISO();
  const { data: rotation } = await db
    .from("shop_rotation")
    .select("discount_pct")
    .eq("rotation_date", day)
    .eq("cosmetic_id", cosmeticId)
    .maybeSingle();
  const price = Math.round(cosmetic.price * (1 - (rotation?.discount_pct ?? 0) / 100));

  if (!founder) {
    const stats = await ensureStats(userId);
    if (Number(stats.coins) < price) throw new Error("Not enough MUN Coins.");
    await db.from("user_stats").update({ coins: Number(stats.coins) - price }).eq("user_id", userId);
  }

  await db.from("user_cosmetics").insert({ user_id: userId, cosmetic_id: cosmeticId, acquired_from: "shop" });
  return { ok: true, price: founder ? 0 : price };
}

export async function purchaseCrate(userId: string, rarity: Rarity, price: number) {
  const db = await admin();
  const founder = await isFounder(userId);
  if (!founder) {
    const stats = await ensureStats(userId);
    if (Number(stats.coins) < price) throw new Error("Not enough MUN Coins.");
    await db.from("user_stats").update({ coins: Number(stats.coins) - price }).eq("user_id", userId);
  }
  await grantCrate(userId, rarity, 1);
  return { ok: true };
}

export async function claimMission(userId: string, missionId: string) {
  const db = await admin();
  const { data: mission } = await db
    .from("user_missions")
    .select("id, completed_at, claimed_at, mission_templates!inner(xp_reward, coin_reward, crate_reward, title)")
    .eq("id", missionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!mission) throw new Error("Mission not found.");
  if (!mission.completed_at) throw new Error("Mission is not complete yet.");
  if (mission.claimed_at) throw new Error("Reward already claimed.");

  const template = mission.mission_templates as unknown as {
    xp_reward: number;
    coin_reward: number;
    crate_reward: string | null;
    title: string;
  };

  await db.from("user_missions").update({ claimed_at: new Date().toISOString() }).eq("id", missionId);
  const result = await awardXp(userId, "mission", template.xp_reward, template.coin_reward, { title: template.title });
  if (template.crate_reward) await grantCrate(userId, template.crate_reward as Rarity, 1);
  return { ...result, crate: template.crate_reward };
}
