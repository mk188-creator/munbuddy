import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Profile = {
  id: string;
  full_name: string;
  school: string;
  country: string;
  bio: string;
  mun_experience: string;
  avatar_url: string | null;
  theme: string;
  email_notifications: boolean;
  product_updates: boolean;
  public_profile: boolean;
};

const SELECT =
  "id, full_name, school, country, bio, mun_experience, avatar_url, theme, email_notifications, product_updates, public_profile";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select(SELECT)
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as Profile | null;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      full_name?: string;
      school?: string;
      country?: string;
      bio?: string;
      mun_experience?: string;
      theme?: string;
      email_notifications?: boolean;
      product_updates?: boolean;
      public_profile?: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getUsageStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [usage, threads, documents] = await Promise.all([
      context.supabase
        .from("ai_usage")
        .select("tool, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(500),
      context.supabase
        .from("chat_threads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId),
      context.supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId),
    ]);

    const rows = usage.data ?? [];
    const byTool = new Map<string, number>();
    for (const row of rows) byTool.set(row.tool, (byTool.get(row.tool) ?? 0) + 1);

    const week = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return {
      totalRuns: rows.length,
      runsThisWeek: rows.filter((row) => new Date(row.created_at).getTime() > week).length,
      threadCount: threads.count ?? 0,
      documentCount: documents.count ?? 0,
      topTools: [...byTool.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tool, count]) => ({ tool, count })),
    };
  });
