import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/debug/supabase — verifies server can reach the Supabase project.
// Returns { urlHost, keyPrefix, keyLength, health } or an error explanation.
export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  if (!rawUrl || !key) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local. Add them and RESTART `npm run dev`.",
      },
      { status: 500 },
    );
  }

  let host = "(invalid URL)";
  try {
    host = new URL(rawUrl).hostname;
  } catch {
    return NextResponse.json(
      { ok: false, error: `NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${rawUrl}"` },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${rawUrl}/auth/v1/health`);
    const text = await res.text();
    return NextResponse.json({
      ok: res.ok,
      urlHost: host,
      keyPrefix: key.slice(0, 14),
      keyLength: key.length,
      healthStatus: res.status,
      healthBody: text.slice(0, 200),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        urlHost: host,
        keyPrefix: key.slice(0, 14),
        keyLength: key.length,
        error: `Server could not reach ${rawUrl}/auth/v1/health: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 502 },
    );
  }
}
