import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { listThreads, createThread, deleteThread } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — MUN Hub" },
      { name: "description", content: "Threaded conversations with your Model UN AI coach." },
      { property: "og:title", content: "AI Chat — MUN Hub" },
      { property: "og:description", content: "Threaded conversations with your Model UN AI coach." },
    ],
  }),
  component: ChatLayout,
});

function ChatLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };

  const fetchThreads = useServerFn(listThreads);
  const newThread = useServerFn(createThread);
  const removeThread = useServerFn(deleteThread);

  const threads = useQuery({ queryKey: ["threads"], queryFn: () => fetchThreads({}) });

  const create = useMutation({
    mutationFn: () => newThread({ data: {} }),
    onSuccess: async (thread) => {
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      void navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeThread({ data: { id } }),
    onSuccess: async (_result, id) => {
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      if (params.threadId === id) void navigate({ to: "/chat" });
    },
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/70 bg-sidebar md:flex">
        <div className="p-3">
          <Button
            variant="hero"
            className="w-full"
            onClick={() => create.mutate()}
            disabled={create.isPending}
          >
            <Plus className="size-4" /> New chat
          </Button>
        </div>
        <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {threads.isLoading && <Skeleton className="mx-1 h-9" />}
          {threads.data?.length === 0 && (
            <p className="px-3 py-6 text-xs text-muted-foreground">No conversations yet.</p>
          )}
          <ul className="space-y-1">
            {threads.data?.map((thread) => (
              <li
                key={thread.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg px-1 transition-colors",
                  params.threadId === thread.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60",
                )}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: thread.id }}
                  className="min-w-0 flex-1 truncate px-2 py-2 text-sm"
                >
                  {thread.title}
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${thread.title}`}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => remove.mutate(thread.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
