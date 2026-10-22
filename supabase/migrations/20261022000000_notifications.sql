-- Daily task notifications: push (Web Push, no outside service) and, once a mailbox is connected, email.
-- Four sends a day, Philippine time (UTC+8): 7:00 am, 12:00 noon, 4:00 pm, 8:00 pm.
-- Needs 20261021000000_projects_and_sharing.sql first (it reads tasks.status and tasks.project_id).
--
-- Secrets live in Vault, never in this file. Before the first run, add them once with SQL (not saved to git):
--   select vault.create_secret('<random string>', 'pacer_cron_secret');
--   select vault.create_secret('<VAPID private key>', 'pacer_vapid_private');
--   optional, for email over SMTP (port 465):
--   select vault.create_secret('{"host":"smtp.gmail.com","user":"...","pass":"<app password>","from":"Pacer <...>"}', 'pacer_smtp');

-- ---------- who wants what ----------
create table public.notification_prefs (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  push_on boolean not null default false,
  email_on boolean not null default false,
  -- Lets an email's unsubscribe link work without signing in.
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  updated_at timestamptz not null default now()
);

-- One row per browser or phone that allowed notifications.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.notification_prefs enable row level security;
alter table public.push_subscriptions enable row level security;
create policy "Own prefs: select" on public.notification_prefs for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own prefs: insert" on public.notification_prefs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own prefs: update" on public.notification_prefs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- People can switch their own options; the unsubscribe token is only for the server.
revoke update on public.notification_prefs from anon, authenticated;
grant update (user_id, push_on, email_on, updated_at) on public.notification_prefs to authenticated;
create policy "Own devices: select" on public.push_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own devices: insert" on public.push_subscriptions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own devices: delete" on public.push_subscriptions for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------- config for the send-reminders Edge Function ----------
-- Only the server (service role) can read the secrets; the function checks the cron secret with it.
create function public.reminder_config()
returns jsonb language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'cron_secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pacer_cron_secret'),
    'vapid_private', (select decrypted_secret from vault.decrypted_secrets where name = 'pacer_vapid_private'),
    'smtp', (select decrypted_secret from vault.decrypted_secrets where name = 'pacer_smtp'))
$$;
revoke execute on function public.reminder_config() from public, anon, authenticated;
grant execute on function public.reminder_config() to service_role;

-- ---------- the schedule ----------
create extension if not exists pg_cron;
create extension if not exists pg_net;

create function private.send_reminders(slot text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://rikvhwqwcoxrbzyakywy.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pacer_cron_secret')),
    body := jsonb_build_object('slot', slot),
    timeout_milliseconds := 30000);
end;
$$;
revoke execute on function private.send_reminders(text) from public, anon, authenticated;

-- Cron runs on UTC. Philippine time is UTC+8.
select cron.schedule('pacer-morning',   '0 23 * * *', $$select private.send_reminders('morning')$$);   -- 7:00 am
select cron.schedule('pacer-noon',      '0 4 * * *',  $$select private.send_reminders('noon')$$);      -- 12:00 noon
select cron.schedule('pacer-afternoon', '0 8 * * *',  $$select private.send_reminders('afternoon')$$); -- 4:00 pm
select cron.schedule('pacer-evening',   '0 12 * * *', $$select private.send_reminders('evening')$$);   -- 8:00 pm
