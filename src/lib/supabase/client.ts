import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env.local file, then RESTART `npm run dev` (env vars only load at startup).",
    );
  }

  try {
    new URL(url);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL looks invalid ("${url}"). It should look like https://abcdefghijklmnopqrst.supabase.co`,
    );
  }

  return createBrowserClient(url, key);
}

export function getSupabaseHost(): string {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    ).hostname;
  } catch {
    return "(invalid URL)";
  }
}
