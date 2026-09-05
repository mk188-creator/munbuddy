import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Globe2,
  Pin,
  Reply,
  Search,
  Send,
  Shield,
  SmilePlus,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
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
      {
        property: "og:description",
        content: "Talk strategy, find partners and share wins with delegates worldwide.",
      },
    ],
  }),
  component: CommunityPage,
});

const EMOJIS = ["👍", "🔥", "🎉", "🌍", "😂", "🕊️"];
const MAX = 1200;

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function CommunityPage() {
  const feedFn = useServerFn(getCommunityFeed);
  const sendFn = useServerFn(sendCommunityMessage);
  const reactFn = useServerFn(reactToMessage);
  const modMessageFn = useServerFn(moderateMessage);
  const modUserFn = useServerFn(moderateUser);
  const markReadFn = useServerFn(markChatRead);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const feed = useQuery({
    queryKey: ["community", search],
    queryFn: () => feedFn({ data: { search } }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["community"] });

  // One realtime channel for the page lifetime. Bursts are coalesced so a
  // busy minute can't trigger a refetch storm.
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const schedule = () => {
      if (refetchTimer.current) return;
      refetchTimer.current = setTimeout(() => {
        refetchTimer.current = null;
        void queryClient.invalidateQueries({ queryKey: ["community"] });
      }, 350);
    };
    const channel = supabase
      .channel("community-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_messages" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, schedule)
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      refetchTimer.current = null;
      setLive(false);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastSeen = useRef<string | null>(null);
  const latestId = feed.data?.messages.at(-1)?.id ?? null;
  useEffect(() => {
    if (!latestId || lastSeen.current === latestId) return;
    lastSeen.current = latestId;
    bottomRef.current?.scrollIntoView({ block: "end" });
    void markReadFn({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestId]);

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
    mutationFn: (input: { messageId: string; action: "delete" | "pin" | "unpin" }) =>
      modMessageFn({ data: input }),
    onSuccess: () => {
      toast.success("Moderation applied.");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const muteUser = useMutation({
    mutationFn: (userId: string) =>
      modUserFn({ data: { userId, action: "mute", minutes: 60, reason: "Chat rules" } }),
    onSuccess: () => toast.success("Member muted for 1 hour."),
    onError: (error: Error) => toast.error(error.message),
  });

  const data = feed.data;
  const authorMap = useMemo(() => new Map((data?.authors ?? []).map((a) => [a.id, a])), [data]);
  const rankMap = useMemo(() => new Map((data?.ranks ?? []).map((r) => [r.id, r])), [data]);
  const levelMap = useMemo(
    () => new Map((data?.levels ?? []).map((l) => [l.user_id, l.level])),
    [data],
  );
  const messageMap = useMemo(() => new Map((data?.messages ?? []).map((m) => [m.id, m])), [data]);
  const members = authorMap.size;

  const submit = () => {
    const body = draft.trim();
    if (!body || send.isPending || data?.muted) return;
    send.mutate(body);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-4xl flex-col overflow-hidden px-3 sm:px-6">
      {/* ------------------------------------------------------------ header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border/70 py-3">
        <span className="grid size-9 shrink-0 place-items-center border-2 border-foreground bg-foreground text-background">
          <Globe2 className="size-4" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-base font-semibold leading-tight sm:text-lg">
            Global floor
          </h1>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                live ? "animate-pulse bg-primary" : "bg-muted-foreground/50",
              )}
            />
            {live ? "Live" : "Reconnecting…"}
            {members > 0 && <span className="hidden sm:inline">· {members} delegates in session</span>}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {showSearch || search ? (
            <div className="relative w-36 sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="h-9 pl-8 text-sm"
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search messages"
              onClick={() => setShowSearch(true)}
            >
              <Search className="size-4" />
            </Button>
          )}
          {(showSearch || search) && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close search"
              onClick={() => {
                setSearch("");
                setShowSearch(false);
              }}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------------ pinned */}
      {data?.pinned.length ? (
        <div className="mt-2 shrink-0 border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs">
          <p className="flex items-center gap-1.5 font-semibold uppercase tracking-wide text-primary">
            <Pin className="size-3" /> Pinned
          </p>
          {data.pinned.map((message) => (
            <p key={message.id} className="mt-1 line-clamp-2 text-muted-foreground">
              {message.body}
            </p>
          ))}
        </div>
      ) : null}

      {/* ---------------------------------------------------------- messages */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3">
        {feed.isLoading ? (
          <div className="space-y-4 px-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : feed.isError ? (
          <div className="grid h-full place-items-center px-6 text-center">
            <div className="max-w-xs space-y-3">
              <WifiOff className="mx-auto size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                The floor could not be reached. Check your connection and try again.
              </p>
              <Button size="sm" onClick={() => void feed.refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : (data?.messages.length ?? 0) === 0 ? (
          <div className="grid h-full place-items-center px-6 text-center">
            <div className="max-w-sm space-y-2">
              <Globe2 className="mx-auto size-7 text-muted-foreground" />
              <h2 className="font-display text-base font-semibold">
                {search ? "Nothing matches that search" : "The floor is open"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try a different term or clear the search."
                  : "Be the first delegate to speak. Introduce your committee or ask for a co-sponsor."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-1">
            {(data?.messages ?? []).map((message, index) => {
              const author = authorMap.get(message.user_id);
              const name =
                author?.display_name || author?.full_name || author?.username || "Delegate";
              const previous = data?.messages[index - 1];
              const grouped =
                previous &&
                previous.user_id === message.user_id &&
                new Date(message.created_at).getTime() -
                  new Date(previous.created_at).getTime() <
                  5 * 60_000 &&
                !message.announcement;
              const newDay =
                !previous || dayLabel(previous.created_at) !== dayLabel(message.created_at);
              const parent = message.reply_to ? messageMap.get(message.reply_to) : null;
              const counts = new Map<string, number>();
              (data?.reactions ?? [])
                .filter((r) => r.message_id === message.id)
                .forEach((r) => counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1));

              return (
                <li key={message.id}>
                  {newDay && (
                    <div className="my-4 flex items-center gap-3">
                      <span className="h-px flex-1 bg-border" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {dayLabel(message.created_at)}
                      </span>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      "group relative flex gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-foreground/[0.04]",
                      grouped ? "mt-0" : "mt-3",
                      message.announcement &&
                        "border-l-2 border-primary bg-primary/5 hover:bg-primary/10",
                    )}
                  >
                    <div className="w-8 shrink-0">
                      {!grouped ? (
                        <Avatar className="size-8 border border-border">
                          <AvatarImage src={author?.avatar_url ?? undefined} alt={name} />
                          <AvatarFallback className="text-[10px]">
                            {name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <span className="block pt-1 text-center font-mono text-[9px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {!grouped && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link
                            to="/u/$username"
                            params={{ username: author?.username ?? "delegate" }}
                            className="text-sm font-semibold hover:text-primary"
                          >
                            {name}
                          </Link>
                          <LevelPill level={levelMap.get(message.user_id) ?? 1} />
                          <RankBadge
                            rank={author?.equipped_rank ? rankMap.get(author.equipped_rank) : null}
                          />
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}

                      {parent && (
                        <p className="mt-0.5 truncate border-l-2 border-border pl-2 text-[11px] text-muted-foreground">
                          {parent.body}
                        </p>
                      )}

                      <p className="whitespace-pre-wrap break-words text-[0.9375rem] leading-relaxed text-foreground/90">
                        {message.deleted ? (
                          <em className="text-muted-foreground">Message removed by moderators.</em>
                        ) : (
                          message.body
                        )}
                      </p>

                      {(counts.size > 0 || pickerFor === message.id) && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          {[...counts.entries()].map(([emoji, count]) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => react.mutate({ messageId: message.id, emoji })}
                              className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] transition-colors hover:border-primary/60"
                            >
                              {emoji} {count}
                            </button>
                          ))}
                          {pickerFor === message.id &&
                            EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                aria-label={`React ${emoji}`}
                                onClick={() => {
                                  react.mutate({ messageId: message.id, emoji });
                                  setPickerFor(null);
                                }}
                                className="rounded-full px-1.5 py-0.5 text-[13px] hover:bg-accent"
                              >
                                {emoji}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* action rail */}
                    <div className="absolute -top-3 right-2 hidden items-center gap-0.5 border border-border bg-background p-0.5 shadow-sm group-hover:flex group-focus-within:flex">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="React"
                        onClick={() =>
                          setPickerFor((current) => (current === message.id ? null : message.id))
                        }
                      >
                        <SmilePlus className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Reply"
                        onClick={() => {
                          setReplyTo({ id: message.id, name });
                          textareaRef.current?.focus();
                        }}
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
                            onClick={() =>
                              moderate.mutate({ messageId: message.id, action: "delete" })
                            }
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
                    </div>
                  </motion.div>

                  {/* mobile-only action row (no hover on touch) */}
                  <div className="mt-1 flex gap-1 pl-13 sm:hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setPickerFor((current) => (current === message.id ? null : message.id))
                      }
                      className="ml-11 text-[11px] text-muted-foreground underline underline-offset-2"
                    >
                      React
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo({ id: message.id, name });
                        textareaRef.current?.focus();
                      }}
                      className="text-[11px] text-muted-foreground underline underline-offset-2"
                    >
                      Reply
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ---------------------------------------------------------- composer */}
      <div className="shrink-0 border-t border-border/70 py-3">
        {replyTo && (
          <div className="mb-1.5 flex items-center gap-2 border border-border bg-background px-2.5 py-1 text-xs">
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

        <div className="ink-card flex items-end gap-2 p-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            maxLength={MAX}
            disabled={data?.muted}
            onChange={(event) => {
              setDraft(event.target.value);
              const el = event.target;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
            }}
            onKeyDown={(event) => {
              // Enter sends; Shift+Enter is a newline. preventDefault stops the
              // keypress from ever reaching a form/router handler.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                submit();
              }
            }}
            placeholder={data?.muted ? "You are muted." : "Address the floor…"}
            className="max-h-[140px] min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[0.9375rem] leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <span className="hidden pb-2 font-mono text-[10px] text-muted-foreground sm:block">
            {draft.length}/{MAX}
          </span>
          <Button
            type="button"
            size="icon"
            aria-label="Send message"
            disabled={data?.muted || send.isPending || !draft.trim()}
            onClick={submit}
          >
            <Send className={cn("size-4", send.isPending && "animate-pulse")} />
          </Button>
        </div>
        <p className="mt-1 hidden text-[10px] text-muted-foreground sm:block">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
}
