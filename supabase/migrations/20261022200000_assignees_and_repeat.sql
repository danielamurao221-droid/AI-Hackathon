-- Who's doing what in a shared project, and repeating tasks.

-- The groupmate a project task is assigned to (null = anyone in the group). Personal tasks leave it empty.
alter table public.tasks add column assignee_id uuid references auth.users (id) on delete set null;
create index tasks_assignee_id_idx on public.tasks (assignee_id) where assignee_id is not null;

-- How a task repeats. When one is ticked off, the app creates the next one.
alter table public.tasks add column repeat text not null default ''
  check (repeat in ('', 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly'));

-- Someone who leaves (or is removed from) a project shouldn't keep tasks in it: hand them back to the group.
create function private.unassign_on_leave()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.tasks set assignee_id = null where project_id = old.project_id and assignee_id = old.user_id;
  return old;
end;
$$;
revoke execute on function private.unassign_on_leave() from public, anon, authenticated;
create trigger project_members_unassign after delete on public.project_members
  for each row execute function private.unassign_on_leave();
