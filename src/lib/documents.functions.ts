import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DocumentSummary = {
  id: string;
  title: string;
  doc_type: string;
  folder_id: string | null;
  updated_at: string;
  created_at: string;
};

export type DocumentRecord = DocumentSummary & { content: string };

export type Folder = { id: string; name: string; created_at: string };

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [documents, folders] = await Promise.all([
      context.supabase
        .from("documents")
        .select("id, title, doc_type, folder_id, updated_at, created_at")
        .eq("user_id", context.userId)
        .order("updated_at", { ascending: false }),
      context.supabase
        .from("folders")
        .select("id, name, created_at")
        .eq("user_id", context.userId)
        .order("name", { ascending: true }),
    ]);
    if (documents.error) throw new Error(documents.error.message);
    if (folders.error) throw new Error(folders.error.message);
    return {
      documents: (documents.data ?? []) as DocumentSummary[],
      folders: (folders.data ?? []) as Folder[],
    };
  });

export const getDocument = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("documents")
      .select("id, title, doc_type, folder_id, content, updated_at, created_at")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as DocumentRecord | null;
  });

export const createDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { title?: string; content?: string; docType?: string; folderId?: string | null }) =>
      input,
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("documents")
      .insert({
        user_id: context.userId,
        title: data.title || "Untitled document",
        content: data.content ?? "",
        doc_type: data.docType || "note",
        folder_id: data.folderId ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const updateDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      title?: string;
      content?: string;
      folderId?: string | null;
      docType?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const patch = {
      updated_at: new Date().toISOString(),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.docType !== undefined ? { doc_type: data.docType } : {}),
      ...(data.folderId !== undefined ? { folder_id: data.folderId } : {}),
    };

    const { error } = await context.supabase
      .from("documents")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("documents")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("folders")
      .insert({ user_id: context.userId, name: data.name.slice(0, 80) })
      .select("id, name, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row as Folder;
  });

export const deleteFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("folders")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
