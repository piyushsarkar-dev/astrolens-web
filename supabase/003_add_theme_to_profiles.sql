-- Add theme preferences columns to profiles table
alter table public.profiles add column if not exists theme_preset text default 'default';
alter table public.profiles add column if not exists custom_theme jsonb;
