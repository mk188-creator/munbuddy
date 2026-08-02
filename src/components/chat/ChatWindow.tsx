import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import logo from "@/assets/mun-hub-logo.png";
import { supabase } from "@/integrations/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const transport = new DefaultChatTransport({
  api: "/api/chat",
  fetch: async (url, options) => {
    const { data } = await supabase.auth.getSession();
    const headers = new Headers(options?.headers);
    if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
    return fetch(url, { ...options, headers });
  },
});

type ChatWindowProps = {
  threadId: string;
  initialMessages: UIMessage[];
  toolId?: string | null;
  autoPrompt?: string | null;
  suggestions?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
  onFirstMessage?: () => void;
};

export function ChatWindow({
  threadId,
  initialMessages,
  toolId = null,
  autoPrompt = null,
  suggestions = [],
  emptyTitle = "Ask MUN Hub anything",
  emptyDescription = "Position papers, clauses, POIs, crisis directives — all in your delegation's voice.",
  onFirstMessage,
}: ChatWindowProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autoSent = useRef(false);

  const { messages, sendMessage, status, error, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (chatError) => toast.error(chatError.message || "The assistant could not respond"),
    onFinish: () => onFirstMessage?.(),
  });

  const body = useMemo(() => ({ threadId, toolId }), [threadId, toolId]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    if (status === "ready") textareaRef.current?.focus();
  }, [status]);

  useEffect(() => {
    if (!autoPrompt || autoSent.current || initialMessages.length > 0) return;
    autoSent.current = true;
    void sendMessage({ text: autoPrompt }, { body });
  }, [autoPrompt, initialMessages.length, sendMessage, body]);

  const isBusy = status === "submitted" || status === "streaming";

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || isBusy) return;
    void sendMessage({ text: value }, { body });
  };

  const handleSubmit = (message: PromptInputMessage) => {
    submit(message.text ?? "");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              className="gap-4"
              icon={<img src={logo} alt="" className="size-12 rounded-xl" />}
              title={emptyTitle}
              description={emptyDescription}
            >
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => submit(suggestion)}
                      className="rounded-full border border-border bg-surface-raised px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse key={`${message.id}-${index}`}>
                        {part.text}
                      </MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}

          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Consulting the archives…</Shimmer>
              </MessageContent>
            </Message>
          )}

          {error && (
            <p className="text-center text-xs text-destructive">
              {error.message || "Something went wrong. Try again."}
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border/70 bg-background/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              ref={textareaRef}
              autoFocus
              placeholder="Message MUN Hub…"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
