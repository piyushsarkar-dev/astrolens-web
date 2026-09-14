import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/profile — current user's profile.
// SECURITY: imgbb_api_key is NEVER returned to the client.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, avatar_url, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data: { user: { id: user.id, email: user.email }, profile: data } });
  } catch (e) {
    const m = e instanceof Error ? e.message : "Failed to load profile.";
    return NextResponse.json({ error: m }, { status: 500 });
  }
}
