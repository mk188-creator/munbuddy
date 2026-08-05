import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SPAM_PATTERNS = [
  /(https?:\/\/\S+){3,}/i,
  /\b(free\s+(robux|vbucks|crypto|nitro)|discord\.gg\/\w+\s+free)\b/i,
  /(.)\1{24,}/,
];

function looksLikeSpam(body: string) {
  if (body.length > 1200) return "Message is too long.";
  if (SPAM_PATTERNS.some((pattern) => pattern.test(body))) return "That message was blocked by spam protection.";
  const letters = body.replace(/[^a-z]/gi, "");
  if (letters.length > 20 && letters === letters.toUpperCase()) return "Please don't shout in all caps.";
  return null;
}

export const getCommunityFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string } = {}) => input)
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("community_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(120);
    if (data.search?.trim()) query = query.ilike("body", `%${data.search.trim()}%`);

    const [{ data: messages }, { data: pinned }, { data: mute }, { data: roles }, { data: read }] = await Promise.all([
      query,
      context.supabase.from("community_messages").select("*").eq("pinned", true).eq("deleted", false).limit(10),
      context.supabase.from("chat_mutes").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      context.supabase.from("chat_reads").select("last_read_at").eq("user_id", context.userId).maybeSingle(),
    ]);

    const list = (messages ?? []).slice().reverse();
    const ids = list.map((m) => m.id);
    const authorIds = [...new Set(list.map((m) => m.user_id))];

    const [{ data: reactions }, { data: profiles }, { data: ranks }] = await Promise.all([
      ids.length
        ? context.supabase.from("message_reactions").select("message_id, emoji, user_id").in("message_id", ids)
        : Promise.resolve({ data: [] as { message_id: string; emoji: string; user_id: string }[] }),
      authorIds.length
        ? context.supabase
            .from("profiles")
            .select("id, username, display_name, full_name, avatar_url, equipped_rank, equipped_frame, equipped_chat_effect")
            .in("id", authorIds)
        : Promise.resolve({ data: [] as Record<string, never>[] }),
      context.supabase.from("ranks").select("*"),
    ]);

    const statsRes = authorIds.length
      ? await context.supabase.from("user_stats").select("user_id, level").in("user_id", authorIds)
      : { data: [] as { user_id: string; level: number }[] };

    const myRoles = (roles ?? []).map((r) => r.role as string);
    return {
      messages: list,
      pinned: pinned ?? [],
      reactions: reactions ?? [],
      authors: profiles ?? [],
      ranks: ranks ?? [],
      levels: statsRes.data ?? [],
      lastReadAt: read?.last_read_at ?? null,
      isStaff: myRoles.some((r) => ["founder", "admin", "staff", "moderator"].includes(r)),
      roles: myRoles,
      muted: Boolean(mute && (!mute.expires_at || new Date(mute.expires_at) > new Date())),
      userId: context.userId,
    };
  });

export const sendCommunityMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { body: string; replyTo?: string | null; imageUrl?: string | null; announcement?: boolean }) => input,
  )
  .handler(async ({ data, context }) => {
    const body = data.body.trim();
    if (!body && !data.imageUrl) throw new Error("Message can't be empty.");

    const spam = looksLikeSpam(body);
    if (spam) throw new Error(spam);

    if (data.announcement) {
      const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
      const staff = (roles ?? []).some((r) => ["founder", "admin", "staff", "moderator"].includes(r.role as string));
      if (!staff) throw new Error("Only the moderation team can post announcements.");
    }

    const mentions = [...body.matchAll(/@([a-zA-Z0-9_]{3,24})/g)].map((m) => m[1]!);

    const { error } = await context.supabase.from("community_messages").insert({
      user_id: context.userId,
      body,
      image_url: data.imageUrl ?? null,
      reply_to: data.replyTo ?? null,
      mentions: mentions as never,
      announcement: data.announcement ?? false,
    });
    if (error) {
      throw new Error(
        error.code === "42501" ? "You are muted and can't post right now." : error.message,
      );
    }

    const engine = await import("@/lib/gamification.server");
    await engine.trackMetric(context.userId, "chat_message", 1);
    await engine.awardXp(context.userId, "chat_message", 5, 1);
    return { ok: true };
  });

export const reactToMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messageId: string; emoji: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("message_reactions")
      .select("id")
      .eq("message_id", data.messageId)
      .eq("user_id", context.userId)
      .eq("emoji", data.emoji)
      .maybeSingle();

    if (existing) {
      await context.supabase.from("message_reactions").delete().eq("id", existing.id);
      return { toggled: "off" as const };
    }
    const { error } = await context.supabase
      .from("message_reactions")
      .insert({ message_id: data.messageId, user_id: context.userId, emoji: data.emoji });
    if (error) throw new Error(error.message);
    return { toggled: "on" as const };
  });

export const markChatRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("chat_reads")
      .upsert({ user_id: context.userId, last_read_at: new Date().toISOString() }, { onConflict: "user_id" });
    return { ok: true };
  });

export const moderateMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messageId: string; action: "delete" | "pin" | "unpin" }) => input)
  .handler(async ({ data, context }) => {
    const patch =
      data.action === "delete" ? { deleted: true, body: "" } : { pinned: data.action === "pin" };
    const { error } = await context.supabase.from("community_messages").update(patch).eq("id", data.messageId);
    if (error) throw new Error("You don't have permission to moderate this message.");
    return { ok: true };
  });

export const moderateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { userId: string; action: "mute" | "unmute" | "warn"; reason?: string; minutes?: number }) => input,
  )
  .handler(async ({ data, context }) => {
    if (data.action === "unmute") {
      const { error } = await context.supabase.from("chat_mutes").delete().eq("user_id", data.userId);
      if (error) throw new Error("You don't have permission to do that.");
      return { ok: true };
    }
    if (data.action === "warn") {
      const { error } = await context.supabase
        .from("chat_warnings")
        .insert({ user_id: data.userId, issued_by: context.userId, reason: data.reason ?? "" });
      if (error) throw new Error("You don't have permission to do that.");
      return { ok: true };
    }
    const expires = data.minutes ? new Date(Date.now() + data.minutes * 60_000).toISOString() : null;
    const { error } = await context.supabase.from("chat_mutes").upsert(
      { user_id: data.userId, muted_by: context.userId, reason: data.reason ?? "", expires_at: expires },
      { onConflict: "user_id" },
    );
    if (error) throw new Error("You don't have permission to do that.");
    return { ok: true };
  });
