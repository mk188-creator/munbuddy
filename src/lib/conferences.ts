import { supabase } from "@/integrations/supabase/client";

export type Conference = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  start_date: string | null;
  end_date: string | null;
  venue: string;
  city: string;
  country: string;
  mode: string;
  registration_url: string;
  website_url: string;
  instagram_url: string;
  linkedin_url: string;
  twitter_url: string;
  contact_email: string;
  contact_phone: string;
  committees: Committee[];
  delegate_fee: string;
  published: boolean;
  created_at: string;
};

export type Committee = { name: string; agenda?: string };

export type ConferenceMode = "offline" | "online" | "hybrid";

export const CONFERENCE_MODES: { value: ConferenceMode; label: string }[] = [
  { value: "offline", label: "In person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

export function modeLabel(mode: string) {
  return CONFERENCE_MODES.find((entry) => entry.value === mode)?.label ?? "In person";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return "Dates to be announced";
  const fmt = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  if (start && end && start !== end) return `${fmt(start)} — ${fmt(end)}`;
  return fmt((start ?? end) as string);
}

export function locationLabel(conference: Conference) {
  const parts = [conference.city, conference.country].filter(Boolean);
  if (parts.length) return parts.join(", ");
  if (conference.mode === "online") return "Online";
  return conference.venue || "Venue to be announced";
}

function normalize(row: Record<string, unknown>): Conference {
  const committees = Array.isArray(row.committees) ? (row.committees as Committee[]) : [];
  return { ...(row as unknown as Conference), committees };
}

export async function fetchConferences() {
  const { data, error } = await supabase
    .from("conferences")
    .select("*")
    .eq("published", true)
    .order("start_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalize);
}

export async function fetchConferenceBySlug(slug: string) {
  const { data, error } = await supabase
    .from("conferences")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalize(data) : null;
}

export async function fetchMyConferences(userId: string) {
  const { data, error } = await supabase
    .from("conferences")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalize);
}

export async function fetchBookmarkIds() {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [] as string[];
  const { data, error } = await supabase.from("conference_bookmarks").select("conference_id");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.conference_id);
}

export async function toggleBookmark(conferenceId: string, bookmarked: boolean) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Sign in to bookmark conferences");
  if (bookmarked) {
    const { error } = await supabase
      .from("conference_bookmarks")
      .delete()
      .eq("conference_id", conferenceId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return false;
  }
  const { error } = await supabase
    .from("conference_bookmarks")
    .insert({ conference_id: conferenceId, user_id: userId });
  if (error) throw new Error(error.message);
  return true;
}

export type ConferenceInput = Omit<
  Conference,
  "id" | "user_id" | "created_at" | "slug"
> & { slug?: string };

export async function createConference(input: ConferenceInput) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Sign in to list a conference");

  const base = slugify(input.name) || "mun-conference";
  let slug = base;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: existing } = await supabase
      .from("conferences")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data, error } = await supabase
    .from("conferences")
    .insert({ ...input, slug, user_id: userId, committees: input.committees })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalize(data);
}
