import { NextRequest, NextResponse } from "next/server";
import { deleteImageFromImgbb, getImageById, removeImage } from "@/lib/imgbb";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireUserKey(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first.", status: 401 as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("imgbb_api_key")
    .eq("id", user.id)
    .maybeSingle();
  const key = (profile?.imgbb_api_key as string | null)?.trim() || null;
  if (!key) return { error: "Add your ImgBB API key in Settings first.", status: 400 as const };
  return { user, key };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in to view photos." }, { status: 401 });
  }
  const image = await getImageById(id, user.id);

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  return NextResponse.json({ data: image });
}

// DELETE /api/images/[id] — deletes the photo from ImgBB (using the owner's
// key, server-side) AND removes it from the local registry. Owner-scoped.
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const auth = await requireUserKey(supabase);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const image = await getImageById(id, auth.user.id);
    if (!image) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }
    if (!image.deleteToken) {
      return NextResponse.json(
        { error: "This photo can't be deleted from ImgBB (no delete token). It can only be removed from your gallery view." },
        { status: 400 },
      );
    }

    // 1) Delete from ImgBB itself using the owner's own key (server-side).
    await deleteImageFromImgbb(image.deleteToken, auth.key);
    // 2) Remove the record from the local registry.
    await removeImage(id, auth.user.id);

    return NextResponse.json({ data: { id: image.id, deleted: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
