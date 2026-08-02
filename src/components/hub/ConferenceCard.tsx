import { Link } from "@tanstack/react-router";
import { Bookmark, CalendarDays, Globe2, MapPin, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatDateRange,
  locationLabel,
  modeLabel,
  type Conference,
} from "@/lib/conferences";
import { cn } from "@/lib/utils";

type Props = {
  conference: Conference;
  bookmarked: boolean;
  onToggleBookmark: (conference: Conference) => void;
  onShare: (conference: Conference) => void;
};

export function ConferenceCard({ conference, bookmarked, onToggleBookmark, onShare }: Props) {
  return (
    <article className="panel group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--glow-primary)] animate-rise">
      <div className="relative h-28 overflow-hidden bg-surface-raised">
        {conference.banner_url ? (
          <img
            src={conference.banner_url}
            alt={`${conference.name} banner`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="size-full opacity-30" style={{ background: "var(--gradient-emerald)" }} />
        )}
        <div className="absolute right-2 top-2 flex gap-1.5">
          <Button
            variant="surface"
            size="icon-sm"
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark conference"}
            onClick={() => onToggleBookmark(conference)}
          >
            <Bookmark className={cn("size-4", bookmarked && "fill-primary text-primary")} />
          </Button>
          <Button
            variant="surface"
            size="icon-sm"
            aria-label="Share conference"
            onClick={() => onShare(conference)}
          >
            <Share2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          {conference.logo_url ? (
            <img
              src={conference.logo_url}
              alt={`${conference.name} logo`}
              loading="lazy"
              className="size-10 shrink-0 rounded-lg object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold">{conference.name}</h3>
            {conference.tagline ? (
              <p className="truncate text-xs text-muted-foreground">{conference.tagline}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-3.5 text-primary" />
            {formatDateRange(conference.start_date, conference.end_date)}
          </p>
          <p className="flex items-center gap-2">
            {conference.mode === "online" ? (
              <Globe2 className="size-3.5 text-primary" />
            ) : (
              <MapPin className="size-3.5 text-primary" />
            )}
            {locationLabel(conference)}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge variant="secondary">{modeLabel(conference.mode)}</Badge>
          {conference.committees.length > 0 ? (
            <Badge variant="secondary">{conference.committees.length} committees</Badge>
          ) : null}
          {conference.delegate_fee ? (
            <Badge variant="secondary">{conference.delegate_fee}</Badge>
          ) : null}
        </div>

        <Button asChild variant="surface" size="sm" className="mt-5 w-full">
          <Link to="/hub/$slug" params={{ slug: conference.slug }}>
            View conference
          </Link>
        </Button>
      </div>
    </article>
  );
}
