import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, updateProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MUN Hub" },
      { name: "description", content: "Manage your delegate profile, preferences and notifications." },
      { property: "og:title", content: "Settings — MUN Hub" },
      { property: "og:description", content: "Manage your MUN Hub profile and preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const saveProfile = useServerFn(updateProfile);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile({}) });
  const [form, setForm] = useState({
    full_name: "",
    school: "",
    country: "",
    bio: "",
    mun_experience: "",
    email_notifications: true,
    product_updates: true,
    public_profile: false,
  });

  useEffect(() => {
    if (!profile.data) return;
    setForm({
      full_name: profile.data.full_name ?? "",
      school: profile.data.school ?? "",
      country: profile.data.country ?? "",
      bio: profile.data.bio ?? "",
      mun_experience: profile.data.mun_experience ?? "",
      email_notifications: profile.data.email_notifications,
      product_updates: profile.data.product_updates,
      public_profile: profile.data.public_profile,
    });
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () => saveProfile({ data: form }),
    onSuccess: async () => {
      toast.success("Profile saved");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (profile.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const toggles = [
    { key: "email_notifications" as const, label: "Email notifications", help: "Conference reminders and account emails." },
    { key: "product_updates" as const, label: "Product updates", help: "Occasional news about new MUN tools." },
    { key: "public_profile" as const, label: "Public profile", help: "Let other delegates see your profile." },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">Settings</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Signed in as {user?.email}</p>

      <form
        className="panel mt-6 space-y-5 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(event) => setForm({ ...form, full_name: event.target.value })}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="school">School / Institution</Label>
            <Input
              id="school"
              value={form.school}
              onChange={(event) => setForm({ ...form, school: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Home country</Label>
            <Input
              id="country"
              value={form.country}
              onChange={(event) => setForm({ ...form, country: event.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mun_experience">MUN experience</Label>
          <Input
            id="mun_experience"
            placeholder="e.g. 6 conferences, two best delegate awards"
            value={form.mun_experience}
            onChange={(event) => setForm({ ...form, mun_experience: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={3}
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
          />
        </div>

        <div className="space-y-4 border-t border-border/70 pt-5">
          {toggles.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm">{toggle.label}</p>
                <p className="text-xs text-muted-foreground">{toggle.help}</p>
              </div>
              <Switch
                checked={form[toggle.key]}
                onCheckedChange={(checked) => setForm({ ...form, [toggle.key]: checked })}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-border/70 pt-5">
          <Button type="button" variant="ghost" onClick={() => void signOut()}>
            Sign out
          </Button>
          <Button type="submit" variant="hero" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
