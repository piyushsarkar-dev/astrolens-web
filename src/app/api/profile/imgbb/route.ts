import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ action: string[] }> };

function publicStatus(key: string | null | undefined) {
  return {
    configured: Boolean(key?.trim()),
    last4: key?.trim() ? key.slice(-4) : null,
  };
}

// GET /api/profile/imgbb — key status ONLY (configured + last 4 chars).
// SECURITY: the full key never leaves the server.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    const { data, error } = await supabase
      .from("profiles")
      .select("imgbb_api_key")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data: publicStatus(data?.imgbb_api_key) });
  } catch (e) {
    const m = e instanceof Error ? e.message : "Failed to load ImgBB key status.";
    return NextResponse.json({ error: m }, { status: 500 });
  }
}

// POST /api/profile/imgbb — save/replace the caller's personal key.
// Body: { apiKey: string }
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

    const body = (await request.json().catch(() => null)) as { apiKey?: string } | null;
    const key = body?.apiKey?.trim();
    if (!key) return NextResponse.json({ error: "API key is required." }, { status: 400 });
    if (!/^[A-Za-z0-9]{20,64}$/.test(key)) {
      return NextResponse.json({ error: "That ImgBB API key doesn't look right — copy it again from https://api.imgbb.com." }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        imgbb_api_key: key,
        updated_at: new Date().toISOString(),
      });
    if (error) {
      if (/imgbb_api_key/i.test(error.message)) {
        return NextResponse.json({ error: "Database is missing the imgbb_api_key column. Run supabase/profiles.sql in SQL Editor, then try again." }, { status: 500 });
      }
      throw error;
    }
    return NextResponse.json({ data: publicStatus(key) });
  } catch (e) {
    const m = e instanceof Error ? e.message : "Failed to save ImgBB key.";
    return NextResponse.json({ error: m }, { status: 500 });
  }
}

// DELETE /api/profile/imgbb — remove the caller's key.
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    const { error } = await supabase
      .from("profiles")
      .update({ imgbb_api_key: null, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) throw error;
    return NextResponse.json({ data: publicStatus(null) });
  } catch (e) {
    const m = e instanceof Error ? e.message : "Failed to remove ImgBB key.";
    return NextResponse.json({ error: m }, { status: 500 });
  }
}

export type { Ctx };