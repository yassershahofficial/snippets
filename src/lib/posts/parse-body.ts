import type { Json } from "@/lib/supabase/database.types";
import type { PostBody } from "@/lib/posts/body";

export function parsePostBody(body: Json): PostBody | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const doc = body as { type?: unknown; content?: unknown };
  if (doc.type !== "doc" || !Array.isArray(doc.content)) {
    return null;
  }

  return body as PostBody;
}
