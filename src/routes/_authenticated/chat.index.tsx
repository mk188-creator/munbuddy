import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import logo from "@/assets/mun-hub-logo.png";
import { Button } from "@/components/ui/button";
import { createThread } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const newThread = useServerFn(createThread);

  const create = useMutation({
    mutationFn: () => newThread({ data: {} }),
    onSuccess: async (thread) => {
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      void navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
    },
  });

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <img src={logo} alt="" className="size-14 rounded-2xl" />
      <h1 className="font-display text-xl font-semibold">Start a conversation</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Ask about your delegation's stance, draft a clause, or rehearse a speech. Every
        conversation is saved to your account.
      </p>
      <Button variant="hero" onClick={() => create.mutate()} disabled={create.isPending}>
        {create.isPending ? "Opening…" : "New chat"}
      </Button>
    </div>
  );
}
