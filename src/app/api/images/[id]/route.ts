import { NextRequest, NextResponse } from "next/server";
import { deleteImageFromImgbb, getImageById, removeImage } from "@/lib/imgbb";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first.", status: 401 as const };
  // The personal key is only used as a fallback delete attempt; absence of a
  // key must NOT block deleting an existing photo.
  const { data: profile } = await supabase
    .from("profiles")
    .select("imgbb_api_key")
    .eq("id", user.id)
    .maybeSingle();
  const key = (profile?.imgbb_api_key as string | null)?.trim() || undefined;
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

// DELETE /api/images/[id] — deletes the photo from ImgBB AND removes it from
// the local registry. Owner-scoped (you can only delete your own photos).
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const auth = await requireUser(supabase);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const image = await getImageById(id, auth.user.id);
    if (!image) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    // 1) Delete from ImgBB itself (via its self-authorizing delete_url).
    let imgbbDeleted = false;
    let warning: string | undefined;
    if (image.deleteToken) {
      try {
        await deleteImageFromImgbb(image.deleteToken, image.id, auth.key);
        imgbbDeleted = true;
      } catch (err) {
        // Don't leave the photo stuck in the gallery if ImgBB refuses.
        warning =
          err instanceof Error
            ? `Removed from your gallery, but ImgBB said: ${err.message}`
            : "Removed from your gallery, but ImgBB could not delete it.";
      }
    } else {
      warning =
        "Removed from your gallery. This old photo has no ImgBB delete link, so it may still exist on ImgBB.";
    }

    // 2) Always remove the record from the local registry.
    await removeImage(id, auth.user.id);

    return NextResponse.json({
      data: { id: image.id, deleted: true, imgbbDeleted },
      warning,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
