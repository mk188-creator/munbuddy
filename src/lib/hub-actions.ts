import { toast } from "sonner";

import { playSound } from "@/lib/sound";
import type { Conference } from "@/lib/conferences";

export async function shareConference(conference: Conference) {
  const url = `${window.location.origin}/hub/${conference.slug}`;
  const shareData = {
    title: `${conference.name} — MUN Hub`,
    text: conference.tagline || "Discover this Model UN conference on MUN Hub.",
    url,
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      playSound("success");
      return;
    }
    await navigator.clipboard.writeText(url);
    playSound("success");
    toast.success("Link copied to clipboard");
  } catch (error) {
    if ((error as Error).name === "AbortError") return;
    playSound("error");
    toast.error("Could not share this conference");
  }
}
