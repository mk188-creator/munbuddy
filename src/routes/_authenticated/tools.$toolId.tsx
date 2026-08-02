import { createFileRoute, useNavigate, notFound, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createThread } from "@/lib/chat.functions";
import { getTool } from "@/lib/mun-tools";

export const Route = createFileRoute("/_authenticated/tools/$toolId")({
  loader: ({ params }) => {
    const tool = getTool(params.toolId);
    if (!tool) throw notFound();
    return { name: tool.name, tagline: tool.tagline };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — MUN Hub` },
          { name: "description", content: loaderData.tagline },
          { property: "og:title", content: `${loaderData.name} — MUN Hub` },
          { property: "og:description", content: loaderData.tagline },
        ]
      : [
          { title: "Tool unavailable — MUN Hub" },
          { name: "robots", content: "noindex" },
        ],
  }),
  component: ToolPage,
  notFoundComponent: ToolNotFound,
});

function ToolNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-lg font-semibold">Tool not found</h1>
      <Button asChild variant="surface">
        <Link to="/tools">Back to toolkit</Link>
      </Button>
    </div>
  );
}

function ToolPage() {
  const { toolId } = Route.useParams();
  const tool = getTool(toolId)!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const newThread = useServerFn(createThread);
  const [values, setValues] = useState<Record<string, string>>({});

  const set = (name: string, value: string) =>
    setValues((previous) => ({ ...previous, [name]: value }));

  const run = useMutation({
    mutationFn: async () => {
      const thread = await newThread({ data: { title: tool.name, tool: tool.id } });
      return thread;
    },
    onSuccess: async (thread) => {
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      void navigate({
        to: "/chat/$threadId",
        params: { threadId: thread.id },
        search: { prompt: tool.buildPrompt(values), tool: tool.id },
      });
    },
  });

  const missing = tool.fields.some((field) => field.required && !values[field.name]?.trim());

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/tools">
          <ArrowLeft className="size-4" /> Toolkit
        </Link>
      </Button>

      <h1 className="font-display text-2xl font-semibold">{tool.name}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{tool.tagline}</p>

      <form
        className="panel mt-6 space-y-5 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!missing) run.mutate();
        }}
      >
        {tool.fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="ml-1 text-primary">*</span>}
            </Label>

            {field.type === "textarea" && (
              <Textarea
                id={field.name}
                rows={3}
                placeholder={field.placeholder ?? ""}
                value={values[field.name] ?? ""}
                onChange={(event) => set(field.name, event.target.value)}
              />
            )}

            {field.type === "text" && (
              <Input
                id={field.name}
                placeholder={field.placeholder ?? ""}
                value={values[field.name] ?? ""}
                onChange={(event) => set(field.name, event.target.value)}
              />
            )}

            {field.type === "select" && (
              <Select
                value={values[field.name] ?? field.options?.[0] ?? ""}
                onValueChange={(value) => set(field.name, value)}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
          </div>
        ))}

        <Button type="submit" variant="hero" className="w-full" disabled={missing || run.isPending}>
          {run.isPending ? "Preparing…" : `Run ${tool.name}`}
        </Button>
        {missing && (
          <p className="text-center text-xs text-muted-foreground">
            Fill the required fields to continue.
          </p>
        )}
      </form>
    </div>
  );
}
