-- Pacer schema: per-user tasks, subjects, categories, settings and profiles.
-- Every table is locked to its owner with row-level security.

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  school text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------- tasks ----------
-- Tasks reference subjects and categories by name, as the app always has.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 300),
  subject text not null,
  category text not null default '',
  due date not null,
  importance text not null default 'medium' check (importance in ('low', 'medium', 'high')),
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  snoozed_until date,
  example boolean not null default false
);
create index tasks_user_id_idx on public.tasks (user_id);

-- ---------- subjects & categories ----------
-- Ids are client-generated text (some are derived from the name), so they are unique per user, not globally.
create table public.subjects (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  name text not null check (char_length(name) between 1 and 40),
  color smallint not null default 1 check (color between 1 and 8),
  position integer not null default 0,
  primary key (user_id, id)
);
create unique index subjects_user_name_idx on public.subjects (user_id, lower(name));

create table public.categories (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  name text not null check (char_length(name) between 1 and 40),
  color smallint not null default 1 check (color between 1 and 8),
  position integer not null default 0,
  primary key (user_id, id)
);
create unique index categories_user_name_idx on public.categories (user_id, lower(name));

-- ---------- user settings ----------
create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  remind_days smallint not null default 3 check (remind_days between 1 and 14),
  prio_mode text not null default 'auto' check (prio_mode in ('auto', 'custom')),
  prio_order uuid[] not null default '{}',
  task_mode text not null default 'auto' check (task_mode in ('auto', 'custom')),
  task_order uuid[] not null default '{}'
);

-- ---------- row-level security ----------
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.subjects enable row level security;
alter table public.categories enable row level security;
alter table public.user_settings enable row level security;

create policy "Own profile: select" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Own profile: insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Own profile: update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare t text;
begin
  foreach t in array array['tasks', 'subjects', 'categories', 'user_settings'] loop
    execute format('create policy "Own rows: select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "Own rows: insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Own rows: update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Own rows: delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- ---------- profile sync from auth metadata ----------
create function public.handle_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, school)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'school', '')
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        school = excluded.school,
        updated_at = now();
  return new;
end;
$$;
revoke execute on function public.handle_user_profile() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_user_profile();

create trigger on_auth_user_metadata_updated
  after update of raw_user_meta_data on auth.users
  for each row
  when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)
  execute function public.handle_user_profile();

-- ---------- realtime ----------
alter publication supabase_realtime add table public.tasks;
