import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Hash, Pin, Reply, Search, Send, Shield, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelPill, RankBadge } from "@/components/gamification/Identity";
import {
  getCommunityFeed,
  markChatRead,
  moderateMessage,
  moderateUser,
  reactToMessage,
  sendCommunityMessage,
} from "@/lib/community.functions";
import { supabase } from "@/integrations/supabase/client";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({
    meta: [
      { title: "Community — MUN Hub" },
      { name: "description", content: "Global real-time chat for MUN Hub delegates worldwide." },
      { property: "og:title", content: "Community — MUN Hub" },
      { property: "og:description", content: "Talk strategy, find partners and share wins with delegates worldwide." },
    ],
  }),
  component: CommunityPage,
});

const EMOJIS = ["👍", "🔥", "🎉", "🌍", "😂"];

function CommunityPage() {
  const feedFn = useServerFn(getCommunityFeed);
  const sendFn = useServerFn(sendCommunityMessage);
  const reactFn = useServerFn(reactToMessage);
  const modMessageFn = useServerFn(moderateMessage);
  const modUserFn = useServerFn(moderateUser);
  const markReadFn = useServerFn(markChatRead);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const feed = useQuery({
    queryKey: ["community", search],
    queryFn: () => feedFn({ data: { search } }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["community"] });

  useEffect(() => {
    const channel = supabase
      .channel("community-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_messages" }, () => {
        void invalidate();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
        void invalidate();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    void markReadFn({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed.data?.messages.length]);

  const send = useMutation({
    mutationFn: (body: string) => sendFn({ data: { body, replyTo: replyTo?.id ?? null } }),
    onSuccess: () => {
      playSound("notify");
      setDraft("");
      setReplyTo(null);
      void invalidate();
    },
    onError: (error: Error) => {
      playSound("error");
      toast.error(error.message);
    },
  });

  const react = useMutation({
    mutationFn: (input: { messageId: string; emoji: string }) => reactFn({ data: input }),
    onSuccess: () => void invalidate(),
  });

  const moderate = useMutation({
    mutationFn: (input: { messageId: string; action: "delete" | "pin" | "unpin" }) => modMessageFn({ data: input }),
    onSuccess: () => {
      toast.success("Moderation applied.");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const muteUser = useMutation({
    mutationFn: (userId: string) => modUserFn({ data: { userId, action: "mute", minutes: 60, reason: "Chat rules" } }),
    onSuccess: () => toast.success("Member muted for 1 hour."),
    onError: (error: Error) => toast.error(error.message),
  });

  const data = feed.data;
  const authorMap = useMemo(() => new Map((data?.authors ?? []).map((a) => [a.id, a])), [data]);
  const rankMap = useMemo(() => new Map((data?.ranks ?? []).map((r) => [r.id, r])), [data]);
  const levelMap = useMemo(() => new Map((data?.levels ?? []).map((l) => [l.user_id, l.level])), [data]);
  const messageMap = useMemo(() => new Map((data?.messages ?? []).map((m) => [m.id, m])), [data]);

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-4xl flex-col px-4 sm:px-6">
      <header className="flex flex-wrap items-center gap-3 py-4">
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold">
          <Hash className="size-5 text-primary" />
          Global community
        </h1>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search messages"
            className="pl-8"
          />
        </div>
      </header>

      {data?.pinned.length ? (
        <div className="mb-2 rounded-xl border border-primary/40 bg-primary/8 px-3 py-2 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-primary">
            <Pin className="size-3.5" /> Pinned
          </p>
          {data.pinned.map((message) => (
            <p key={message.id} className="mt-1 line-clamp-2 text-muted-foreground">
              {message.body}
            </p>
          ))}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto panel p-3">
        {feed.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {(data?.messages ?? []).map((message) => {
                const author = authorMap.get(message.user_id);
                const name = author?.display_name || author?.full_name || author?.username || "Delegate";
                const parent = message.reply_to ? messageMap.get(message.reply_to) : null;
                const counts = new Map<string, number>();
                (data?.reactions ?? [])
                  .filter((r) => r.message_id === message.id)
                  .forEach((r) => counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1));

                return (
                  <motion.li
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className={cn(
                      "group rounded-xl px-2 py-1.5",
                      message.announcement && "border border-primary/40 bg-primary/8",
                    )}
                  >
                    <div className="flex gap-2.5">
                      <Avatar className="size-8 border border-border/70">
                        <AvatarImage src={author?.avatar_url ?? undefined} alt={name} />
                        <AvatarFallback className="text-[10px]">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link
                            to="/u/$username"
                            params={{ username: author?.username ?? "delegate" }}
                            className="text-sm font-semibold hover:text-primary"
                          >
                            {name}
                          </Link>
                          <LevelPill level={levelMap.get(message.user_id) ?? 1} />
                          <RankBadge rank={author?.equipped_rank ? rankMap.get(author.equipped_rank) : null} />
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Reply"
                              onClick={() => setReplyTo({ id: message.id, name })}
                            >
                              <Reply className="size-3.5" />
                            </Button>
                            {data?.isStaff && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={message.pinned ? "Unpin" : "Pin"}
                                  onClick={() =>
                                    moderate.mutate({
                                      messageId: message.id,
                                      action: message.pinned ? "unpin" : "pin",
                                    })
                                  }
                                >
                                  <Pin className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Delete message"
                                  onClick={() => moderate.mutate({ messageId: message.id, action: "delete" })}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Mute member"
                                  onClick={() => muteUser.mutate(message.user_id)}
                                >
                                  <Shield className="size-3.5" />
                                </Button>
                              </>
                            )}
                          </span>
                        </div>
                        {parent && (
                          <p className="mt-0.5 truncate border-l-2 border-border pl-2 text-[11px] text-muted-foreground">
                            {parent.body}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">
                          {message.deleted ? (
                            <em className="text-muted-foreground">Message removed by moderators.</em>
                          ) : (
                            message.body
                          )}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {[...counts.entries()].map(([emoji, count]) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => react.mutate({ messageId: message.id, emoji })}
                              className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] hover:border-primary/50"
                            >
                              {emoji} {count}
                            </button>
                          ))}
                          <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            {EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                aria-label={`React ${emoji}`}
                                onClick={() => react.mutate({ messageId: message.id, emoji })}
                                className="rounded-full px-1 text-[11px] hover:bg-accent"
                              >
                                {emoji}
                              </button>
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="py-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim() || send.isPending) return;
          send.mutate(draft);
        }}
      >
        {replyTo && (
          <div className="mb-1.5 flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-xs">
            Replying to <span className="font-medium">{replyTo.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Cancel reply"
              className="ml-auto"
              onClick={() => setReplyTo(null)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={data?.muted ? "You are muted." : "Message the global community…"}
            disabled={data?.muted}
            maxLength={1200}
          />
          <Button type="submit" size="icon" aria-label="Send" disabled={data?.muted || send.isPending}>
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
