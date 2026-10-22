// Sends each opted-in student a short summary of their tasks: by push to every device they allowed,
// and by email if a mailbox is connected (Vault secret "pacer_smtp").
// Called four times a day by pg_cron (see migrations/20261022000000_notifications.sql) with an x-cron-secret header.
// Also serves the unsubscribe link in emails: GET ?unsubscribe=<token>.
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC = "BL00YAWpPuVgYyGVyy2Zsy6bfScvbOnXMxaeV77n8d9iygIDwudd4Eg5Ma_6Oj1RdDVT73k-rPJJ8v95QA4tmO8";
const APP_URL = "https://pacer-chi-taupe.vercel.app/";
const TZ = "Asia/Manila";
const GREETING: Record<string, string> = { morning: "Good morning", noon: "Midday check-in", afternoon: "Afternoon check-in", evening: "Evening check-in" };

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

// ---------- ranking (same rules as the app) ----------
const IMP: Record<string, number> = { high: 30, medium: 15, low: 5 };
const urgency = (n: number) => n < 0 ? 60 + Math.min(-n, 10) * 2 : n === 0 ? 50 : n === 1 ? 40 : n <= 3 ? 30 : n <= 7 ? 18 : n <= 14 ? 8 : 2;
const todayIso = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 864e5);
const whenText = (n: number) => n < -1 ? `${-n} days overdue` : n === -1 ? "overdue since yesterday" : n === 0 ? "due today" : n === 1 ? "due tomorrow" : `due in ${n} days`;

type Task = { id: string; user_id: string; project_id: string | null; assignee_id: string | null; name: string; due: string; importance: string; done: boolean };

