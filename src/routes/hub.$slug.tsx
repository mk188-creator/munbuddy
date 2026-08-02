import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Globe2,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Share2,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchBookmarkIds,
  fetchConferenceBySlug,
  formatDateRange,
  locationLabel,
  modeLabel,
  toggleBookmark,
} from "@/lib/conferences";
import { shareConference } from "@/lib/hub-actions";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hub/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — MUN Hub` },
      {
        name: "description",
        content:
          "Conference details, dates, venue, committees and registration — listed on MUN Hub, Your Complete Model United Nations Platform.",
      },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — MUN Hub` },
      {
        property: "og:description",
        content: "Dates, venue, committees and registration details for this Model UN conference.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `https://munbuddy.lovable.app/hub/${params.slug}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `https://munbuddy.lovable.app/hub/${params.slug}` }],
  }),
  component: ConferencePage,
});

function ConferencePage() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();

  const conference = useQuery({
    queryKey: ["conference", slug],
    queryFn: () => fetchConferenceBySlug(slug),
  });
  const bookmarks = useQuery({ queryKey: ["conference-bookmarks"], queryFn: fetchBookmarkIds });

  const bookmarked = new Set(bookmarks.data ?? []).has(conference.data?.id ?? "");

  const bookmarkMutation = useMutation({
    mutationFn: () => toggleBookmark(conference.data!.id, bookmarked),
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

  if (conference.isLoading) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-10 sm:px-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  const data = conference.data;
  if (!data) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <div className="mx-auto max-w-md px-6 py-24 text-center animate-rise">
          <h1 className="font-display text-2xl font-semibold">Conference not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This listing may have been removed or is not published yet.
          </p>
          <Button asChild variant="hero" className="mt-6">
            <Link to="/hub">Back to directory</Link>
          </Button>
        </div>
      </div>
    );
  }

  const socials = [
    { href: data.website_url, icon: Globe2, label: "Website" },
    { href: data.instagram_url, icon: Instagram, label: "Instagram" },
    { href: data.linkedin_url, icon: Linkedin, label: "LinkedIn" },
    { href: data.twitter_url, icon: Twitter, label: "X / Twitter" },
  ].filter((entry) => entry.href);

  return (
    <div className="min-h-screen">
      <PublicHeader />

      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Link
          to="/hub"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> All conferences
        </Link>

        <div className="panel mt-4 overflow-hidden animate-rise">
          <div className="relative h-40 bg-surface-raised sm:h-56">
            {data.banner_url ? (
              <img
                src={data.banner_url}
                alt={`${data.name} banner`}
                className="size-full object-cover"
              />
            ) : (
              <div
                className="size-full opacity-30"
                style={{ background: "var(--gradient-emerald)" }}
              />
            )}
          </div>

          <div className="p-6">
            <div className="flex flex-wrap items-start gap-4">
              {data.logo_url ? (
                <img
                  src={data.logo_url}
                  alt={`${data.name} logo`}
                  className="size-14 rounded-xl object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-2xl font-semibold sm:text-3xl">{data.name}</h1>
                {data.tagline ? (
                  <p className="mt-1 text-sm text-muted-foreground">{data.tagline}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="surface"
                  size="icon"
                  aria-label={bookmarked ? "Remove bookmark" : "Bookmark conference"}
                  onClick={() => bookmarkMutation.mutate()}
                >
                  <Bookmark className={cn("size-4", bookmarked && "fill-primary text-primary")} />
                </Button>
                <Button
                  variant="surface"
                  size="icon"
                  aria-label="Share conference"
                  onClick={() => void shareConference(data)}
                >
                  <Share2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Detail icon={CalendarDays} label="Dates">
                {formatDateRange(data.start_date, data.end_date)}
              </Detail>
              <Detail icon={data.mode === "online" ? Globe2 : MapPin} label="Location">
                {locationLabel(data)}
                {data.venue && data.mode !== "online" ? ` · ${data.venue}` : ""}
              </Detail>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{modeLabel(data.mode)}</Badge>
              {data.delegate_fee ? <Badge variant="secondary">{data.delegate_fee}</Badge> : null}
            </div>

            {data.registration_url ? (
              <Button asChild variant="hero" size="lg" className="mt-6 w-full sm:w-auto">
                <a href={data.registration_url} target="_blank" rel="noreferrer noopener">
                  Register as a delegate
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        {data.description ? (
          <section className="panel mt-5 p-6 animate-rise">
            <h2 className="font-display text-lg font-semibold">About the conference</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {data.description}
            </p>
          </section>
        ) : null}

        {data.committees.length > 0 ? (
          <section className="panel mt-5 p-6 animate-rise">
            <h2 className="font-display text-lg font-semibold">Committees &amp; agendas</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.committees.map((committee, index) => (
                <li
                  key={`${committee.name}-${index}`}
                  className="rounded-lg border border-border bg-surface-raised p-4 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <p className="text-sm font-medium">{committee.name}</p>
                  {committee.agenda ? (
                    <p className="mt-1 text-xs text-muted-foreground">{committee.agenda}</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Agenda to be announced</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {(socials.length > 0 || data.contact_email || data.contact_phone) && (
          <section className="panel mt-5 p-6 animate-rise">
            <h2 className="font-display text-lg font-semibold">Contact &amp; links</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((social) => (
                <Button asChild key={social.label} variant="surface" size="sm">
                  <a href={social.href} target="_blank" rel="noreferrer noopener">
                    <social.icon className="size-4" /> {social.label}
                  </a>
                </Button>
              ))}
              {data.contact_email ? (
                <Button asChild variant="surface" size="sm">
                  <a href={`mailto:${data.contact_email}`}>
                    <Mail className="size-4" /> {data.contact_email}
                  </a>
                </Button>
              ) : null}
              {data.contact_phone ? (
                <Button asChild variant="surface" size="sm">
                  <a href={`tel:${data.contact_phone}`}>
                    <Phone className="size-4" /> {data.contact_phone}
                  </a>
                </Button>
              ) : null}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5 text-primary" /> {label}
      </p>
      <p className="mt-1.5 text-sm">{children}</p>
    </div>
  );
}
