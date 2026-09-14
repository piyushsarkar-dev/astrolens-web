-- Astro Lens migration 002: personal ImgBB API key per profile
-- Run this ALONE in Supabase Dashboard → SQL Editor.
-- Your original profiles.sql is already applied, so do NOT re-run it.
-- This file only adds the missing column — safe, no conflict, re-runnable.
alter table public.profiles add column if not exists imgbb_api_key text;
