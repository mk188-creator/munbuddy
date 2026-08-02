import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import * as Icons from "lucide-react";

import { Input } from "@/components/ui/input";
import { MUN_TOOLS, TOOL_CATEGORIES } from "@/lib/mun-tools";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tools/")({
  head: () => ({
    meta: [
      { title: "MUN Tools — MUN Hub" },
      {
        name: "description",
        content:
          "Position papers, resolutions, clauses, amendments, POIs, motions, speeches, crisis directives and research tools for Model UN.",
      },
      { property: "og:title", content: "MUN Tools — MUN Hub" },
      { property: "og:description", content: "Every Model UN tool a delegate needs, in one place." },
    ],
  }),
  component: ToolsIndex,
});

function ToolIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Sparkle;
  return <Icon className={className} />;
}

function ToolsIndex() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const filtered = MUN_TOOLS.filter((tool) => {
    const matchesCategory = category === "All" || tool.category === category;
    const haystack = `${tool.name} ${tool.tagline} ${tool.category}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase().trim());
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <header>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">MUN toolkit</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {MUN_TOOLS.length} purpose-built tools. Fill in the brief, get a committee-ready draft.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools…"
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {["All", ...TOOL_CATEGORIES].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                category === item
                  ? "border-primary/60 bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tool) => (
          <Link
            key={tool.id}
            to="/tools/$toolId"
            params={{ toolId: tool.id }}
            className="panel group p-5 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <ToolIcon name={tool.icon} className="size-5" />
              </span>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {tool.category}
              </span>
            </div>
            <h2 className="mt-4 font-display text-base font-semibold">{tool.name}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{tool.tagline}</p>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No tools match “{query}”.
        </p>
      )}
    </div>
  );
}
