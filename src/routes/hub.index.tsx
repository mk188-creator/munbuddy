import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { ConferenceCard } from "@/components/hub/ConferenceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchBookmarkIds,
  fetchConferences,
  toggleBookmark,
  type Conference,
} from "@/lib/conferences";
import { shareConference } from "@/lib/hub-actions";
import { playSound } from "@/lib/sound";

export const Route = createFileRoute("/hub/")({
  head: () => ({
    meta: [
      { title: "MUN Hub Directory — Find Model UN Conferences" },
      {
        name: "description",
        content:
          "Browse and filter Model United Nations conferences worldwide, or list your own MUN so delegates can find it.",
      },
      { property: "og:title", content: "MUN Hub Directory — Find Model UN Conferences" },
      {
        property: "og:description",
        content: "Search Model UN conferences by location, date and format — or list your own.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://munbuddy.lovable.app/hub" }],
  }),
  component: HubDirectory,
});

type Timing = "all" | "upcoming" | "past";

function HubDirectory() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");
  const [country, setCountry] = useState("all");
  const [timing, setTiming] = useState<Timing>("upcoming");
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  const conferences = useQuery({ queryKey: ["conferences"], queryFn: fetchConferences });
  const bookmarks = useQuery({ queryKey: ["conference-bookmarks"], queryFn: fetchBookmarkIds });

  const bookmarkMutation = useMutation({
    mutationFn: ({ id, bookmarked }: { id: string; bookmarked: boolean }) =>
      toggleBookmark(id, bookmarked),
    onSuccess: async (nowBookmarked) => {
      playSound("success");
      toast.success(nowBookmarked ? "Saved to your bookmarks" : "Removed from bookmarks");
      await queryClient.invalidateQueries({ queryKey: ["conference-bookmarks"] });
    },
    onError: (error: Error) => {
      playSound("error");
      toast.error(error.message);
    },
  });

  const countries = useMemo(() => {
    const set = new Set((conferences.data ?? []).map((item) => item.country).filter(Boolean));
    return Array.from(set).sort();
  }, [conferences.data]);

  const bookmarked = new Set(bookmarks.data ?? []);
  const today = new Date().toISOString().slice(0, 10);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (conferences.data ?? []).filter((conference) => {
      if (mode !== "all" && conference.mode !== mode) return false;
      if (country !== "all" && conference.country !== country) return false;
      if (onlyBookmarked && !bookmarked.has(conference.id)) return false;
      if (timing !== "all") {
        const reference = conference.end_date ?? conference.start_date;
        if (reference) {
          const isPast = reference < today;
          if (timing === "upcoming" && isPast) return false;
          if (timing === "past" && !isPast) return false;
        } else if (timing === "past") {
          return false;
        }
      }
      if (!term) return true;
      return [
        conference.name,
        conference.tagline,
        conference.description,
        conference.city,
        conference.country,
        conference.venue,
        ...conference.committees.map((committee) => `${committee.name} ${committee.agenda ?? ""}`),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [conferences.data, query, mode, country, timing, onlyBookmarked, bookmarks.data, today]);

  const handleBookmark = (conference: Conference) =>
    bookmarkMutation.mutate({ id: conference.id, bookmarked: bookmarked.has(conference.id) });

  return (
    <div className="min-h-screen">
      <PublicHeader />

      <section className="relative overflow-hidden px-4 pb-8 pt-12 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-52 left-1/2 size-[36rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--gradient-emerald)" }}
        />
        <div className="relative mx-auto max-w-3xl text-center animate-rise">
          <h1 className="text-balance font-display text-3xl font-semibold sm:text-5xl">
            Find your next <span className="text-gradient">Model UN</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
            A directory built by organizers, for delegates. Search conferences worldwide, bookmark
            the ones you want, and register in a click.
          </p>
          <Button asChild variant="hero" size="lg" className="mt-6">
            <Link to="/hub/new">
              <Plus className="size-4" /> List your MUN
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="panel mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, city, committee or agenda"
              className="pl-9"
              aria-label="Search conferences"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-[9.5rem]" aria-label="Filter by format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All formats</SelectItem>
                <SelectItem value="offline">In person</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-[9.5rem]" aria-label="Filter by country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timing} onValueChange={(value) => setTiming(value as Timing)}>
              <SelectTrigger className="w-[9.5rem]" aria-label="Filter by date">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
                <SelectItem value="all">Any date</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={onlyBookmarked ? "hero" : "surface"}
              size="default"
              onClick={() => setOnlyBookmarked((value) => !value)}
            >
              <SlidersHorizontal className="size-4" />
              Bookmarked
            </Button>
          </div>
        </div>

        {conferences.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <Skeleton key={key} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="panel animate-rise px-6 py-16 text-center">
            <h2 className="font-display text-lg font-semibold">No conferences match yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Try widening your filters — or be the first to list a conference here.
            </p>
            <Button asChild variant="hero" className="mt-6">
              <Link to="/hub/new">List your MUN</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((conference) => (
              <ConferenceCard
                key={conference.id}
                conference={conference}
                bookmarked={bookmarked.has(conference.id)}
                onToggleBookmark={handleBookmark}
                onShare={(item) => void shareConference(item)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
