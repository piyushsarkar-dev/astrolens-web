/*
# Add per-user ImgBB API key to profiles

1. Modified Tables
- `profiles`: Added `imgbb_api_key` column (text, nullable) to store each user's personal ImgBB API key.
  This column is encrypted at rest by Supabase and protected by RLS — only the owning user can read or write it.

2. Security
- No changes to existing RLS policies. The profiles table already has owner-only SELECT, INSERT, UPDATE, and DELETE policies.
- The new column inherits these policies automatically — only the authenticated owner can read or update their own key.
- The key is never exposed to the anon role in practice because profiles SELECT is scoped to `authenticated` with `auth.uid() = user_id`.

3. Important Notes
- Existing rows are unaffected — the new column defaults to NULL.
- Users add their own key via the Settings page; uploads fail with a clear message until a key is set.
- Changing the key does not affect previously uploaded images.
*/