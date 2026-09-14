import { NextResponse } from "next/server";
import { IMGBB_KEY_MISSING_ERROR, IMGBB_LOGIN_REQUIRED_ERROR, syncImages } from "@/lib/imgbb";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: IMGBB_LOGIN_REQUIRED_ERROR }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("imgbb_api_key")
      .eq("id", user.id)
      .maybeSingle();
    const userKey = (profile?.imgbb_api_key as string | null)?.trim() || null;
    if (!userKey) {
      return NextResponse.json({ error: IMGBB_KEY_MISSING_ERROR }, { status: 400 });
    }
    const images = await syncImages(userKey);
    return NextResponse.json({ data: images });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sync with ImgBB failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
