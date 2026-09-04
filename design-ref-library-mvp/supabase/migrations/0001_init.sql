-- 参考画像ライブラリ: 初期スキーマ
-- Supabase の SQL Editor にそのまま貼り付けて実行してください。

-- ============================================================
-- 1. テーブル
-- ============================================================

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid not null references public.folders(id),
  storage_path text not null,
  thumb_path text not null,
  original_filename text,
  width int,
  height int,
  source_url text,
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.image_tags (
  image_id uuid not null references public.images(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (image_id, tag_id)
);

create index if not exists images_user_folder_idx on public.images (user_id, folder_id);
create index if not exists images_user_created_idx on public.images (user_id, created_at desc);
create index if not exists folders_user_idx on public.folders (user_id, sort_order);
create index if not exists tags_user_idx on public.tags (user_id, name);

-- updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists images_set_updated_at on public.images;
create trigger images_set_updated_at
  before update on public.images
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. RLS（自分専用アプリでも、Storage同様に必ず有効化しておく）
-- ============================================================

alter table public.folders enable row level security;
alter table public.tags enable row level security;
alter table public.images enable row level security;
alter table public.image_tags enable row level security;

create policy "folders: owner all" on public.folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tags: owner all" on public.tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "images: owner all" on public.images
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "image_tags: owner all" on public.image_tags
  for all using (
    exists (select 1 from public.images i where i.id = image_id and i.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.images i where i.id = image_id and i.user_id = auth.uid())
  );

-- ============================================================
-- 3. 新規ユーザー作成時に初期フォルダを自動作成
--    （サインアップ画面は用意しないため、Authでユーザーを1人作成した
--      直後にこのトリガーが走り、フォルダ一式が揃った状態になる）
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  names text[] := array['未分類','FV','見出し','図解','商品紹介','権威付け','ベネフィット','オファー','CTA','背景','装飾','写真表現','レイアウト'];
  n text;
  i int := 0;
begin
  foreach n in array names loop
    insert into public.folders (user_id, name, sort_order) values (new.id, n, i);
    i := i + 1;
  end loop;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 4. Storage バケットとポリシー
--    パスは "{auth.uid()}/{image_id}/original.xxx" 形式に統一し、
--    先頭フォルダ名が自分のuidと一致する場合のみ読み書きを許可する。
-- ============================================================

insert into storage.buckets (id, name, public)
values ('images', 'images', false)
on conflict (id) do nothing;

create policy "images bucket: owner select" on storage.objects
  for select using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "images bucket: owner insert" on storage.objects
  for insert with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "images bucket: owner update" on storage.objects
  for update using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "images bucket: owner delete" on storage.objects
  for delete using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
