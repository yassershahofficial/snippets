import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

export function createClient() {
  return createBrowserClient<Database, "snippets">(
    process.env.NEXT_PUBLIC_SNIPPETS_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SNIPPETS_SUPABASE_PUBLISHABLE_KEY!,
    {
      db: { schema: "snippets" },
    },
  );
}
