import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FilePlus2, FolderPlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  listDocuments,
  createDocument,
  deleteDocument,
  createFolder,
  deleteFolder,
} from "@/lib/documents.functions";

export const Route = createFileRoute("/_authenticated/documents/")({
  head: () => ({
    meta: [
      { title: "Documents — MUN Hub" },
      {
        name: "description",
        content: "Write, organise and export your position papers, resolutions and speeches.",
      },
      { property: "og:title", content: "Documents — MUN Hub" },
      { property: "og:description", content: "Your Model UN document workspace." },
    ],
  }),
  component: DocumentsIndex,
});

function DocumentsIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchAll = useServerFn(listDocuments);
  const newDocument = useServerFn(createDocument);
  const removeDocument = useServerFn(deleteDocument);
  const newFolder = useServerFn(createFolder);
  const removeFolder = useServerFn(deleteFolder);

  const [folderName, setFolderName] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const data = useQuery({ queryKey: ["documents"], queryFn: () => fetchAll({}) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["documents"] });

  const create = useMutation({
    mutationFn: () =>
      newDocument({ data: { title: "Untitled document", folderId: activeFolder } }),
    onSuccess: async (result) => {
      await invalidate();
      void navigate({ to: "/documents/$documentId", params: { documentId: result.id } });
    },
  });

  const addFolder = useMutation({
    mutationFn: () => newFolder({ data: { name: folderName.trim() } }),
    onSuccess: async () => {
      setFolderName("");
      await invalidate();
    },
  });

  const dropDocument = useMutation({
    mutationFn: (id: string) => removeDocument({ data: { id } }),
    onSuccess: invalidate,
  });

  const dropFolder = useMutation({
    mutationFn: (id: string) => removeFolder({ data: { id } }),
    onSuccess: async () => {
      setActiveFolder(null);
      await invalidate();
    },
  });

  const documents = (data.data?.documents ?? []).filter((document) =>
    activeFolder ? document.folder_id === activeFolder : true,
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Documents</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Draft, refine and export your committee materials.
          </p>
        </div>
        <Button variant="hero" onClick={() => create.mutate()} disabled={create.isPending}>
          <FilePlus2 className="size-4" /> New document
        </Button>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="panel h-fit p-4">
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground">Folders</h2>
          <div className="mt-3 space-y-1">
            <button
              type="button"
              onClick={() => setActiveFolder(null)}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                activeFolder === null ? "bg-accent text-accent-foreground" : "hover:bg-muted",
              )}
            >
              All documents
            </button>
            {data.data?.folders.map((folder) => (
              <div key={folder.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveFolder(folder.id)}
                  className={cn(
                    "min-w-0 flex-1 truncate rounded-md px-3 py-2 text-left text-sm transition-colors",
                    activeFolder === folder.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {folder.name}
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete folder ${folder.name}`}
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => dropFolder.mutate(folder.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (folderName.trim()) addFolder.mutate();
            }}
          >
            <Input
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="New folder"
              className="h-8 text-xs"
            />
            <Button type="submit" variant="surface" size="icon-sm" aria-label="Create folder">
              <FolderPlus className="size-4" />
            </Button>
          </form>
        </aside>

        <section>
          {data.isLoading && <Skeleton className="h-32 w-full" />}
          {!data.isLoading && documents.length === 0 && (
            <div className="panel p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No documents here yet. Create one to start drafting.
              </p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {documents.map((document) => (
              <div key={document.id} className="panel group relative p-5">
                <Link
                  to="/documents/$documentId"
                  params={{ documentId: document.id }}
                  className="block"
                >
                  <h3 className="truncate font-display text-base font-semibold">
                    {document.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {new Date(document.updated_at).toLocaleString()}
                  </p>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${document.title}`}
                  className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => dropDocument.mutate(document.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
