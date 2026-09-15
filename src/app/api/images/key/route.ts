import { createClient } from "@/lib/supabase/server";
import { getServerFallbackApiKey } from "@/lib/imgbb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not logged in." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("imgbb_api_key")
      .eq("id", user.id)
      .maybeSingle();

    const userKey =
      (profile?.imgbb_api_key as string | null)?.trim() ||
      getServerFallbackApiKey() ||
      null;

    return NextResponse.json({ key: userKey });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to retrieve upload key.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
