import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayRunId,
  getLovableAiGatewayResponseHeaders,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";
import { authenticateRequest } from "@/lib/request-auth.server";
import { CHAT_SYSTEM, buildToolPrompt } from "@/lib/mun-tools";

type ChatRequestBody = {
  messages?: unknown;
  threadId?: string;
  toolId?: string | null;
  toolValues?: Record<string, string> | null;
};

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages are required", { status: 400 });
        }
        if (!body.threadId) return new Response("threadId is required", { status: 400 });

        const { supabase, userId } = auth;

        // The thread must exist and belong to the caller.
        const { data: thread, error: threadError } = await supabase
          .from("chat_threads")
          .select("id, title")
          .eq("id", body.threadId)
          .eq("user_id", userId)
          .maybeSingle();
        if (threadError) return new Response(threadError.message, { status: 500 });
        if (!thread) return new Response("Thread not found", { status: 404 });

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        const uiMessages = messages as UIMessage[];
        const lastMessage = uiMessages[uiMessages.length - 1];

        let system = CHAT_SYSTEM;
        if (body.toolId && body.toolValues) {
          const built = buildToolPrompt(body.toolId, body.toolValues);
          if (built) system = built.system;
        }

        // Persist the incoming user turn before streaming.
        if (lastMessage?.role === "user") {
          const { error: insertError } = await supabase.from("chat_messages").insert({
            thread_id: body.threadId,
            user_id: userId,
            role: "user",
            parts: lastMessage.parts as never,
            client_id: lastMessage.id,
          });
          if (insertError) console.error("[chat] failed to save user message", insertError);

          if (!thread.title || thread.title === "New chat") {
            const draft = textOf(lastMessage).replace(/\s+/g, " ").slice(0, 60);
            if (draft) {
              await supabase
                .from("chat_threads")
                .update({ title: draft, ...(body.toolId ? { tool: body.toolId } : {}) })
                .eq("id", body.threadId);
            }
          }
        }

        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(key, initialRunId);

        const result = streamText({
          model: gateway("google/gemini-3.6-flash"),
          system,
          messages: await convertToModelMessages(uiMessages),
          onFinish: async ({ usage }) => {
            await supabase.from("ai_usage").insert({
              user_id: userId,
              tool: body.toolId ?? "chat",
              tokens: usage?.totalTokens ?? 0,
            });
            await supabase
              .from("chat_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", body.threadId!);
          },
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ responseMessage }) => {
            if (!responseMessage) return;
            const { error } = await supabase.from("chat_messages").insert({
              thread_id: body.threadId!,
              user_id: userId,
              role: "assistant",
              parts: responseMessage.parts as never,
              client_id: responseMessage.id,
            });
            if (error) console.error("[chat] failed to save assistant message", error);
          },
          headers: getLovableAiGatewayResponseHeaders(
            undefined,
            initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : undefined,
          ),
        });

        return withLovableAiGatewayRunIdHeader(response, gateway);
      },
    },
  },
});
