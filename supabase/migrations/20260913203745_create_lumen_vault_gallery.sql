/*
# Create Lumen Vault gallery data model

1. New Tables
- `profiles`: one editable profile row per authenticated user with name, email, and avatar URL.
- `photos`: ImgBB-hosted image metadata owned by a user, including URLs, dimensions, title, description, favorite state, and trash state.
- `albums`: personal collections owned by a user with an optional cover photo.
- `album_photos`: membership links between a user's albums and photos.

2. Security
- Row Level Security is enabled on every table.
- Every operation is restricted to the authenticated owner.
- Album membership is only readable or writable when both the album and photo belong to the same authenticated user.

3. Performance
- Indexes support newest-first gallery loading, favorites, trash, and album membership lookups.

4. Important Notes
- Photo files remain hosted by ImgBB; Supabase stores metadata and references only.
- Owner IDs default to auth.uid() so inserts cannot omit ownership safely.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  imgbb_id text NOT NULL,
  filename text NOT NULL,
  image_url text NOT NULL,
  display_url text NOT NULL,
  thumbnail_url text NOT NULL,
  delete_url text,
  width integer,
  height integer,
  mime_type text,
  file_size bigint,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  is_favorite boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_photo_id uuid REFERENCES public.photos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT albums_name_length CHECK (char_length(name) BETWEEN 1 AND 80)
);

CREATE TABLE IF NOT EXISTS public.album_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (album_id, photo_id)
);

CREATE INDEX IF NOT EXISTS photos_user_created_idx ON public.photos(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS photos_user_favorite_idx ON public.photos(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS photos_user_deleted_idx ON public.photos(user_id, is_deleted);
CREATE INDEX IF NOT EXISTS albums_user_created_idx ON public.albums(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS album_photos_album_idx ON public.album_photos(album_id, created_at DESC);
CREATE INDEX IF NOT EXISTS album_photos_photo_idx ON public.album_photos(photo_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "photos_select_own" ON public.photos;
CREATE POLICY "photos_select_own" ON public.photos FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "photos_insert_own" ON public.photos;
CREATE POLICY "photos_insert_own" ON public.photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "photos_update_own" ON public.photos;
CREATE POLICY "photos_update_own" ON public.photos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "photos_delete_own" ON public.photos;
CREATE POLICY "photos_delete_own" ON public.photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "albums_select_own" ON public.albums;
CREATE POLICY "albums_select_own" ON public.albums FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "albums_insert_own" ON public.albums;
CREATE POLICY "albums_insert_own" ON public.albums FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "albums_update_own" ON public.albums;
CREATE POLICY "albums_update_own" ON public.albums FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "albums_delete_own" ON public.albums;
CREATE POLICY "albums_delete_own" ON public.albums FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "album_photos_select_own" ON public.album_photos;
CREATE POLICY "album_photos_select_own" ON public.album_photos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.albums a JOIN public.photos p ON p.id = album_photos.photo_id WHERE a.id = album_photos.album_id AND a.user_id = auth.uid() AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "album_photos_insert_own" ON public.album_photos;
CREATE POLICY "album_photos_insert_own" ON public.album_photos FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.albums a JOIN public.photos p ON p.id = album_photos.photo_id WHERE a.id = album_photos.album_id AND a.user_id = auth.uid() AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "album_photos_update_own" ON public.album_photos;
CREATE POLICY "album_photos_update_own" ON public.album_photos FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.albums a JOIN public.photos p ON p.id = album_photos.photo_id WHERE a.id = album_photos.album_id AND a.user_id = auth.uid() AND p.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.albums a JOIN public.photos p ON p.id = album_photos.photo_id WHERE a.id = album_photos.album_id AND a.user_id = auth.uid() AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "album_photos_delete_own" ON public.album_photos;
CREATE POLICY "album_photos_delete_own" ON public.album_photos FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.albums a JOIN public.photos p ON p.id = album_photos.photo_id WHERE a.id = album_photos.album_id AND a.user_id = auth.uid() AND p.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS photos_updated_at ON public.photos;
CREATE TRIGGER photos_updated_at BEFORE UPDATE ON public.photos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS albums_updated_at ON public.albums;
CREATE TRIGGER albums_updated_at BEFORE UPDATE ON public.albums FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();