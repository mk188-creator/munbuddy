import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LeaderboardScope = "global" | "country" | "friends" | "conference";

export type LeaderboardRow = {
  userId: string;
  rank: number;
  level: number;
  lifetimeXp: number;
  coins: number;
  streak: number;
  conferences: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  country: string;
  rankBadge: {
    id: string;
    key: string;
    label: string;
    color: string;
    icon: string;
    animation: string;
  } | null;
  isMe: boolean;
};

export const getLeaderboardRows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { scope?: LeaderboardScope } = {}) => input)
  .handler(async ({ data, context }): Promise<{ rows: LeaderboardRow[]; scope: LeaderboardScope }> => {
    const scope: LeaderboardScope = data.scope ?? "global";
    const me = context.userId;

    const { data: myProfile } = await context.supabase
      .from("profiles")
      .select("country")
      .eq("id", me)
      .maybeSingle();

    let allowedIds: string[] | null = null;
    if (scope === "friends") {
      const { data: friends } = await context.supabase.from("friends").select("friend_id").eq("user_id", me);
      allowedIds = [me, ...(friends ?? []).map((f) => f.friend_id)];
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let statsQuery = supabaseAdmin
      .from("user_stats")
      .select("user_id, level, lifetime_xp, coins, login_streak, conference_count")
      .order(scope === "conference" ? "conference_count" : "lifetime_xp", { ascending: false })
      .limit(300);
    if (allowedIds) statsQuery = statsQuery.in("user_id", allowedIds);

    const { data: stats } = await statsQuery;
    const ids = (stats ?? []).map((s) => s.user_id);
    if (!ids.length) return { rows: [], scope };

    const [{ data: profiles }, { data: ranks }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, username, display_name, full_name, avatar_url, country, equipped_rank")
        .in("id", ids),
      context.supabase.from("ranks").select("*"),
    ]);


    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    const rankById = new Map((ranks ?? []).map((r) => [r.id, r]));

    const rows = (stats ?? [])
      .map((s) => {
        const profile = byId.get(s.user_id);
        const badge = profile?.equipped_rank ? rankById.get(profile.equipped_rank) : undefined;
        return {
          userId: s.user_id,
          rank: 0,
          level: s.level,
          lifetimeXp: Number(s.lifetime_xp),
          coins: Number(s.coins),
          streak: s.login_streak,
          conferences: s.conference_count,
          username: profile?.username ?? "delegate",
          displayName: profile?.display_name || profile?.full_name || profile?.username || "Delegate",
          avatarUrl: profile?.avatar_url ?? null,
          country: profile?.country ?? "",
          rankBadge: badge
            ? {
                id: badge.id,
                key: badge.key,
                label: badge.label,
                color: badge.color,
                icon: badge.icon,
                animation: badge.animation,
              }
            : null,
          isMe: s.user_id === me,
        };
      })
      .filter((row) => {
        if (scope === "country") return Boolean(myProfile?.country) && row.country === myProfile?.country;
        if (scope === "conference") return row.conferences > 0;
        return true;
      })
      .slice(0, 100)
      .map((row, index) => ({ ...row, rank: index + 1 }));

    return { rows, scope };
  });

export const toggleFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { friendId: string }) => input)
  .handler(async ({ data, context }) => {
    if (data.friendId === context.userId) throw new Error("You can't add yourself.");
    const { data: existing } = await context.supabase
      .from("friends")
      .select("id")
      .eq("user_id", context.userId)
      .eq("friend_id", data.friendId)
      .maybeSingle();

    if (existing) {
      await context.supabase.from("friends").delete().eq("id", existing.id);
      return { following: false };
    }
    const { error } = await context.supabase
      .from("friends")
      .insert({ user_id: context.userId, friend_id: data.friendId });
    if (error) throw new Error(error.message);
    return { following: true };
  });

export const getFriendState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: mine }, { count: followers }] = await Promise.all([
      context.supabase
        .from("friends")
        .select("id")
        .eq("user_id", context.userId)
        .eq("friend_id", data.userId)
        .maybeSingle(),
      supabaseAdmin
        .from("friends")
        .select("id", { count: "exact", head: true })
        .eq("friend_id", data.userId),
    ]);

    return { following: Boolean(mine), followers: followers ?? 0, isMe: data.userId === context.userId };
  });
