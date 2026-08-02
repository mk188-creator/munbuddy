import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  CONFERENCE_MODES,
  createConference,
  fetchMyConferences,
  formatDateRange,
  type Committee,
} from "@/lib/conferences";
import { playSound } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/hub/new")({
  head: () => ({
    meta: [
      { title: "List Your MUN — MUN Hub" },
      {
        name: "description",
        content:
          "Publish your Model United Nations conference on MUN Hub so delegates worldwide can discover and register.",
      },
      { property: "og:title", content: "List Your MUN — MUN Hub" },
      {
        property: "og:description",
        content: "Publish your Model UN conference and reach delegates worldwide.",
      },
    ],
  }),
  component: ListYourMun,
});

const emptyForm = {
  name: "",
  tagline: "",
  description: "",
  logo_url: "",
  banner_url: "",
  start_date: "",
  end_date: "",
  venue: "",
  city: "",
  country: "",
  mode: "offline",
  registration_url: "",
  website_url: "",
  instagram_url: "",
  linkedin_url: "",
  twitter_url: "",
  contact_email: "",
  contact_phone: "",
  delegate_fee: "",
  published: true,
};

function ListYourMun() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [committees, setCommittees] = useState<Committee[]>([]);

  const mine = useQuery({
    queryKey: ["my-conferences", user?.id],
    queryFn: () => fetchMyConferences(user!.id),
    enabled: Boolean(user?.id),
  });

  const set = (key: keyof typeof emptyForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = useMutation({
    mutationFn: () =>
      createConference({
        ...form,
        logo_url: form.logo_url || null,
        banner_url: form.banner_url || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        committees: committees.filter((committee) => committee.name.trim()),
      }),
    onSuccess: async (conference) => {
      playSound("success");
      toast.success("Your conference is live on MUN Hub");
      await queryClient.invalidateQueries({ queryKey: ["conferences"] });
      await queryClient.invalidateQueries({ queryKey: ["my-conferences"] });
      void navigate({ to: "/hub/$slug", params: { slug: conference.slug } });
    },
    onError: (error: Error) => {
      playSound("error");
      toast.error(error.message);
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="animate-rise">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">List your MUN</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Publish your conference to the MUN Hub directory. Committees and agendas are optional —
          you can publish now and add them later.
        </p>
      </div>

      <form
        className="panel mt-6 space-y-6 p-6 animate-rise"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.name.trim()) {
            playSound("error");
            toast.error("Give your conference a name");
            return;
          }
          submit.mutate();
        }}
      >
        <Section title="The basics">
          <Field label="Conference name" required>
            <Input
              required
              maxLength={120}
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="Harvard Model United Nations 2027"
            />
          </Field>
          <Field label="Tagline">
            <Input
              maxLength={140}
              value={form.tagline}
              onChange={(event) => set("tagline", event.target.value)}
              placeholder="Three days of diplomacy in Boston"
            />
          </Field>
          <Field label="Description">
            <Textarea
              rows={5}
              maxLength={4000}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              placeholder="Who runs it, what delegates can expect, awards, socials…"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Logo image URL">
              <Input
                type="url"
                value={form.logo_url}
                onChange={(event) => set("logo_url", event.target.value)}
                placeholder="https://…/logo.png"
              />
            </Field>
            <Field label="Banner image URL">
              <Input
                type="url"
                value={form.banner_url}
                onChange={(event) => set("banner_url", event.target.value)}
                placeholder="https://…/banner.jpg"
              />
            </Field>
          </div>
        </Section>

        <Section title="When and where">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start date">
              <Input
                type="date"
                value={form.start_date}
                onChange={(event) => set("start_date", event.target.value)}
              />
            </Field>
            <Field label="End date">
              <Input
                type="date"
                value={form.end_date}
                onChange={(event) => set("end_date", event.target.value)}
              />
            </Field>
          </div>
          <Field label="Format">
            <Select value={form.mode} onValueChange={(value) => set("mode", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONFERENCE_MODES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Venue">
            <Input
              value={form.venue}
              onChange={(event) => set("venue", event.target.value)}
              placeholder="Sanders Theatre / Zoom"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City">
              <Input value={form.city} onChange={(event) => set("city", event.target.value)} />
            </Field>
            <Field label="Country">
              <Input
                value={form.country}
                onChange={(event) => set("country", event.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Registration and links">
          <Field label="Registration link">
            <Input
              type="url"
              value={form.registration_url}
              onChange={(event) => set("registration_url", event.target.value)}
              placeholder="https://…/register"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Website">
              <Input
                type="url"
                value={form.website_url}
                onChange={(event) => set("website_url", event.target.value)}
              />
            </Field>
            <Field label="Delegate fee">
              <Input
                value={form.delegate_fee}
                onChange={(event) => set("delegate_fee", event.target.value)}
                placeholder="$45 / delegate"
              />
            </Field>
            <Field label="Instagram">
              <Input
                type="url"
                value={form.instagram_url}
                onChange={(event) => set("instagram_url", event.target.value)}
              />
            </Field>
            <Field label="LinkedIn">
              <Input
                type="url"
                value={form.linkedin_url}
                onChange={(event) => set("linkedin_url", event.target.value)}
              />
            </Field>
            <Field label="X / Twitter">
              <Input
                type="url"
                value={form.twitter_url}
                onChange={(event) => set("twitter_url", event.target.value)}
              />
            </Field>
            <Field label="Contact email">
              <Input
                type="email"
                value={form.contact_email}
                onChange={(event) => set("contact_email", event.target.value)}
              />
            </Field>
            <Field label="Contact phone">
              <Input
                value={form.contact_phone}
                onChange={(event) => set("contact_phone", event.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Committees & agendas (optional)">
          <p className="text-xs text-muted-foreground">
            Not finalised yet? Leave this empty — you can publish now and delegates will see
            &ldquo;Agenda to be announced&rdquo;.
          </p>
          <div className="space-y-3">
            {committees.map((committee, index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={committee.name}
                  placeholder="Committee (e.g. UNSC)"
                  onChange={(event) =>
                    setCommittees((prev) =>
                      prev.map((item, position) =>
                        position === index ? { ...item, name: event.target.value } : item,
                      ),
                    )
                  }
                />
                <Input
                  value={committee.agenda ?? ""}
                  placeholder="Agenda (optional)"
                  onChange={(event) =>
                    setCommittees((prev) =>
                      prev.map((item, position) =>
                        position === index ? { ...item, agenda: event.target.value } : item,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove committee"
                  onClick={() =>
                    setCommittees((prev) => prev.filter((_, position) => position !== index))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="surface"
            size="sm"
            onClick={() => setCommittees((prev) => [...prev, { name: "", agenda: "" }])}
          >
            <Plus className="size-4" /> Add committee
          </Button>
        </Section>

        <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-5">
          <div>
            <p className="text-sm">Publish immediately</p>
            <p className="text-xs text-muted-foreground">
              Turn off to save it privately and publish later.
            </p>
          </div>
          <Switch
            checked={form.published}
            onCheckedChange={(checked) => set("published", checked)}
          />
        </div>

        <Button type="submit" variant="hero" size="lg" disabled={submit.isPending}>
          {submit.isPending ? "Publishing…" : "Publish conference"}
        </Button>
      </form>

      {(mine.data ?? []).length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold">Your listings</h2>
          <ul className="mt-3 space-y-2">
            {(mine.data ?? []).map((conference) => (
              <li
                key={conference.id}
                className="panel flex items-center justify-between gap-3 p-4 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{conference.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDateRange(conference.start_date, conference.end_date)} ·{" "}
                    {conference.published ? "Published" : "Draft"}
                  </p>
                </div>
                <Button
                  variant="surface"
                  size="sm"
                  onClick={() =>
                    void navigate({ to: "/hub/$slug", params: { slug: conference.slug } })
                  }
                >
                  View
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-border/70 pt-5 first:border-0 first:pt-0">
      <legend className="font-display text-sm font-semibold text-muted-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
