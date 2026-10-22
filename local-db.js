// Local database for building Pacer on localhost without touching the live Supabase project.
// It stands in for the small part of supabase-js that app.js uses, and keeps everything in this browser's localStorage.
// On localhost it is on by default; open ?db=remote to use the real Supabase project, ?db=local to come back.
// On any other host (the deployed site) this file does nothing.
(function(){
  const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];
  const q = new URLSearchParams(location.search), pick = q.get('db');
  try { if (pick === 'local' || pick === 'remote') localStorage.setItem('pacer.db', pick); } catch(e) {}
  let choice = 'local'; try { choice = localStorage.getItem('pacer.db') || 'local'; } catch(e) {}
  if (!LOCAL_HOSTS.includes(location.hostname) || choice !== 'local') return;

  const KEY = 'pacer.localdb.v1', SESSION = 'pacer.localdb.session.v1';
  const TABLES = ['users', 'profiles', 'tasks', 'subjects', 'categories', 'user_settings', 'projects', 'project_members'];
  const load = () => { let d = null; try { d = JSON.parse(localStorage.getItem(KEY)); } catch(e) {} d = d || {}; TABLES.forEach(t => { d[t] = d[t] || []; }); return d; };
  const db = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch(e) { console.error('Pacer local db: could not save', e); } };
  const now = () => new Date().toISOString();
  const uuid = () => crypto.randomUUID();
  const ok = data => ({data, error:null}), fail = message => ({data:null, error:{message}});

  // ---------- auth ----------
  let session = null; try { session = JSON.parse(localStorage.getItem(SESSION)); } catch(e) {}
  const listeners = new Set();
  const me = () => session && session.user.id;
  const publicUser = u => ({id:u.id, email:u.email, created_at:u.created_at, user_metadata:{...u.user_metadata}});
  function setSession(u, evt){
    session = u ? {access_token:'local', token_type:'bearer', user:publicUser(u)} : null;
    try { if (session) localStorage.setItem(SESSION, JSON.stringify(session)); else localStorage.removeItem(SESSION); } catch(e) {}
    listeners.forEach(fn => { try { fn(evt, session); } catch(e) { console.error(e); } });
  }
  // Passwords are only ever compared locally; store a hash rather than the password itself.
  async function hashPw(email, pw){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email + '\n' + pw));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function upsertProfile(u){
    const p = {id:u.id, full_name:(u.user_metadata && u.user_metadata.full_name) || '', school:(u.user_metadata && u.user_metadata.school) || ''};
    const i = db.profiles.findIndex(x => x.id === u.id); if (i < 0) db.profiles.push(p); else db.profiles[i] = p;
  }
  const auth = {
    async getSession(){ return ok({session}); },
    onAuthStateChange(fn){ listeners.add(fn); setTimeout(() => fn('INITIAL_SESSION', session), 0); return {data:{subscription:{unsubscribe(){ listeners.delete(fn); }}}}; },
    async signUp({email, password, options}){
      email = (email || '').trim().toLowerCase();
      if (db.users.some(u => u.email === email)) return {data:{user:null, session:null}, error:{message:'User already registered'}};
      const u = {id:uuid(), email, created_at:now(), user_metadata:(options && options.data) || {}, pw: await hashPw(email, password)};
      db.users.push(u); upsertProfile(u); save();
      setSession(u, 'SIGNED_IN');
      return ok({user:publicUser(u), session});
    },
    async signInWithPassword({email, password}){
      email = (email || '').trim().toLowerCase();
      const u = db.users.find(x => x.email === email);
      if (!u || u.pw !== await hashPw(email, password)) return {data:{user:null, session:null}, error:{message:'Invalid login credentials'}};
      setSession(u, 'SIGNED_IN');
      return ok({user:publicUser(u), session});
    },
    async signOut(){ setSession(null, 'SIGNED_OUT'); return {error:null}; },
    async resetPasswordForEmail(){ return fail('Password reset emails aren’t available in local mode. Create another local account instead.'); },
    async updateUser({email, password, data}){
      const u = db.users.find(x => x.id === me()); if (!u) return fail('Your session has ended. Sign in again.');
      if (email && email.trim().toLowerCase() !== u.email) {
        const ne = email.trim().toLowerCase();
        if (db.users.some(x => x.email === ne)) return fail('Another account already uses that email.');
        u.email = ne;
      }
      if (password) u.pw = await hashPw(u.email, password);
      if (data) u.user_metadata = {...u.user_metadata, ...data};
      upsertProfile(u); save();
      setSession(u, 'USER_UPDATED');
      return ok({user:publicUser(u)});
    },
  };

  // ---------- row visibility (mirrors the Supabase row-level security) ----------
  const isMember = pid => db.project_members.some(m => m.project_id === pid && m.user_id === me());
  const visible = {
    tasks: r => r.project_id ? isMember(r.project_id) : r.user_id === me(),
    subjects: r => r.user_id === me(), categories: r => r.user_id === me(), user_settings: r => r.user_id === me(),
    projects: r => isMember(r.id),
    project_members: r => isMember(r.project_id),
    profiles: r => r.id === me() || db.project_members.some(a => a.user_id === me() && db.project_members.some(b => b.project_id === a.project_id && b.user_id === r.id)),
  };
  const keys = {tasks:['id'], subjects:['user_id','id'], categories:['user_id','id'], user_settings:['user_id'], projects:['id'], project_members:['project_id','user_id'], profiles:['id']};
  const defaults = {
    tasks: () => ({user_id:me(), project_id:null, subject:'', category:'', status:'todo', done:false, done_at:null, created_at:now(), snoozed_until:null, example:false, notes:'', assignee_id:null, repeat:''}),
    subjects: () => ({user_id:me(), position:0}), categories: () => ({user_id:me(), position:0}),
    user_settings: () => ({user_id:me(), remind_days:3, prio_mode:'auto', prio_order:[], task_mode:'auto', task_order:[], snoozes:{}}),
  };
  function cascadeProject(pid){
    db.project_members = db.project_members.filter(m => m.project_id !== pid);
    db.tasks = db.tasks.filter(t => t.project_id !== pid);
  }

  function from(table){
    const st = {action:'select', filters:[], order:null, single:false, limit:null, payload:null};
    const see = visible[table] || (() => true);
    const match = r => see(r) && st.filters.every(([c, op, v]) => op === 'eq' ? String(r[c]) === String(v) : v.map(String).includes(String(r[c])));
    function run(){
      if (!me()) return fail('Not signed in');
      const rows = db[table]; if (!rows) return fail('Unknown table ' + table);
      if (st.action === 'select') {
        let out = rows.filter(match).map(r => ({...r}));
        if (st.order) out.sort((a, b) => (a[st.order] > b[st.order]) - (a[st.order] < b[st.order]));
        if (st.limit != null) out = out.slice(0, st.limit);
        return ok(st.single ? (out[0] || null) : out);
      }
      if (st.action === 'delete') {
        const gone = rows.filter(match);
        if (table === 'projects') gone.forEach(p => { if (p.owner_id === me()) cascadeProject(p.id); });
        // Like the database trigger: someone who leaves a project no longer has tasks assigned in it.
        if (table === 'project_members') gone.forEach(m => db.tasks.forEach(t => { if (t.project_id === m.project_id && t.assignee_id === m.user_id) t.assignee_id = null; }));
        db[table] = db[table].filter(r => !(match(r) && (table !== 'projects' || r.owner_id === me())));
        save(); return ok(null);
      }
      if (st.action === 'update') { rows.filter(match).forEach(r => Object.assign(r, st.payload)); save(); return ok(null); }
      if (st.action === 'upsert') {
        const k = keys[table] || ['id'];
        for (const p of [].concat(st.payload)) {
          const row = {...(defaults[table] ? defaults[table]() : {}), ...p};
          const i = rows.findIndex(r => k.every(c => String(r[c]) === String(row[c])));
          if (i < 0) rows.push(row);
          else if (see(rows[i])) rows[i] = {...rows[i], ...p};
          else return fail('new row violates row-level security policy');
        }
        save(); return ok(null);
      }
    }
    const chain = {
      select(){ return chain; },
      order(c){ st.order = c; return chain; },
      limit(n){ st.limit = n; return chain; },
      maybeSingle(){ st.single = true; return chain; },
      eq(c, v){ st.filters.push([c, 'eq', v]); return chain; },
      in(c, v){ st.filters.push([c, 'in', v]); return chain; },
      upsert(p){ st.action = 'upsert'; st.payload = p; return chain; },
      update(p){ st.action = 'update'; st.payload = p; return chain; },
      delete(){ st.action = 'delete'; return chain; },
      then(a, b){ return Promise.resolve().then(run).then(a, b); },
    };
    return chain;
  }

  // ---------- the database functions app.js calls ----------
  async function rpc(name, args){
    if (!me()) return fail('Sign in first.');
    if (name === 'create_project') {
      db.projects.push({id:args.p_id, owner_id:me(), name:args.p_name, due:args.p_due || null, done:false, done_at:null, created_at:now(), invite_token:uuid()});
      db.project_members.push({project_id:args.p_id, user_id:me(), role:'owner', subject:args.p_subject || '', joined_at:now()});
      save(); return ok(args.p_id);
    }
    if (name === 'join_project') {
      const p = db.projects.find(x => x.invite_token === args.p_token);
      if (!p) return fail('This invite link doesn’t work anymore. Ask for a new one.');
      if (!isMember(p.id)) db.project_members.push({project_id:p.id, user_id:me(), role:'member', subject:'', joined_at:now()});
      save(); return ok(p.id);
    }
    if (name === 'reset_project_invite') {
      const p = db.projects.find(x => x.id === args.p_id && x.owner_id === me());
      if (!p) return fail('Only the project owner can reset the link.');
      p.invite_token = uuid(); save(); return ok(p.invite_token);
    }
    return fail('Unknown function ' + name);
  }

  const client = {
    auth, from, rpc,
    channel(){ const c = {on: () => c, subscribe: () => c}; return c; },
    removeChannel(){},
  };
  window.supabase = {createClient: () => client, __local: true};

  // A small note so it's always clear which database you're looking at.
  addEventListener('DOMContentLoaded', () => {
    const el = document.createElement('div');
    el.className = 'local-badge';
    el.innerHTML = 'Local database: saved in this browser only · <a href="?db=remote">Use Supabase</a>';
    document.body.appendChild(el);
  });
})();
