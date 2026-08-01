import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { UIMessage } from "ai";

export type ChatThread = {
  id: string;
  title: string;
  tool: string;
  created_at: string;
  updated_at: string;
};

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_threads")
      .select("id, title, tool, created_at, updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as ChatThread[];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { title?: string; tool?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("chat_threads")
      .insert({
        user_id: context.userId,
        title: data.title || "New chat",
        tool: data.tool || "chat",
      })
      .select("id, title, tool, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row as ChatThread;
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; title: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .update({ title: data.title.slice(0, 120) })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type StoredMessage = { id: string; role: string; parts: JsonValue[] };

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { threadId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: thread, error: threadError } = await context.supabase
      .from("chat_threads")
      .select("id, title, tool, created_at, updated_at")
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (threadError) throw new Error(threadError.message);
    if (!thread) return { thread: null as ChatThread | null, messages: [] as StoredMessage[] };

    const { data: rows, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, parts, client_id, created_at")
      .eq("thread_id", data.threadId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const messages: StoredMessage[] = (rows ?? []).map((row) => ({
      id: row.client_id ?? row.id,
      role: row.role,
      parts: (Array.isArray(row.parts) ? row.parts : []) as JsonValue[],
    }));

    return { thread: thread as ChatThread | null, messages };
  });

export function toUIMessages(messages: StoredMessage[]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as UIMessage["role"],
    parts: message.parts as UIMessage["parts"],
  }));
}

