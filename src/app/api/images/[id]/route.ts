import { NextRequest, NextResponse } from "next/server";
import { getImageById } from "@/lib/imgbb";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const image = await getImageById(id);

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  return NextResponse.json({ data: image });
}
