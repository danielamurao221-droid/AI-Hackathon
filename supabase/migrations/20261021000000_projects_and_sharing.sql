-- Subjects → projects → tasks, shared projects (invite links), Kanban status.
--
-- Sharing model:
--   * projects: shared by every member (name, due date, done).
--   * project_members: one row per person in a project. Each member files the project under their OWN subject
--     (or none) in project_members.subject, so groupmates don't need to share a subject.
--   * tasks.project_id: a task inside a project is visible to and editable by every member.
--   * Joining happens only through join_project(invite_token); creating only through create_project().

-- ---------- helpers used by policies (kept out of the API schema) ----------
create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------- tasks: Kanban status, optional subject ----------
-- Existing rows aren't rewritten: tasks already ticked off keep status 'todo', and the app treats done = true as Done.
alter table public.tasks add column status text not null default 'todo' check (status in ('todo', 'doing', 'done'));
alter table public.tasks alter column subject set default '';

-- ---------- projects ----------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  due date,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  invite_token uuid not null default gen_random_uuid() unique
);
create index projects_owner_id_idx on public.projects (owner_id);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  subject text not null default '' check (char_length(subject) <= 40),
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index project_members_user_id_idx on public.project_members (user_id);

alter table public.tasks add column project_id uuid references public.projects (id) on delete cascade;
create index tasks_project_id_idx on public.tasks (project_id) where project_id is not null;

create function private.is_project_member(pid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.project_members where project_id = pid and user_id = (select auth.uid())) $$;

create function private.is_project_owner(pid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.projects where id = pid and owner_id = (select auth.uid())) $$;

create function private.shares_project_with(other uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.project_members a join public.project_members b on a.project_id = b.project_id
  where a.user_id = (select auth.uid()) and b.user_id = other) $$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- ---------- row-level security ----------
alter table public.projects enable row level security;
alter table public.project_members enable row level security;

create policy "Members: select" on public.projects for select to authenticated using (private.is_project_member(id));
create policy "Members: update" on public.projects for update to authenticated using (private.is_project_member(id)) with check (private.is_project_member(id));
create policy "Owner: delete" on public.projects for delete to authenticated using ((select auth.uid()) = owner_id);
-- Members may only change the shared fields; owner and invite token are changed through functions.
revoke insert, update on public.projects from anon, authenticated;
grant update (name, due, done, done_at) on public.projects to authenticated;

create policy "Members: select" on public.project_members for select to authenticated using (private.is_project_member(project_id));
create policy "Self: update" on public.project_members for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Leave, or owner removes" on public.project_members for delete to authenticated using (
  ((select auth.uid()) = user_id and role <> 'owner') or (private.is_project_owner(project_id) and user_id <> (select auth.uid())));
-- Each member can only re-file the project under their own subject.
revoke insert, update on public.project_members from anon, authenticated;
grant update (subject) on public.project_members to authenticated;

-- Tasks: personal tasks belong to their owner; project tasks belong to every member of the project.
-- The existing policies are changed in place (ALTER POLICY), so nothing is dropped.
alter policy "Own rows: select" on public.tasks using (
  case when project_id is null then (select auth.uid()) = user_id else private.is_project_member(project_id) end);
alter policy "Own rows: insert" on public.tasks with check (
  case when project_id is null then (select auth.uid()) = user_id else private.is_project_member(project_id) end);
alter policy "Own rows: update" on public.tasks
  using (case when project_id is null then (select auth.uid()) = user_id else private.is_project_member(project_id) end)
  with check (case when project_id is null then (select auth.uid()) = user_id else private.is_project_member(project_id) end);
alter policy "Own rows: delete" on public.tasks using (
  case when project_id is null then (select auth.uid()) = user_id else private.is_project_member(project_id) end);
alter policy "Own rows: select" on public.tasks rename to "Owner or project member: select";
alter policy "Own rows: insert" on public.tasks rename to "Owner or project member: insert";
alter policy "Own rows: update" on public.tasks rename to "Owner or project member: update";
alter policy "Own rows: delete" on public.tasks rename to "Owner or project member: delete";

-- Groupmates can see each other's names.
alter policy "Own profile: select" on public.profiles using ((select auth.uid()) = id or private.shares_project_with(id));
alter policy "Own profile: select" on public.profiles rename to "Own or groupmate profile: select";

-- ---------- functions the app calls ----------
create function public.create_project(p_id uuid, p_name text, p_subject text default '', p_due date default null)
returns uuid language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Sign in first.'; end if;
  insert into public.projects (id, owner_id, name, due) values (p_id, (select auth.uid()), p_name, p_due);
  insert into public.project_members (project_id, user_id, role, subject) values (p_id, (select auth.uid()), 'owner', coalesce(p_subject, ''));
  return p_id;
end;
$$;

create function public.join_project(p_token uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare pid uuid;
begin
  if (select auth.uid()) is null then raise exception 'Sign in first.'; end if;
  select id into pid from public.projects where invite_token = p_token;
  if pid is null then raise exception 'This invite link doesn''t work anymore. Ask for a new one.'; end if;
  insert into public.project_members (project_id, user_id, role) values (pid, (select auth.uid()), 'member')
  on conflict (project_id, user_id) do nothing;
  return pid;
end;
$$;

create function public.reset_project_invite(p_id uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare t uuid;
begin
  update public.projects set invite_token = gen_random_uuid()
  where id = p_id and owner_id = (select auth.uid()) returning invite_token into t;
  if t is null then raise exception 'Only the project owner can reset the link.'; end if;
  return t;
end;
$$;

revoke execute on function public.create_project(uuid, text, text, date), public.join_project(uuid), public.reset_project_invite(uuid) from public, anon;
grant execute on function public.create_project(uuid, text, text, date), public.join_project(uuid), public.reset_project_invite(uuid) to authenticated;

-- ---------- realtime ----------
alter publication supabase_realtime add table public.projects, public.project_members;
