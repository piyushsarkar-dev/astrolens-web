# Supabase setup for Astro Lens (profile-based accounts)

## 1. Create the project
1. Go to https://supabase.com/dashboard → New project.
2. Copy **Project URL** and **Publishable key** from
   Project Settings → Data API (or API keys).

## 2. Add credentials locally
Add to `d:\projects\astrolens-web\.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Then restart `npm run dev`.

## 3. Create the `profiles` table
Supabase Dashboard → SQL Editor → run the contents of
`supabase/profiles.sql` in this repo. It creates:

- `public.profiles (id uuid PK → auth.users.id, email, display_name, avatar_url, created_at, updated_at)`
- RLS: users can only select/insert/update their **own** row
- Trigger `on_auth_user_created`: auto-creates a profile row on signup

## 4. Auth settings
- Authentication → Sign In / Up → Enable **Email** provider.
- Authentication → URL Configuration → Site URL = `http://localhost:3000`
- Add Redirect URL: `http://localhost:3000/auth/callback`
- For production add your domain + `/auth/callback`.

## 5. What was built
- `src/lib/supabase/{client,server,proxy}.ts` + `src/proxy.ts` (session refresh)
- `src/components/Auth/AuthProvider.tsx` (global user session)
- `src/components/Auth/UserMenu.tsx` (Log in / Sign up → avatar + logout in header)
- `src/components/Auth/AuthForm.tsx` + `src/app/{login,signup}/page.tsx`
- `src/app/profile/page.tsx` (edit display name → auth metadata + profiles table)
- `src/app/api/profile/route.ts` (server-side current user + profile)
- `src/app/auth/callback/route.ts` (email-confirmation / OAuth code exchange)
