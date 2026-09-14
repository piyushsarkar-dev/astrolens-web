import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component context — ignore.
          }
        },
      },
    },
  );

  // Email-confirmation link (token_hash) OR OAuth/code exchange (Google etc.).
  const oauthError = searchParams.get("error");
  const oauthErrorDesc = searchParams.get("error_description");

  if (oauthError) {
    // Google itself rejected (e.g. access_denied) — pass the reason back.
    const reason = oauthErrorDesc
      ? `Google login failed: ${decodeURIComponent(oauthErrorDesc)}`
      : `Google login failed: ${oauthError}`;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(reason)}`,
    );
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as "signup" | "email" });
    if (!error) {
      return NextResponse.redirect(`${origin}/login?confirmed=1`);
    }
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Google login: make sure a profile row exists with name + avatar.
      const user = data?.user;
      if (user) {
        const meta = user.user_metadata ?? {};
        await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email ?? null,
          display_name:
            (meta.display_name as string | undefined) ??
            (meta.full_name as string | undefined) ??
            (meta.name as string | undefined) ??
            user.email?.split("@")[0] ?? null,
          avatar_url:
            (meta.avatar_url as string | undefined) ??
            (meta.picture as string | undefined) ?? null,
          updated_at: new Date().toISOString(),
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      // Show the REAL Supabase error instead of a generic one.
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(`Google login exchange failed: ${error.message}`)}`,
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Google login failed: no code returned. Check Supabase → Authentication → URL Configuration → Redirect URLs includes http://localhost:3000/auth/callback")}`,
  );
}
