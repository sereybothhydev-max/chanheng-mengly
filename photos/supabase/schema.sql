-- ═════════════════════════════════════════════════════════════════════════════
--  Wedding Photo Sharing — Supabase setup
--  Paste this whole file into Supabase → SQL Editor → "New query" → Run.
--  It is safe to run more than once.
-- ═════════════════════════════════════════════════════════════════════════════


-- ─── 1. The `media` table: one row per uploaded photo / video ────────────────
create table if not exists public.media (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  storage_path  text not null unique,           -- e.g. uploads/<uuid>.jpg
  thumb_path    text,                            -- e.g. thumbs/<uuid>.jpg (small preview, optional)
  media_type    text not null check (media_type in ('image', 'video')),
  mime_type     text not null,
  size_bytes    bigint not null check (size_bytes > 0),
  guest_name    text check (char_length(guest_name) <= 60),
  message       text check (char_length(message) <= 280)
);

create index if not exists media_created_at_idx on public.media (created_at desc);


-- ─── 2. Row Level Security (RLS) ─────────────────────────────────────────────
-- Guests (the public "anon" role) may READ the gallery, nothing else.
-- Inserts and deletes happen only on our server using the secret key,
-- which bypasses RLS. That's what keeps random visitors from deleting photos
-- or inserting junk rows directly through the public API.
alter table public.media enable row level security;

drop policy if exists "Anyone can view the gallery" on public.media;
create policy "Anyone can view the gallery"
  on public.media
  for select
  to anon, authenticated
  using (true);

-- (Deliberately NO insert / update / delete policies for anon.)


-- ─── 3. Realtime: push new / deleted rows to every open browser ──────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'media'
  ) then
    alter publication supabase_realtime add table public.media;
  end if;
end $$;


-- ─── 4. Storage bucket ───────────────────────────────────────────────────────
-- Public bucket = anyone with a file's URL can VIEW it (needed for the gallery).
-- Supabase itself enforces the size limit and allowed file types on every
-- upload, so even a hand-crafted request can't sneak in a 2 GB .exe.
--
-- 52428800 bytes = 50 MB (the per-file maximum on Supabase's Free plan).
-- On the Pro plan you can raise this (and UPLOAD_LIMITS in src/lib/config.ts).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wedding-media',
  'wedding-media',
  true,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- ─── 5. Storage policies ─────────────────────────────────────────────────────
-- How anonymous uploads work in this app (the secure way):
--   1. The guest's phone asks OUR server (/api/upload/sign) for permission.
--   2. The server validates type + size, then creates a one-time "signed
--      upload URL" for one exact file path, using the secret key.
--   3. The phone uploads the file straight to Supabase with that URL
--      (fast, and it avoids Vercel's 4.5 MB request limit).
-- Signed upload URLs don't need any storage RLS policy, so we add NONE for
-- anon. Guests can't list, overwrite or delete anything in the bucket.
--
-- ── Optional alternative ──
-- If you ever want the browser to upload directly with the public key
-- (no signed URLs), you'd uncomment this policy instead. Not recommended:
-- anyone with your public key could then upload to the bucket.
--
-- create policy "Guests can upload to uploads/ folder"
--   on storage.objects for insert to anon
--   with check (
--     bucket_id = 'wedding-media'
--     and (storage.foldername(name))[1] in ('uploads', 'thumbs')
--   );