function summary(slot: string, open: Task[], today: string) {
  const ranked = open.map(t => { const n = daysBetween(today, t.due); return { t, n, score: urgency(n) + (IMP[t.importance] ?? 15) }; })
    .sort((a, b) => b.score - a.score || a.n - b.n || a.t.name.localeCompare(b.t.name));
  const over = ranked.filter(r => r.n < 0).length, dueToday = ranked.filter(r => r.n === 0).length;
  const counts = [over ? `${over} overdue` : "", dueToday ? `${dueToday} due today` : ""].filter(Boolean).join(", ");
  const title = `${GREETING[slot] ?? "Pacer"}: ${counts || `${ranked.length} to do`}`;
  const top = ranked.slice(0, 3).map((r, i) => `${i + 1}. ${r.t.name} (${whenText(r.n)})`);
  return { title, lines: top, more: Math.max(0, ranked.length - top.length) };
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const page = (msg: string) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pacer</title>
<body style="font:16px system-ui;background:#f5f2ec;color:#2b2925;display:grid;place-items:center;min-height:90vh;margin:0;padding:16px">
<p style="max-width:420px;text-align:center">${esc(msg)}<br><br><a href="${APP_URL}" style="color:#4d6b3f">Open Pacer</a></p></body>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Unsubscribe link from an email.
  const token = url.searchParams.get("unsubscribe");
  if (req.method === "GET" && token) {
    if (!/^[0-9a-f-]{36}$/i.test(token)) return page("That unsubscribe link isn’t valid.");
    const { error } = await db.from("notification_prefs").update({ email_on: false, updated_at: new Date().toISOString() }).eq("unsubscribe_token", token);
    return page(error ? "Something went wrong. Try again, or turn email off in Pacer’s Settings." : "You won’t get Pacer reminder emails anymore. You can turn them back on in Settings.");
  }

  const { data: cfg, error: cfgErr } = await db.rpc("reminder_config");
  if (cfgErr || !cfg?.cron_secret) return new Response("Not configured", { status: 500 });
  if (req.headers.get("x-cron-secret") !== cfg.cron_secret) return new Response("Forbidden", { status: 403 });

  const body = await req.json().catch(() => ({}));
  const slot = String(body.slot ?? "morning"), dry = !!body.dry;
  const today = todayIso();

  const { data: prefs } = await db.from("notification_prefs").select("user_id, push_on, email_on, unsubscribe_token").or("push_on.eq.true,email_on.eq.true");
  if (!prefs?.length) return Response.json({ slot, sent: 0, note: "nobody opted in" });
  const ids = prefs.map(p => p.user_id);

  // Each student's open tasks: personal ones plus every task in projects they belong to.
  const { data: members } = await db.from("project_members").select("project_id, user_id").in("user_id", ids);
  const projectIds = [...new Set((members ?? []).map(m => m.project_id))];
  const { data: personal } = await db.from("tasks").select("id, user_id, project_id, name, due, importance, done").eq("done", false).is("project_id", null).in("user_id", ids);
  const { data: shared } = projectIds.length
    ? await db.from("tasks").select("id, user_id, project_id, assignee_id, name, due, importance, done").eq("done", false).in("project_id", projectIds)
    : { data: [] as Task[] };

  const { data: subs } = await db.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth").in("user_id", ids);
  if (cfg.vapid_private) webpush.setVapidDetails("mailto:noreply@pacer.app", VAPID_PUBLIC, cfg.vapid_private);
  let smtp: { host: string; user: string; pass: string; from?: string } | null = null;
  try { smtp = cfg.smtp ? JSON.parse(cfg.smtp) : null; } catch { smtp = null; }
  // The mail library only loads when a mailbox is connected, so push never depends on it.
  const mailer = smtp ? (await import("npm:nodemailer@6.9.16")).default.createTransport({ host: smtp.host, port: 465, secure: true, auth: { user: smtp.user, pass: smtp.pass } }) : null;

  const result = { slot, today, users: 0, pushes: 0, emails: 0, removedDevices: 0, failed: 0, preview: [] as unknown[] };
  for (const p of prefs) {
    const mine = new Set((members ?? []).filter(m => m.user_id === p.user_id).map(m => m.project_id));
    // Project tasks a groupmate has taken on aren't this student's to do.
    const open = [...(personal ?? []).filter(t => t.user_id === p.user_id), ...(shared ?? []).filter(t => mine.has(t.project_id!) && (!t.assignee_id || t.assignee_id === p.user_id))] as Task[];
    if (!open.length) continue; // nothing to nag about
    const s = summary(slot, open, today);
    result.users++;
    if (dry) { result.preview.push({ user: p.user_id, ...s }); continue; }

    if (p.push_on && cfg.vapid_private) {
      const payload = JSON.stringify({ title: s.title, body: s.lines.join("\n") + (s.more ? `\n+${s.more} more` : ""), url: APP_URL + "#tasks", tag: "pacer-" + slot });
      for (const sub of (subs ?? []).filter(x => x.user_id === p.user_id)) {
        try { await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 4 * 3600 }); result.pushes++; }
        catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          // The browser dropped this subscription: forget the device.
          if (code === 404 || code === 410) { await db.from("push_subscriptions").delete().eq("id", sub.id); result.removedDevices++; }
          else result.failed++;
        }
      }
    }

    if (p.email_on && mailer) {
      const { data: u } = await db.auth.admin.getUserById(p.user_id);
      const to = u?.user?.email; if (!to) continue;
      const unsub = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-reminders?unsubscribe=${p.unsubscribe_token}`;
      const text = `${s.title}\n\n${s.lines.join("\n")}${s.more ? `\n+${s.more} more` : ""}\n\nOpen Pacer: ${APP_URL}\nStop these emails: ${unsub}\n`;
      const html = `<div style="font:15px/1.55 system-ui,sans-serif;color:#2b2925;max-width:520px">
        <h2 style="font:500 22px Georgia,serif;margin:0 0 12px">${esc(s.title)}</h2>
        <ol style="padding-left:20px;margin:0 0 12px">${s.lines.map(l => `<li>${esc(l.replace(/^\d+\.\s/, ""))}</li>`).join("")}</ol>
        ${s.more ? `<p style="color:#625c53;margin:0 0 12px">+${s.more} more</p>` : ""}
        <p><a href="${APP_URL}#tasks" style="color:#4d6b3f">Open Pacer</a></p>
        <p style="font-size:12px;color:#736c62">You get this because email reminders are on in Pacer. <a href="${unsub}" style="color:#736c62">Unsubscribe</a></p></div>`;
      try {
        await mailer.sendMail({ from: smtp!.from || smtp!.user, to, subject: s.title, text, html, headers: { "List-Unsubscribe": `<${unsub}>` } });
        result.emails++;
      } catch { result.failed++; }
    }
  }
  return Response.json(result);
});
