import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RichTextEditor } from "@/components/documents/RichTextEditor";
import { exportDocument } from "@/lib/export";
import { getDocument, updateDocument } from "@/lib/documents.functions";

export const Route = createFileRoute("/_authenticated/documents/$documentId")({
  component: DocumentPage,
});

function DocumentPage() {
  const { documentId } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchDocument = useServerFn(getDocument);
  const saveDocument = useServerFn(updateDocument);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const loaded = useRef(false);

  const document = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => fetchDocument({ data: { id: documentId } }),
  });

  useEffect(() => {
    if (!document.data || loaded.current) return;
    loaded.current = true;
    setTitle(document.data.title);
    setContent(document.data.content);
  }, [document.data]);

  const save = useMutation({
    mutationFn: (payload: { title: string; content: string }) =>
      saveDocument({ data: { id: documentId, ...payload } }),
    onSuccess: () => {
      setDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const persist = useCallback(
    (nextTitle: string, nextContent: string) => {
      save.mutate({ title: nextTitle, content: nextContent });
    },
    [save],
  );

  useEffect(() => {
    if (!dirty) return;
    const timeout = setTimeout(() => persist(title, content), 1200);
    return () => clearTimeout(timeout);
  }, [dirty, title, content, persist]);

  if (document.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!document.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-muted-foreground">This document no longer exists.</p>
        <Button asChild variant="surface">
          <Link to="/documents">Back to documents</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/documents">
            <ArrowLeft className="size-4" /> Documents
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {save.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Saving…
              </>
            ) : dirty ? (
              "Unsaved changes"
            ) : (
              <>
                <Check className="size-3.5 text-primary" /> Saved
              </>
            )}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="surface" size="sm">
                <Download className="size-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => void exportDocument(title, content, "docx")}>
                Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void exportDocument(title, content, "pdf")}>
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void exportDocument(title, content, "txt")}>
                Plain text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Input
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          setDirty(true);
        }}
        placeholder="Document title"
        className="mt-5 h-auto border-none bg-transparent px-0 font-display text-2xl font-semibold shadow-none focus-visible:ring-0"
      />

      <div className="mt-4">
        <RichTextEditor
          value={content}
          onChange={(next) => {
            setContent(next);
            setDirty(true);
          }}
        />
      </div>
    </div>
  );
}
