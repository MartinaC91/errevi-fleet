import { createClient } from "@supabase/supabase-js";

function clean(value: string | undefined): string {
  return (value ?? "").trim().replace(/^['\"]|['\"]$/g, "");
}

const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/$/, "");
const publishableKey = clean(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const supabaseConfig = {
  hasUrl: Boolean(url),
  hasKey: Boolean(publishableKey),
  keyPrefix: publishableKey.slice(0, 15),
  keyLength: publishableKey.length,
};

export const supabase =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
