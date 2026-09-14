-- ===========================================================================
-- Supabase SQL Migration: Albums, Favorites & Images for Astro Lens
-- Safe to run in Supabase Dashboard -> SQL Editor
-- ===========================================================================

-- 1. Create the `images` table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.images (
  id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  url TEXT NOT NULL,
  display_url TEXT,
  thumb_url TEXT,
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  size BIGINT DEFAULT 0,
  mime TEXT DEFAULT 'image/jpeg',
  delete_token TEXT,
  uploaded_at BIGINT,
  is_favorite BOOLEAN DEFAULT FALSE,
  albums TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  location JSONB DEFAULT '{}',
  edits JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for images
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own images" ON public.images;
CREATE POLICY "Users can view their own images"
ON public.images FOR SELECT
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own images" ON public.images;
CREATE POLICY "Users can insert their own images"
ON public.images FOR INSERT
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own images" ON public.images;
CREATE POLICY "Users can update their own images"
ON public.images FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own images" ON public.images;
CREATE POLICY "Users can delete their own images"
ON public.images FOR DELETE
USING (auth.uid() = owner_id);

-- Index for fast favorite filtering
CREATE INDEX IF NOT EXISTS idx_images_is_favorite 
ON public.images (is_favorite) 
WHERE is_favorite = TRUE;

CREATE INDEX IF NOT EXISTS idx_images_owner_id 
ON public.images (owner_id);


-- 2. Create the `albums` table for custom user albums
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Enable RLS for albums
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own albums" ON public.albums;
CREATE POLICY "Users can view their own albums"
ON public.albums FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own albums" ON public.albums;
CREATE POLICY "Users can insert their own albums"
ON public.albums FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own albums" ON public.albums;
CREATE POLICY "Users can update their own albums"
ON public.albums FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own albums" ON public.albums;
CREATE POLICY "Users can delete their own albums"
ON public.albums FOR DELETE
USING (auth.uid() = user_id);


-- 3. Junction Table: Album Images (relational link between albums and images)
CREATE TABLE IF NOT EXISTS public.album_images (
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  image_id TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (album_id, image_id)
);

-- Enable RLS for album_images
ALTER TABLE public.album_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage photos in their own albums" ON public.album_images;
CREATE POLICY "Users can manage photos in their own albums"
ON public.album_images FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    WHERE a.id = album_images.album_id AND a.user_id = auth.uid()
  )
);
