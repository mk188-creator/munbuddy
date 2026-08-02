import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { Skeleton } from "@/components/ui/skeleton";
import { getThreadMessages, toUIMessages } from "@/lib/chat.functions";
import { getTool } from "@/lib/mun-tools";

type ChatSearch = { prompt?: string; tool?: string };

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  validateSearch: (search: Record<string, unknown>): ChatSearch => ({
    ...(typeof search['prompt'] === "string" ? { prompt: search['prompt'] } : {}),
    ...(typeof search['tool'] === "string" ? { tool: search['tool'] } : {}),
  }),
  component: ChatThreadPage,
});

const SUGGESTIONS = [
  "What is France's position on autonomous weapons?",
  "Draft 5 operative clauses on climate adaptation funding",
  "Write me a 60 second opening speech for Kenya in UNEP",
];

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const search = useSearch({ from: "/_authenticated/chat/$threadId" });
  const fetchMessages = useServerFn(getThreadMessages);

  const thread = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => fetchMessages({ data: { threadId } }),
  });

  if (thread.isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-3/4" />
      </div>
    );
  }

  if (!thread.data?.thread) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-sm text-muted-foreground">
        This conversation no longer exists.
      </div>
    );
  }

  const toolId = search.tool ?? (thread.data.thread.tool !== "chat" ? thread.data.thread.tool : null);
  const tool = toolId ? getTool(toolId) : undefined;

  return (
    <ChatWindow
      key={threadId}
      threadId={threadId}
      initialMessages={toUIMessages(thread.data.messages)}
      toolId={toolId}
      autoPrompt={search.prompt ?? null}
      suggestions={tool ? [] : SUGGESTIONS}
      emptyTitle={tool ? tool.name : "Ask MUN Hub anything"}
      emptyDescription={
        tool
          ? tool.tagline
          : "Position papers, clauses, POIs, crisis directives — all in your delegation's voice."
      }

    />
  );
}
