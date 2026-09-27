import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database, "snippets">(
    process.env.NEXT_PUBLIC_SNIPPETS_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SNIPPETS_SUPABASE_PUBLISHABLE_KEY!,
    {
      db: { schema: "snippets" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component; proxy refreshes sessions.
          }
        },
      },
    },
  );
}
