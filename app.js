(function(){
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const short = s => s.length > 40 ? s.slice(0,40)+'…' : s;
  const plural = (n, w, many) => n + ' ' + (n === 1 ? w : (many || w + 's'));

  // ---------- dates ----------
  const pad = n => String(n).padStart(2,'0');
  const iso = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const parse = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
  const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
  const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  const ymd = d => [d.getFullYear(), d.getMonth(), d.getDate()];
  const daysUntil = s => Math.round((Date.UTC(...ymd(parse(s))) - Date.UTC(...ymd(today()))) / 864e5);
  const fmt = (d, o) => d.toLocaleDateString(undefined, o);
  function weekBounds(){ const t = today(); const dow = (t.getDay()+6)%7; const mon = addDays(t,-dow); return [mon, addDays(mon,6)]; }
  function isoWeek(d){ const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-day); const y0 = new Date(Date.UTC(t.getUTCFullYear(),0,1)); return Math.ceil(((t-y0)/864e5+1)/7); }
  function dueLabel(s){
    const n = daysUntil(s);
    if (n < -1) return {text:'Overdue · '+(-n)+' days', cls:'over'};
    if (n === -1) return {text:'Overdue · yesterday', cls:'over'};
    if (n === 0) return {text:'Due today', cls:'today'};
    if (n === 1) return {text:'Due tomorrow', cls:''};
    if (n < 7) return {text:fmt(parse(s),{weekday:'short', month:'short', day:'numeric'}), cls:''};
    return {text:fmt(parse(s),{month:'short', day:'numeric'}), cls:''};
  }

  // ---------- ranking ----------
  const IMP = {high:30, medium:15, low:5};
  function urgency(n){
    if (n < 0) return 60 + Math.min(-n,10)*2;
    if (n === 0) return 50; if (n === 1) return 40; if (n <= 3) return 30;
    if (n <= 7) return 18; if (n <= 14) return 8; return 2;
  }
  function rank(list){
    return list.filter(t => !t.done).map(t => {
      const n = daysUntil(t.due), score = urgency(n) + (IMP[t.importance]||15);
      let when;
      if (n < -1) when = 'Overdue by '+(-n)+' days'; else if (n === -1) when = 'Overdue by 1 day';
      else if (n === 0) when = 'Due today'; else if (n === 1) when = 'Due tomorrow'; else when = 'Due in '+n+' days';
      const tier = score >= 70 ? ['now','Do now'] : score >= 50 ? ['next','Next up'] : score >= 30 ? ['soon','This week'] : ['later','Later'];
      return {t, n, score, when, tier};
    }).sort((a,b) => b.score - a.score || a.n - b.n || a.t.name.localeCompare(b.t.name));
  }

  // ---------- state ----------
  // Publishable key only: it is safe in the browser because row-level security limits every table to its owner or project members.
  const SUPABASE_URL = 'https://rikvhwqwcoxrbzyakywy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_LJwiTker1KeALruRVXYWZg_4U7K2Dt8';
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {auth:{flowType:'pkce'}});

  let tasks = [], lists = null, mode = 'loading';
  // Projects are shared. `members` has one row per person per project, including that person's own subject for it.
  let projects = [], members = [], names = {}, currentProject = null;
  // False until the projects migration (supabase/migrations/20261021000000_projects_and_sharing.sql) is applied.
  // Without it, tasks still load and save, but projects, sharing and the Doing status are off.
  let v2 = true;
  let doneOpen = {tasks:false, subject:false, project:false}, tablePending = false, picking = null, confirming = null, itemsPending = false;
  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} };
  const LAYOUT = 'pacer.layout.v1';
  let layout = lsGet(LAYOUT) === 'board' ? 'board' : 'list';
  const uid = () => crypto.randomUUID();
  const hash = s => { let h = 0; for (const c of s.toLowerCase()) h = (h*31 + c.charCodeAt(0)) >>> 0; return h; };
  const hashColor = s => hash(s) % 8 + 1;
  const DEFAULT_CATS = ['Assignment','Reading','Exam prep'];
  const FIELD = {subjects:'subject', categories:'category'};
  const COLS = [['todo','Not started'],['doing','In progress'],['done','Done']];
  const statusOf = t => t.done ? 'done' : t.status === 'doing' ? 'doing' : 'todo';
  const cols = () => v2 ? COLS : COLS.filter(c => c[0] !== 'doing');

  // ---------- projects ----------
  const myId = () => session ? session.user.id : null;
  const projOf = id => projects.find(p => p.id === id);
  const membersOf = pid => members.filter(m => m.projectId === pid);
  const myMembership = pid => members.find(m => m.projectId === pid && m.userId === myId());
  const projSubject = pid => { const m = myMembership(pid); return m ? m.subject : ''; };
  // A project task takes its subject from how *this* student filed the project; groupmates can file it differently.
  const subjOf = t => t.projectId ? projSubject(t.projectId) : (t.subject || '');
  const isOwner = p => !!p && p.ownerId === myId();
  const nameOf = id => id === myId() ? displayName(session.user) : (names[id] || 'A groupmate');

  // Stored list, plus any name still in use (by a task, or as your subject for a project) but missing from it.
  function listOf(kind){
    const base = lists && Array.isArray(lists[kind]) ? lists[kind]
      : kind === 'categories' ? DEFAULT_CATS.map(n => ({id:'d-'+hash(n), name:n, color:hashColor(n)})) : [];
    const seen = new Set(base.map(x => x.name.toLowerCase())), out = base.map(x => ({...x}));
    const add = n => { if (n && !seen.has(n.toLowerCase())) { seen.add(n.toLowerCase()); out.push({id:'d-'+hash(n), name:n, color:hashColor(n)}); } };
    if (kind === 'subjects') { tasks.forEach(t => add(subjOf(t))); members.forEach(m => { if (m.userId === myId()) add(m.subject); }); }
    else tasks.forEach(t => add(t.category));
    return out;
  }
  function colorOf(kind, name){
    if (!name) return 'var(--faint)';
    const it = listOf(kind).find(x => x.name.toLowerCase() === name.toLowerCase());
    return 'var(--c'+(it ? it.color : hashColor(name))+')';
  }
  // What uses a subject or category: your personal tasks (project tasks get their subject from the project) and, for subjects, your projects.
  function usage(kind, name){
    const ts = kind === 'subjects' ? tasks.filter(t => !t.projectId && t.subject === name) : tasks.filter(t => t.category === name);
    const ps = kind === 'subjects' ? projects.filter(p => projSubject(p.id) === name) : [];
    return {tasks:ts, projs:ps, count:ts.length + ps.length};
  }

  function samples(){
    const t = today(), d = n => iso(addDays(t,n));
    return [
      {name:'Problem set 5: integration by parts', subject:'Calculus', category:'Assignment', due:d(-1), importance:'high'},
      {name:'Read chapters 7–8, The Great Gatsby', subject:'English', category:'Reading', due:d(0), importance:'medium', status:'doing'},
      {name:'Lab report: acid–base titration', subject:'Chemistry', category:'Assignment', due:d(2), importance:'high'},
      {name:'Flashcards for unit 3 quiz', subject:'History', category:'Exam prep', due:d(1), importance:'low'},
      {name:'Midterm review sheet', subject:'Calculus', category:'Exam prep', due:d(4), importance:'high'},
      {name:'Discussion post: Federalist No. 10', subject:'History', category:'Assignment', due:d(3), importance:'medium'},
      {name:'Pre-lab questions', subject:'Chemistry', category:'Reading', due:d(5), importance:'low'},
      {name:'Essay draft: symbolism', subject:'English', category:'Assignment', due:d(9), importance:'high'},
      {name:'Vocabulary list 4', subject:'English', category:'Reading', due:d(-3), importance:'low', done:true, status:'done', doneAt:Date.now()},
    ].map(x => ({id:uid(), userId:myId(), projectId:null, done:false, status:'todo', createdAt:Date.now(), example:true, ...x}))
      .map(x => v2 || x.status !== 'doing' ? x : {...x, status:'todo'});
  }

  // ---------- persistence (Supabase) ----------
  function toRow(t){
    const row = {id:t.id, user_id:t.userId || session.user.id, name:t.name,
      subject: t.projectId ? '' : (t.subject || ''), category:t.category || '', due:t.due, importance:t.importance,
      done:!!t.done, done_at: t.doneAt ? new Date(t.doneAt).toISOString() : null,
      created_at: new Date(t.createdAt || Date.now()).toISOString(), example:!!t.example};
    // The old schema has no status or project_id columns.
    if (v2) { row.project_id = t.projectId || null; row.status = statusOf(t); }
    return row;
  }
  const fromRow = r => ({id:r.id, userId:r.user_id, projectId:r.project_id || null, name:r.name, subject:r.subject || '', category:r.category || '',
    due:r.due, importance:r.importance, status:r.status || (r.done ? 'done' : 'todo'), done:r.done,
    doneAt: r.done_at ? Date.parse(r.done_at) : null, createdAt: Date.parse(r.created_at),
    ...(r.example ? {example:true} : {})});
  async function saveTasks(list){
    if (mode !== 'db' || !session || !list.length) return;
    const {error} = await sb.from('tasks').upsert(list.map(toRow));
    if (error) toast('Could not save that change. Check your connection and try again.');
  }
  // Subject/category ids currently in the database, so items removed from the list can be deleted there too.
  let stored = {subjects:new Set(), categories:new Set()}, listsQueue = Promise.resolve();
  function saveLists(next){
    lists = next; render();
    if (mode !== 'db') return Promise.resolve();
    const snap = JSON.parse(JSON.stringify(next));
    // Queued so rapid edits (like several reorders) reach the database in order.
    return listsQueue = listsQueue.then(() => writeLists(snap)).catch(() => toast('Could not save your subjects. Check your connection and try again.'));
  }
  async function writeLists(L){
    if (!session) return;
    const user_id = session.user.id;
    await Promise.all(['subjects','categories'].map(async kind => {
      const items = L[kind] || [], keep = new Set(items.map(x => x.id));
      const gone = [...stored[kind]].filter(id => !keep.has(id));
      if (gone.length) { const {error} = await sb.from(kind).delete().in('id', gone); if (error) throw error; }
      if (items.length) { const {error} = await sb.from(kind).upsert(items.map((x, i) => ({user_id, id:x.id, name:x.name, color:x.color, position:i})), {onConflict:'user_id,id'}); if (error) throw error; }
      stored[kind] = keep;
    }));
    const {error} = await sb.from('user_settings').upsert({user_id, prio_mode: L.prioMode || 'auto', prio_order: L.prioOrder || [],
      task_mode: L.taskMode || 'auto', task_order: L.taskOrder || []});
    if (error) throw error;
  }
  async function remove(id){
    tasks = tasks.filter(t => t.id !== id); render();
    if (mode !== 'db') return;
    const {error} = await sb.from('tasks').delete().eq('id', id);
    if (error) toast('Could not delete that task. Try again.');
  }
  function upsertLocal(t){ const i = tasks.findIndex(x => x.id === t.id); if (i < 0) tasks.push(t); else tasks[i] = t; }
  async function saveMany(list){ list.forEach(upsertLocal); render(); await saveTasks(list); }
  const pref = (k, d) => (lists && lists[k] != null ? lists[k] : d);
  const materialize = () => ({subjects: listOf('subjects'), categories: listOf('categories'),
    prioMode: pref('prioMode','auto'), prioOrder: pref('prioOrder',[]).slice(), taskMode: pref('taskMode','auto'), taskOrder: pref('taskOrder',[]).slice()});

  // ---------- projects: load and save ----------
  const projFromRow = r => ({id:r.id, ownerId:r.owner_id, name:r.name, due:r.due || '', done:r.done, doneAt: r.done_at ? Date.parse(r.done_at) : null,
    createdAt: Date.parse(r.created_at), token:r.invite_token});
  async function loadProjects(){
    const [p, m] = await Promise.all([sb.from('projects').select('*'), sb.from('project_members').select('*')]);
    if (p.error || m.error) throw p.error || m.error;
    projects = p.data.map(projFromRow);
    members = m.data.map(r => ({projectId:r.project_id, userId:r.user_id, role:r.role, subject:r.subject || '', joinedAt:Date.parse(r.joined_at)}));
    const others = [...new Set(members.map(x => x.userId))].filter(id => id !== myId() && !(id in names));
    if (others.length) { const {data} = await sb.from('profiles').select('id,full_name').in('id', others); (data || []).forEach(r => { names[r.id] = r.full_name; }); }
    // Tasks of projects you left, or that were deleted, go away.
    const live = new Set(projects.map(x => x.id));
    tasks = tasks.filter(t => !t.projectId || live.has(t.projectId));
  }
  async function refreshProjects(){
    const before = new Set(projects.map(p => p.id));
    try { await loadProjects(); } catch(e) { return; }
    const added = projects.filter(p => !before.has(p.id)).map(p => p.id);
    if (added.length) { const {data} = await sb.from('tasks').select('*').in('project_id', added); (data || []).forEach(r => upsertLocal(fromRow(r))); }
    render();
  }
  let refreshTimer = null;
  const scheduleRefresh = () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(refreshProjects, 200); };

  async function createProject(name, subject, due){
    const id = uid(), me = myId();
    projects.push({id, ownerId:me, name, due:due || '', done:false, doneAt:null, createdAt:Date.now(), token:null});
    members.push({projectId:id, userId:me, role:'owner', subject, joinedAt:Date.now()});
    render();
    const {error} = await sb.rpc('create_project', {p_id:id, p_name:name, p_subject:subject, p_due:due || null});
    if (error) {
      projects = projects.filter(p => p.id !== id); members = members.filter(m => m.projectId !== id); render();
      toast('Could not create that project. Try again.'); return null;
    }
    toast('Added “'+short(name)+'”');
    refreshProjects(); // picks up the invite link
    return id;
  }
  async function saveProject(p){
    const i = projects.findIndex(x => x.id === p.id); if (i < 0) return;
    projects[i] = p; render();
    const {error} = await sb.from('projects').update({name:p.name, due:p.due || null, done:p.done, done_at: p.doneAt ? new Date(p.doneAt).toISOString() : null}).eq('id', p.id);
    if (error) toast('Could not save the project. Try again.');
  }
  function toggleProject(id){
    const p = projOf(id); if (!p) return;
    const done = !p.done;
    saveProject({...p, done, doneAt: done ? Date.now() : null});
    if (done) toast('Marked “'+short(p.name)+'” as done');
  }
  async function setProjectSubject(pid, subject){
    const m = myMembership(pid); if (!m || m.subject === subject) return;
    m.subject = subject; render();
    const {error} = await sb.from('project_members').update({subject}).eq('project_id', pid).eq('user_id', myId());
    if (error) toast('Could not file the project under that subject. Try again.');
  }
  function dropProjectLocal(pid){
    projects = projects.filter(p => p.id !== pid); members = members.filter(m => m.projectId !== pid); tasks = tasks.filter(t => t.projectId !== pid);
    if (currentProject === pid) go('subjects'); else render();
  }
  async function deleteProject(pid){
    const p = projOf(pid); dropProjectLocal(pid);
    const {error} = await sb.from('projects').delete().eq('id', pid);
    if (error) { toast('Could not delete the project. Try again.'); refreshProjects(); } else if (p) toast('Deleted “'+short(p.name)+'”');
  }
  async function leaveProject(pid){
    const p = projOf(pid); dropProjectLocal(pid);
    const {error} = await sb.from('project_members').delete().eq('project_id', pid).eq('user_id', myId());
    if (error) { toast('Could not leave the project. Try again.'); refreshProjects(); } else if (p) toast('You left “'+short(p.name)+'”');
  }
  async function removeMember(pid, who){
    const name = nameOf(who);
    members = members.filter(m => !(m.projectId === pid && m.userId === who)); render();
    const {error} = await sb.from('project_members').delete().eq('project_id', pid).eq('user_id', who);
    if (error) { toast('Could not remove them. Try again.'); refreshProjects(); } else toast('Removed '+name+' from the project');
  }
  async function resetInvite(pid){
    const {data, error} = await sb.rpc('reset_project_invite', {p_id:pid});
    if (error) return toast(error.message);
    const p = projOf(pid); if (p) p.token = data;
    render(); toast('Made a new invite link. The old one no longer works.');
  }
  const inviteLink = p => p && p.token ? location.origin + location.pathname + '?join=' + p.token : '';
  async function copyInvite(pid){
    const link = inviteLink(projOf(pid));
    if (!link) return toast('The invite link is still loading. Try again in a moment.');
    try { await navigator.clipboard.writeText(link); toast('Invite link copied. Send it to your groupmates.'); }
    catch(e) { const inp = $('#pjLink'); inp.focus(); inp.select(); toast('Press Ctrl+C to copy the link.'); }
  }

  // ---------- joining a shared project from an invite link (?join=token) ----------
  // The token is kept for this tab, so it survives signing in or creating an account first.
  const JOIN = 'pacer.join';
  const pendingJoin = () => { try { return sessionStorage.getItem(JOIN); } catch(e) { return null; } };
  (() => {
    const q = new URLSearchParams(location.search), t = q.get('join'); if (!t) return;
    try { sessionStorage.setItem(JOIN, t); } catch(e) {}
    q.delete('join'); const s = q.toString();
    try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch(e) {}
  })();
  async function processJoin(){
    const t = pendingJoin(); if (!t) return;
    try { sessionStorage.removeItem(JOIN); } catch(e) {}
    if (!v2) return toast('Shared projects aren’t switched on yet, so this invite link can’t be used.');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t)) return toast('That invite link isn’t valid. Ask for a new one.');
    const {data, error} = await sb.rpc('join_project', {p_token:t});
    if (error) return toast(error.message);
    const already = !!projOf(data);
    await refreshProjects();
    const p = projOf(data);
    openProject(data);
    toast(already ? 'You’re already in this project' : p ? 'You joined “'+short(p.name)+'”. File it under one of your subjects if you like.' : 'You joined the project');
  }

  // ---------- priority order (manual override) ----------
  // Ids in the saved order keep their place; anything not in it is slotted in where the automatic ranking would put it.
  function arrange(items, order, cmp, idOf){
    const pos = new Map(order.map((id, i) => [id, i]));
    const out = items.filter(x => pos.has(idOf(x))).sort((a,b) => pos.get(idOf(a)) - pos.get(idOf(b)));
    items.filter(x => !pos.has(idOf(x))).sort(cmp).forEach(x => {
      const i = out.findIndex(o => cmp(x, o) < 0); out.splice(i < 0 ? out.length : i, 0, x);
    });
    return out;
  }
  const cmpRank = (a,b) => b.score - a.score || a.n - b.n || a.t.name.localeCompare(b.t.name);
  const cmpDue = (a,b) => a.due.localeCompare(b.due) || a.name.localeCompare(b.name);
  const cmpDone = (a,b) => (b.doneAt||0) - (a.doneAt||0);
  function prioList(){ const r = rank(tasks); return pref('prioMode','auto') === 'custom' ? arrange(r, pref('prioOrder',[]), cmpRank, x => x.t.id) : r; }
  function commitOrder(kind, ids){
    const L = materialize(), live = new Set(tasks.map(t => t.id));
    L.prioOrder = [...ids, ...L.prioOrder.filter(x => !ids.includes(x) && live.has(x))];
    L.prioMode = 'custom';
    saveLists(L);
  }
  function resetOrder(){ saveLists({...materialize(), prioMode:'auto'}); toast('Back to automatic ranking'); }

  // ---------- task actions ----------
  function toggle(id){
    const t = tasks.find(x => x.id === id); if (!t) return;
    const done = !t.done;
    saveMany([{...t, done, status: done ? 'done' : 'todo', doneAt: done ? Date.now() : null}]);
    if (done) toast('Marked “'+short(t.name)+'” as done');
  }
  function setStatus(id, status){
    const t = tasks.find(x => x.id === id); if (!t || statusOf(t) === status) return render();
    const done = status === 'done';
    saveMany([{...t, status, done, doneAt: done ? (t.doneAt || Date.now()) : null}]);
    toast('Moved “'+short(t.name)+'” to '+COLS.find(c => c[0] === status)[1]);
  }
  async function loadExamples(){ const list = samples(); await saveMany(list); toast('Added '+list.length+' example tasks'); }
  async function clearExamples(){
    const ex = tasks.filter(t => t.example);
    tasks = tasks.filter(t => !t.example); render();
    if (mode === 'db' && ex.length) {
      const {error} = await sb.from('tasks').delete().in('id', ex.map(t => t.id));
      if (error) return toast('Could not remove the examples. Try again.');
    }
    toast('Removed example tasks');
  }

  // ---------- subjects & categories ----------
  const label = k => k === 'subjects' ? 'subject' : 'category';
  function addItem(kind, name, quiet){
    name = name.trim(); if (!name) return false;
    const L = materialize();
    if (L[kind].some(x => x.name.toLowerCase() === name.toLowerCase())) { if (!quiet) toast('“'+short(name)+'” is already in your list'); return false; }
    L[kind].push({id:uid(), name, color:hashColor(name)});
    saveLists(L); return true;
  }
  async function renameItem(kind, id, raw){
    const name = raw.trim(), L = materialize(), it = L[kind].find(x => x.id === id);
    if (!it || name === it.name) return render();
    if (!name) { toast('A '+label(kind)+' needs a name'); return render(); }
    if (L[kind].some(x => x !== it && x.name.toLowerCase() === name.toLowerCase())) { toast('“'+short(name)+'” already exists. Pick a different name.'); return render(); }
    const old = it.name, f = FIELD[kind], {tasks:used, projs} = usage(kind, old); it.name = name;
    const changed = used.map(t => ({...t, [f]:name}));
    changed.forEach(upsertLocal);
    await saveLists(L); await saveMany(changed);
    for (const p of projs) await setProjectSubject(p.id, name);
    const bits = [changed.length ? plural(changed.length, 'task') : '', projs.length ? plural(projs.length, 'project') : ''].filter(Boolean);
    toast('Renamed to “'+short(name)+'”' + (bits.length ? ' and updated '+bits.join(' and ') : ''));
  }
  function setColor(kind, id, c){ const L = materialize(), it = L[kind].find(x => x.id === id); if (!it) return; it.color = c; picking = null; saveLists(L); }
  async function deleteItem(kind, id, action){
    const L = materialize(), it = L[kind].find(x => x.id === id); if (!it) return;
    const f = FIELD[kind], {tasks:used, projs} = usage(kind, it.name);
    L[kind] = L[kind].filter(x => x !== it); confirming = null;
    // Projects are never deleted from here (they may be shared); they just move or lose the subject.
    const to = action === '__clear' || action === '__delete' ? '' : action;
    const moved = used.map(t => ({...t, [f]: to}));
    if (action === '__delete') tasks = tasks.filter(t => !used.includes(t)); else moved.forEach(upsertLocal);
    for (const p of projs) await setProjectSubject(p.id, to);
    await saveLists(L);
    if (action === '__delete') { for (const t of used) await remove(t.id); }
    else if (used.length) await saveMany(moved);
    toast('Deleted “'+short(it.name)+'”');
    if (kind === 'subjects' && currentView() === 'subject' && currentSubject === id) go('tasks');
  }

  // ---------- boot ----------
  let channel = null;
  const toItems = rows => rows.map(r => ({id:r.id, name:r.name, color:r.color}));
  async function boot(){
    const me = session.user.id;
    mode = 'db-wait'; render();
    const [t, s, c, st] = await Promise.all([
      sb.from('tasks').select('*'),
      sb.from('subjects').select('id,name,color').order('position'),
      sb.from('categories').select('id,name,color').order('position'),
      sb.from('user_settings').select('*').maybeSingle(),
    ]);
    // Is the projects migration applied? Checking a column it adds is enough: the migration runs as one unit.
    let projErr = null;
    if (bootedFor === me) {
      const probe = await sb.from('tasks').select('status,project_id').limit(1);
      v2 = !probe.error;
      if (probe.error) console.warn('Pacer: projects migration not applied yet; projects and sharing are off.', probe.error);
      else { try { await loadProjects(); } catch(e) { projErr = e; } }
    }
    if (bootedFor !== me) return; // signed out while loading
    if (t.error || s.error || c.error || st.error || projErr) {
      console.error('Pacer: loading failed', t.error || s.error || c.error || st.error || projErr);
      toast('Could not load your tasks. Retrying…');
      setTimeout(() => { if (bootedFor === me) boot(); }, 5000);
      return;
    }
    tasks = t.data.map(fromRow);
    stored = {subjects:new Set(s.data.map(r => r.id)), categories:new Set(c.data.map(r => r.id))};
    // No saved settings yet means a new account: leave lists null so the default categories apply.
    const r = st.data;
    lists = r || s.data.length || c.data.length ? {subjects: toItems(s.data), categories: toItems(c.data),
      prioMode: r ? r.prio_mode : 'auto', prioOrder: r ? r.prio_order : [],
      taskMode: r ? r.task_mode : 'auto', taskOrder: r ? r.task_order : []} : null;
    mode = 'db'; render();
    // Keep tasks and projects in sync with other tabs, devices and groupmates.
    // Delete events carry only the id, so they aren't filtered; inserts and updates only arrive for rows you can see.
    channel = sb.channel('pacer-' + me)
      .on('postgres_changes', {event:'*', schema:'public', table:'tasks'}, p => {
        if (p.eventType === 'DELETE') tasks = tasks.filter(x => x.id !== p.old.id);
        else { const x = fromRow(p.new); if (x.projectId ? projOf(x.projectId) : x.userId === me) upsertLocal(x); }
        render();
      });
    if (v2) channel
      .on('postgres_changes', {event:'*', schema:'public', table:'projects'}, scheduleRefresh)
      .on('postgres_changes', {event:'*', schema:'public', table:'project_members'}, scheduleRefresh);
    channel.subscribe();
    processJoin();
    loadNotif();
  }
  function teardown(){
    if (channel) { sb.removeChannel(channel); channel = null; }
    bootedFor = null; tasks = []; lists = null; mode = 'loading';
    projects = []; members = []; names = {};
    stored = {subjects:new Set(), categories:new Set()};
    render();
  }


  // ---------- notifications: push to this device and email, sent four times a day by the server ----------
  // The public half of the Web Push key pair; the private half is a Vault secret only the server can read.
  const VAPID_PUBLIC = 'BL00YAWpPuVgYyGVyy2Zsy6bfScvbOnXMxaeV77n8d9iygIDwudd4Eg5Ma_6Oj1RdDVT73k-rPJJ8v95QA4tmO8';
  const isLocalDb = !!window.supabase.__local;
  let notif = {ready:false, available:false, push_on:false, email_on:false, deviceOn:false, busy:false};
  const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const b64ToBytes = s => { const b = atob((s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
  async function loadNotif(){
    notif = {ready:false, available:false, push_on:false, email_on:false, deviceOn:false, busy:false};
    if (!isLocalDb) {
      const {data, error} = await sb.from('notification_prefs').select('push_on,email_on').maybeSingle();
      notif.available = !error; // the table appears with the notifications migration
      if (data) { notif.push_on = data.push_on; notif.email_on = data.email_on; }
      if (notif.available && pushSupported()) {
        try { const reg = await navigator.serviceWorker.getRegistration(), sub = reg && await reg.pushManager.getSubscription();
          notif.deviceOn = !!sub && Notification.permission === 'granted'; } catch(e) {}
      }
    }
    notif.ready = true; renderNotif();
  }
  function renderNotif(){
    const off = $('#notifOff'), body = $('#notifBody');
    const msg = !notif.ready ? 'Loading…' : !notif.available
      ? (isLocalDb ? 'Notifications need the Supabase database, so they’re off while you use the local test database.' : 'Notifications switch on once the database is updated for them.') : '';
    body.hidden = !!msg; off.hidden = !msg; off.textContent = msg;
    if (msg) return;
    const pb = $('#pushBtn'), eb = $('#emailBtn');
    pb.disabled = eb.disabled = notif.busy;
    const denied = pushSupported() && Notification.permission === 'denied';
    pb.hidden = !pushSupported() || denied;
    pb.textContent = notif.deviceOn ? 'Turn off' : 'Turn on';
    $('#pushNote').textContent = !pushSupported() ? 'This browser can’t show notifications. On iPhone, add Pacer to your Home Screen first.'
      : denied ? 'Blocked in your browser settings. Allow notifications for this site, then reload.'
      : notif.deviceOn ? 'On for this device.' : 'Off for this device.';
    eb.textContent = notif.email_on ? 'Turn off' : 'Turn on';
  }
  const savePrefs = () => sb.from('notification_prefs').upsert({user_id:session.user.id, push_on:notif.push_on, email_on:notif.email_on, updated_at:new Date().toISOString()});
  async function togglePush(){
    notif.busy = true; renderNotif();
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      if (notif.deviceOn) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) { await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe(); }
        notif.deviceOn = false;
        const {count} = await sb.from('push_subscriptions').select('id', {count:'exact', head:true});
        notif.push_on = !!count;
        await savePrefs();
        toast('Push notifications off for this device');
      } else {
        if (await Notification.requestPermission() !== 'granted') { toast('Notifications weren’t allowed'); return; }
        await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:b64ToBytes(VAPID_PUBLIC)}), j = sub.toJSON();
        await sb.from('push_subscriptions').delete().eq('endpoint', j.endpoint);
        const ins = await sb.from('push_subscriptions').insert({user_id:session.user.id, endpoint:j.endpoint, p256dh:j.keys.p256dh, auth:j.keys.auth, user_agent:navigator.userAgent.slice(0, 200)});
        if (ins.error) throw ins.error;
        notif.deviceOn = true; notif.push_on = true;
        const r = await savePrefs(); if (r.error) throw r.error;
        toast('Push notifications on. They come at 7 am, noon, 4 pm and 8 pm.');
      }
    } catch(e) { console.error('Pacer: push toggle failed', e); toast('Could not change push notifications. Try again.'); }
    finally { notif.busy = false; renderNotif(); }
  }
  async function toggleEmail(){
    notif.email_on = !notif.email_on; notif.busy = true; renderNotif();
    const {error} = await savePrefs();
    if (error) { notif.email_on = !notif.email_on; toast('Could not change email reminders. Try again.'); }
    else toast(notif.email_on ? 'Email reminders on' : 'Email reminders off');
    notif.busy = false; renderNotif();
  }

  // ---------- rendering ----------
  const checkSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>';
  const binSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
  const gripSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
  const penSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  const folderSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
  const chevSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  const gripBtn = t => '<button class="grip" data-grip="'+t.id+'" title="Drag to reorder, or click for move buttons" aria-expanded="'+!!(mover && mover.id === t.id)+'" aria-label="Reorder '+esc(t.name)+'. Drag, press the up and down arrow keys, or press Enter for move buttons.">'+gripSvg+'</button>';
  // Single-pointer alternative to dragging (WCAG 2.5.7): clicking a handle opens move buttons for that task.
  let mover = null, cardMover = null;
  const moverHtml = (kind, t) => mover && mover.kind === kind && mover.id === t.id
    ? '<div class="mover" role="group" aria-label="Move '+esc(t.name)+'"><span>Move</span><button class="mini" data-move="up">↑ Up</button><button class="mini" data-move="down">↓ Down</button><button class="mini" data-move="top">To top</button><button class="mini" data-move="bottom">To bottom</button><button class="mini solid" data-move="close">Done</button></div>' : '';
  const editBtn = t => '<button class="del edit" data-edit="'+t.id+'" title="Edit" aria-label="Edit '+esc(t.name)+'">'+penSvg+'</button>';
  const subjChip = t => { const s = subjOf(t); return s ? '<span class="chip" style="--c:'+colorOf('subjects', s)+'"><i class="dot"></i>'+esc(s)+'</span>' : ''; };
  const projTag = (t, opts) => { const p = t.projectId && projOf(t.projectId); return p && !(opts && opts.noProject) ? '<button class="ptag" data-open-project="'+p.id+'" title="Open project">'+folderSvg+esc(p.name)+'</button>' : ''; };
  const exampleTag = t => t.example ? '<span class="tag">Example</span>' : '';
  const doingTag = t => !t.done && t.status === 'doing' ? '<span class="doing">In progress</span>' : '';

  // ---------- tasks table: one row per task, every column edited in place ----------
  const IMPS = [['high','High'],['medium','Medium'],['low','Low']];
  const opt = (v, text, on) => '<option value="'+esc(v)+'"'+(on ? ' selected' : '')+'>'+esc(text)+'</option>';
  const impBars = lv => { const n = lv === 'high' ? 3 : lv === 'medium' ? 2 : 1;
    return '<svg class="imp-bars" viewBox="0 0 16 16" aria-hidden="true">'+[[2,10,4],[6.5,7,7],[11,4,10]].map(([x,y,h], i) => '<rect'+(i < n ? ' class="on"' : '')+' x="'+x+'" y="'+y+'" width="3" height="'+h+'" rx="1"/>').join('')+'</svg>'; };
  function shortDue(s){
    const n = daysUntil(s), cls = n < 0 ? 'over' : n === 0 ? 'today' : '';
    const text = n === -1 ? 'Yesterday' : n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : fmt(parse(s), {month:'short', day:'numeric'});
    return {text, cls};
  }
  // r is the ranked entry for an active task (rank, tier), or null for a finished one.
  function ttRowHtml(t, r, i, grip){
    const s = subjOf(t), st = statusOf(t), due = shortDue(t.due), mv = r ? moverHtml('prio', t) : '';
    const lab = what => ' aria-label="'+what+' for '+esc(t.name)+'"';
    const subjCell = t.projectId
      ? '<span class="cell-static" title="Comes from the project. Change it on the project page.">'+(s ? '<i class="dot" style="--c:'+colorOf('subjects', s)+'"></i>'+esc(s) : '—')+'</span>'
      : '<label class="cell'+(s ? '' : ' is-empty')+'"><i class="dot" style="--c:'+colorOf('subjects', s)+'"></i><select data-cell="subject"'+lab('Subject')+'>'
        + opt('', 'No subject', !s) + listOf('subjects').map(x => opt(x.name, x.name, x.name === s)).join('') + opt('__new', '+ New subject…') + '</select></label>';
    const projCell = !v2 ? '<span class="cell-static proj-col">—</span>'
      : '<label class="cell proj-col'+(t.projectId ? '' : ' is-empty')+'">'+folderSvg+'<select data-cell="project"'+lab('Project')+'>' + opt('', 'No project', !t.projectId)
        + projects.filter(p => !p.done || p.id === t.projectId).sort((a,b) => a.name.localeCompare(b.name)).map(p => opt(p.id, p.name, p.id === t.projectId)).join('') + '</select></label>';
    return '<div class="tt-row'+(t.done ? ' is-done' : '')+(r ? ' t-'+r.tier[0] : '')+(mv ? ' has-mover' : '')+'" data-row-id="'+t.id+'" data-task="'+t.id+'">'
      + (r && grip ? gripBtn(t) : '<span></span>')
      + '<button class="check" data-toggle="'+t.id+'" aria-pressed="'+!!t.done+'" aria-label="'+(t.done ? 'Mark not done: ' : 'Mark done: ')+esc(t.name)+'">'+checkSvg+'</button>'
      + '<span class="rank"'+(r ? ' title="'+esc(r.tier[1]+' · '+r.when)+'"' : '')+'>'+(r ? i+1 : '')+'</span>'
      + '<span class="name-cell"><span class="cell-name" data-cell="name" contenteditable="true" role="textbox" spellcheck="false" aria-label="Task name" title="'+esc(t.name)+'">'+esc(t.name)+'</span>'+exampleTag(t)+'</span>'
      // On wide screens the cells below are table columns; on phones they wrap as chips under the name.
      + '<div class="tt-meta">' + subjCell + projCell
      + '<label class="cell st st-'+st+'"><i class="st-dot"></i><select data-cell="status"'+lab('Status')+'>'+cols().map(([k, v]) => opt(k, v, k === st)).join('')+'</select></label>'
      + '<label class="cell imp-cell imp-'+t.importance+'">'+impBars(t.importance)+'<select data-cell="importance"'+lab('Importance')+'>'+IMPS.map(([k, v]) => opt(k, v, k === t.importance)).join('')+'</select></label>'
      + '<label class="cell date-cell"><span class="'+(t.done ? '' : due.cls)+'">'+esc(due.text)+'</span><input type="date" data-cell="due" value="'+t.due+'"'+lab('Due date')+'></label>'
      + '</div>' + editBtn(t) + mv + '</div>';
  }
  // Saves one edited cell. Selects lose focus afterwards so the list can re-sort straight away.
  function editCell(el){
    const row = el.closest('[data-task]'), t = row && tasks.find(x => x.id === row.dataset.task); if (!t) return;
    const f = el.dataset.cell, v = el.isContentEditable ? el.textContent : el.value;
    if (f === 'name') { const name = v.replace(/\s+/g, ' ').trim().slice(0, 140); if (!name) { el.textContent = t.name; return toast('A task needs a name'); } if (name !== t.name) saveMany([{...t, name}]); return; }
    if (f === 'due') { if (!v) { el.value = t.due; return; } if (v !== t.due) saveMany([{...t, due:v}]); return; }
    if (f === 'importance') return saveMany([{...t, importance:v}]);
    if (f === 'status') return setStatus(t.id, v);
    if (f === 'subject') {
      if (v === '__new') { el.value = t.subject || ''; return openQuick('subject', {after: name => { const x = tasks.find(y => y.id === t.id); if (x) saveMany([{...x, subject:name}]); }}); }
      return saveMany([{...t, subject:v}]);
    }
    if (f === 'project') {
      const projectId = v || null, p = projectId && projOf(projectId);
      // Leaving a project keeps the subject it was filed under for you; a personal task must belong to you.
      saveMany([{...t, projectId, subject: projectId ? '' : subjOf(t), userId: projectId ? (t.userId || myId()) : myId()}]);
      toast(p ? 'Moved to “'+short(p.name)+'”' : 'Now a personal task');
    }
  }
  // Board card. Cards are dragged between columns by the handle; clicking the handle opens move buttons instead.
  function cardHtml(t, r){
    const due = dueLabel(t.due), mv = cardMover === t.id;
    return '<div class="kcard'+(t.done?' is-done':'')+(r?' t-'+r.tier[0]:'')+'" data-card-id="'+t.id+'">'
      + '<div class="kcard-top"><button class="grip" data-card-grip="'+t.id+'" title="Drag to another column, or click for move buttons" aria-expanded="'+mv+'" aria-label="Move '+esc(t.name)+' to another column">'+gripSvg+'</button>'
      + '<span class="t-name">'+esc(t.name)+'</span>'+editBtn(t)+'</div>'
      + '<div class="meta">'+subjChip(t)+projTag(t)
      + '<span class="date '+(t.done?'':due.cls)+'">'+esc(t.done ? 'Done' : due.text)+'</span>'
      + (r ? '<span class="tier">'+r.tier[1]+'</span>' : '') + exampleTag(t) + '</div>'
      + (mv ? '<div class="mover" role="group" aria-label="Move '+esc(t.name)+'"><span>Move to</span>'
          + cols().filter(c => c[0] !== statusOf(t)).map(c => '<button class="mini" data-status-move="'+c[0]+'">'+c[1]+'</button>').join('')
          + '<button class="mini solid" data-status-move="close">Close</button></div>' : '')
      + '</div>';
  }
  const DONE_SHOWN = 15;
  function boardHtml(ranked, done){
    const byCol = {todo: ranked.filter(r => r.t.status !== 'doing'), doing: ranked.filter(r => r.t.status === 'doing'), done: done.slice(0, DONE_SHOWN).map(t => ({t}))};
    const empty = {todo:'Nothing waiting. Add a task to get started.', doing:'Drag a task here when you start on it.', done:'Finished tasks land here.'};
    return cols().map(([k, title]) => {
      const n = k === 'done' ? done.length : byCol[k].length;
      return '<div class="col col-'+k+'"><div class="col-head"><h2>'+title+'</h2><span class="col-count">'+n+'</span></div>'
        + '<div class="col-body" data-col-body="'+k+'">'
        + (byCol[k].length ? byCol[k].map(x => cardHtml(x.t, x.score != null ? x : null)).join('') : '<p class="col-empty">'+empty[k]+'</p>')
        + (k === 'done' && done.length > DONE_SHOWN ? '<p class="col-empty">'+(done.length - DONE_SHOWN)+' older in the List view</p>' : '')
        + '</div></div>';
    }).join('');
  }

  function emptyHtml(title, text, withExamples){
    return '<div class="empty"><strong>'+title+'</strong><span>'+text+'</span>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="btn primary" data-new-task="1">Add a task</button>'
      + (withExamples ? '<button class="btn" data-examples="1">Load example week</button>' : '') + '</div></div>';
  }

  // Subjects and categories are both optional; "+ New…" reveals the matching "-new" input.
  function fillSelect(sel, items, kind){
    if (document.activeElement === sel) return;
    const prev = sel.value;
    sel.innerHTML = '<option value="">'+(kind === 'subjects' ? 'No subject' : 'No category')+'</option>'
      + items.map(x => '<option value="'+esc(x.name)+'">'+esc(x.name)+'</option>').join('')
      + '<option value="__new">+ New '+label(kind)+'…</option>';
    const names = items.map(x => x.name);
    sel.value = prev === '__new' || names.includes(prev) ? prev : '';
    const nw = document.getElementById(sel.id+'-new'); if (nw) nw.hidden = sel.value !== '__new';
  }
  function fillProjects(sel, keep){
    const list = projects.filter(p => !p.done || p.id === keep).sort((a,b) => a.name.localeCompare(b.name));
    sel.innerHTML = '<option value="">None (a personal task)</option>' + list.map(p => '<option value="'+p.id+'">'+esc(p.name)+'</option>').join('');
  }

  // ---------- subjects page: subject → projects (→ tasks, on the project page) ----------
  function itemHead(kind, it, items){
    const {tasks:used, projs} = usage(kind, it.name), act = used.filter(t => !t.done).length;
    const isPick = picking && picking.kind === kind && picking.id === it.id;
    const isConf = confirming && confirming.kind === kind && confirming.id === it.id;
    const count = kind === 'subjects'
      ? [act ? plural(act, 'task') + ' to do' : '', projs.length ? plural(projs.length, 'project') : ''].filter(Boolean).join(' · ') || 'Nothing yet'
      : used.length ? act+' active · '+(used.length-act)+' done' : 'No tasks';
    let h = '<div class="item-wrap" data-kind="'+kind+'" data-id="'+it.id+'"><div class="item">'
      + '<button class="swatch" style="--c:var(--c'+it.color+')" data-pick="1" aria-expanded="'+!!isPick+'" aria-label="Change color for '+esc(it.name)+'"></button>'
      + '<input class="item-name" id="ren-'+kind+'-'+it.id+'" value="'+esc(it.name)+'" maxlength="40" data-rename="1" aria-label="Rename '+esc(it.name)+'">'
      + '<span class="item-count">'+count+'</span>'
      + '<button class="del" data-delitem="1" aria-label="Delete '+esc(it.name)+'">'+binSvg+'</button></div>';
    if (isPick) h += '<div class="palette" role="group" aria-label="Colors">' + [1,2,3,4,5,6,7,8].map(c => '<button style="--c:var(--c'+c+')" data-color="'+c+'" aria-pressed="'+(c === it.color)+'" aria-label="Color '+c+'"></button>').join('') + '</div>';
    if (isConf) {
      const others = items.filter(x => x !== it);
      const what = [used.length ? plural(used.length, 'task') : '', projs.length ? plural(projs.length, 'project') : ''].filter(Boolean).join(' and ');
      const opts = '<option value="__clear">Leave them with no '+label(kind)+'</option>'
        + others.map(x => '<option value="'+esc(x.name)+'">Move them to '+esc(x.name)+'</option>').join('')
        + (used.length ? '<option value="__delete">Delete those tasks too'+(projs.length ? ' (projects are kept)' : '')+'</option>' : '');
      h += '<div class="confirm"><span>Delete <b>'+esc(it.name)+'</b>? '+what+(used.length + projs.length === 1 ? ' uses' : ' use')+' it.</span>'
        + '<div class="confirm-row"><select id="mv-'+kind+'-'+it.id+'" aria-label="What to do with what uses it">'+opts+'</select>'
        + '<button class="btn danger" data-confirmdel="1">Delete</button><button class="btn ghost" data-canceldel="1">Cancel</button></div></div>';
    }
    return h + '</div>';
  }
  function projRowHtml(p){
    const ts = tasks.filter(t => t.projectId === p.id), done = ts.filter(t => t.done).length, others = membersOf(p.id).length - 1;
    const bits = [ts.length ? done+' of '+plural(ts.length, 'task')+' done' : 'No tasks yet'];
    if (p.due) bits.push(p.done ? 'Due '+fmt(parse(p.due), {month:'short', day:'numeric'}) : dueLabel(p.due).text);
    if (others > 0) bits.push('Shared with '+plural(others, 'person', 'people'));
    return '<div class="proj-row'+(p.done?' is-done':'')+'">'
      + '<button class="check" data-proj-toggle="'+p.id+'" aria-pressed="'+p.done+'" aria-label="'+(p.done?'Mark not done: ':'Mark done: ')+esc(p.name)+'">'+checkSvg+'</button>'
      + '<button class="proj-open" data-open-project="'+p.id+'"><span class="t-name">'+esc(p.name)+'</span>'
      + '<span class="meta">'+esc(bits.join(' · '))+'</span></button>'
      + '<span class="proj-chev" aria-hidden="true">'+chevSvg+'</span></div>';
  }
  const projSort = (a,b) => (a.done - b.done) || (a.due || '9999').localeCompare(b.due || '9999') || a.name.localeCompare(b.name);
  // ---------- subjects: sidebar list, subject page (its projects and its own tasks), categories in Settings ----------
  // currentSubject is a subject id, or 'none' for things not filed under any subject.
  let currentSubject = null;
  const subjectById = id => listOf('subjects').find(x => x.id === id);
  const looseProjects = () => projects.filter(p => !projSubject(p.id));
  const looseTasks = () => tasks.filter(t => !t.projectId && !t.subject);
  function subjNavHtml(){
    const subs = listOf('subjects'), sel = activeSubjectId();
    const item = (id, name, color, n) => '<button class="snav" data-open-subject="'+id+'"'+(sel === id ? ' aria-current="page"' : '')+' style="--c:'+color+'">'
      + '<i class="dot"></i><span class="snav-name">'+esc(name)+'</span>'+(n ? '<span class="count">'+n+'</span>' : '')+'</button>';
    const open = name => tasks.filter(t => !t.done && subjOf(t) === name).length;
    const curProj = currentView() === 'project' ? currentProject : null;
    const projItems = name => projects.filter(p => !p.done && projSubject(p.id) === name).sort(projSort).map(p =>
      '<button class="snav snav-proj" data-open-project="'+p.id+'"'+(curProj === p.id ? ' aria-current="page"' : '')+'>'+folderSvg+'<span class="snav-name">'+esc(p.name)+'</span></button>').join('');
    let h = subs.map(s => item(s.id, s.name, 'var(--c'+s.color+')', open(s.name)) + projItems(s.name)).join('');
    if (looseProjects().length || looseTasks().length) h += item('none', 'No subject', 'var(--faint)', open('')) + projItems('');
    return h || '<p class="side-empty">No subjects yet. Use the buttons above to add one.</p>';
  }
  // The subject highlighted in the sidebar: the open subject, or the one the open project is filed under.
  function activeSubjectId(){
    const v = currentView();
    if (v === 'subject') return currentSubject;
    // On a project page the project itself is highlighted, under its subject.
    return null;
  }
  const currentView = () => { const s = document.querySelector('.view:not([hidden])'); return s ? s.id.slice(2) : ''; };

  function renderSubject(){
    const loose = currentSubject === 'none', it = loose ? null : subjectById(currentSubject);
    $('#subjBody').hidden = !loose && !it;
    if (!loose && !it) {
      $('#subjHead').innerHTML = '<h1>'+(mode === 'db' ? 'Subject not found' : 'Loading…')+'</h1>';
      return;
    }
    const name = it ? it.name : '';
    // Keep the header (with its rename box) while someone is typing in it.
    const a = document.activeElement;
    if (!(a && a.closest && a.closest('#subjHead') && a.matches('input'))) {
      $('#subjHead').innerHTML = it ? itemHead('subjects', it, listOf('subjects'))
        : '<h1>No subject</h1><p class="sub">Projects and tasks you haven’t filed under a subject. Shared projects you join start here.</p>';
    } else itemsPending = true;
    $('#subjAddProject').hidden = !v2;
    const ps = projects.filter(p => projSubject(p.id) === name).sort(projSort);
    $('#subjProjects').innerHTML = !v2
      ? '<p class="muted pad">Projects switch on once the database is updated for them.</p>'
      : ps.length ? ps.map(projRowHtml).join('')
      : '<div class="empty"><strong>No projects yet</strong><span>A project is a bigger piece of work, like a group report, with its own list of tasks.</span></div>';
    const inSubject = t => !t.projectId && (t.subject || '') === name;
    fillTable('subject', rankedWhere(inSubject), doneWhere(inSubject),
      '<div class="empty"><strong>No tasks here yet</strong><span>Type one above. '+(it ? 'Tasks in '+esc(name) : 'Tasks without a subject')+' that aren’t part of a project show up here.</span></div>');
  }

  function renderItems(){
    const a = document.activeElement;
    $('#sideSubjects').innerHTML = subjNavHtml();
    $('#subjIndex').innerHTML = subjNavHtml();
    $('#sideAddProject').hidden = $('#idxAddProject').hidden = !v2;
    itemsPending = false;
  }

  // ---------- new subject / new project dialog ----------
  let quickKind = null, quickReturn = null, quickAfter = null;
  function openQuick(kind, preset){
    quickKind = kind; quickReturn = document.activeElement; quickAfter = (preset && preset.after) || null;
    const proj = kind === 'project';
    $('#quickTitle').textContent = proj ? 'New project' : 'New subject';
    $('#quickSubmit').textContent = proj ? 'Add project' : 'Add subject';
    $('#q-name-label').textContent = proj ? 'Project name' : 'Subject name';
    $('#q-name').maxLength = proj ? 120 : 40;
    $('#q-name').placeholder = proj ? 'e.g. Group report: market study' : 'e.g. Biology';
    $('#q-name').value = '';
    $('#q-subject-field').hidden = !proj; $('#q-due-field').hidden = !proj; $('#q-due').value = '';
    if (proj) {
      fillSelect($('#q-subject'), listOf('subjects'), 'subjects');
      $('#q-subject').value = (preset && preset.subject) || ''; $('#q-subject-new').hidden = true; $('#q-subject-new').value = '';
    }
    showErr('#quickErr', '');
    $('#quickModal').hidden = false; $('#q-name').focus();
  }
  function closeQuick(){
    $('#quickModal').hidden = true; quickKind = null;
    if (quickReturn && quickReturn.isConnected) quickReturn.focus();
  }

  // ---------- project page ----------
  let projConfirm = null;
  function renderProject(){
    const p = projOf(currentProject);
    $('#projBody').hidden = !p; $('#projAdd').hidden = !p; $('#projCheck').hidden = !p;
    if (!p) {
      $('#projTitle').textContent = mode === 'db' ? 'Project not found' : 'Loading…';
      $('#projChips').textContent = mode === 'db' ? 'It may have been deleted, or you’re no longer in the group.' : '';
      return;
    }
    const ms = membersOf(p.id).sort((a,b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0) || a.joinedAt - b.joinedAt);
    const subj = projSubject(p.id), others = ms.length - 1;
    const back = $('#projBack'), sid = subj ? (listOf('subjects').find(x => x.name === subj) || {}).id : 'none';
    back.textContent = '← ' + (subj || 'No subject'); back.dataset.openSubject = sid || 'none';
    const title = $('#projTitle');
    if (document.activeElement !== title) title.textContent = p.name;
    const chk = $('#projCheck'); chk.dataset.projToggle = p.id; chk.setAttribute('aria-pressed', p.done);
    chk.setAttribute('aria-label', (p.done ? 'Mark not done: ' : 'Mark done: ') + p.name); chk.classList.toggle('on', p.done);

    // Chips under the name: your subject for it, the due date, progress and the group.
    const ts = tasks.filter(t => t.projectId === p.id), nDone = ts.filter(t => t.done).length;
    const chips = $('#projChips'), a = document.activeElement;
    if (a && chips.contains(a)) tablePending = true;
    else {
      const due = p.due ? shortDue(p.due) : null;
      chips.innerHTML = (p.done ? '<span class="cell-static st-done"><i class="st-dot"></i>Done</span>' : '')
        + '<label class="cell'+(subj ? '' : ' is-empty')+'" title="Only you see this. Groupmates file the project under their own subject."><i class="dot" style="--c:'+colorOf('subjects', subj)+'"></i><select data-proj-field="subject" aria-label="Your subject for this project">'
        + opt('', 'No subject', !subj) + listOf('subjects').map(x => opt(x.name, x.name, x.name === subj)).join('') + opt('__new', '+ New subject…') + '</select></label>'
        + '<label class="cell date-cell'+(p.due ? '' : ' is-empty')+'"><span class="'+(due && !p.done ? due.cls : '')+'">'+(due ? 'Due '+esc(due.text) : 'No due date')+'</span><input type="date" data-proj-field="due" value="'+(p.due || '')+'" aria-label="Project due date"></label>'
        + (ts.length ? '<span class="cell-static proj-progress"><i class="bar"><i style="width:'+Math.round(nDone / ts.length * 100)+'%"></i></i>'+nDone+' of '+ts.length+' done</span>' : '')
        + '<span class="cell-static">'+(others > 0 ? 'Shared with '+plural(others, 'person', 'people') : 'Only you so far')+'</span>';
    }
    const allDone = ts.length > 0 && nDone === ts.length && !p.done;
    $('#projDoneNote').hidden = !allDone;
    $('#projDoneNote').innerHTML = allDone ? '<span>Every task is done.</span><button class="btn primary" data-proj-toggle="'+p.id+'">Mark the project done</button>' : '';

    const inProject = t => t.projectId === p.id;
    fillTable('project', rankedWhere(inProject), doneWhere(inProject),
      '<div class="empty"><strong>No tasks yet</strong><span>Type one above to break the project into steps your group can tick off.</span></div>');

    const set = (id, v) => { const el = $(id); if (document.activeElement !== el) el.value = v; };
    $('#pjMembers').innerHTML = ms.map(m => {
      const n = nameOf(m.userId);
      return '<li><span class="avatar sm">'+esc(initials(n))+'</span><span class="m-name">'+esc(n)+(m.userId === myId() ? ' <span class="muted">(you)</span>' : '')+'</span>'
        + '<span class="m-role">'+(m.role === 'owner' ? 'Owner' : 'Member')+'</span>'
        + (isOwner(p) && m.userId !== myId() ? '<button class="mini" data-remove-member="'+m.userId+'" aria-label="Remove '+esc(n)+'">Remove</button>' : '') + '</li>';
    }).join('');
    set('#pjLink', inviteLink(p) || 'Loading…');
    $('#pjResetWrap').hidden = !isOwner(p);
    const own = isOwner(p);
    $('#pjDanger').innerHTML = projConfirm === p.id
      ? '<span>'+(own ? 'Delete this project and its tasks for everyone in the group?' : 'Leave this project? You can rejoin with the invite link.')+'</span>'
        + '<button class="btn danger" type="button" data-proj-danger="yes">'+(own ? 'Delete project' : 'Leave')+'</button><button class="btn ghost" type="button" data-proj-danger="no">Cancel</button>'
      : '<button class="btn ghost danger-text" type="button" data-proj-danger="ask">'+(own ? 'Delete project' : 'Leave project')+'</button>';
  }

  // Fills one of the task tables (Tasks page, a subject, a project): ranked active rows, then a collapsible Done list.
  function fillTable(key, active, done, empty, grip){
    const box = document.querySelector('[data-tt="'+key+'"]'), list = box.querySelector('.tt-list'), dl = box.querySelector('.tt-done-list');
    // Don't rebuild a table under someone who is typing in a cell or has a dropdown open.
    const a = document.activeElement;
    if (a && box.contains(a) && a.closest('.tt-list, .tt-done-list') && a.matches('input, select, [contenteditable]')) { tablePending = true; return; }
    box.querySelector('.tt-head').hidden = !active.length;
    box.classList.toggle('no-proj', !v2 || !projects.length);
    list.innerHTML = active.length ? active.map((r, i) => ttRowHtml(r.t, r, i, grip)).join('') : empty;
    box.querySelector('.tt-done').hidden = !done.length;
    box.querySelector('.tt-done-count').textContent = done.length;
    box.querySelector('[data-done-toggle]').setAttribute('aria-expanded', doneOpen[key]);
    dl.hidden = !doneOpen[key];
    dl.innerHTML = doneOpen[key] ? done.map(t => ttRowHtml(t, null)).join('') : '';
  }
  // The tasks in one subject or project, in the same priority order as the main list (numbered within the subset).
  const rankedWhere = keep => prioList().filter(r => keep(r.t));
  const doneWhere = keep => tasks.filter(t => t.done && keep(t)).sort(cmpDone);

  // ---------- tasks page: one ranked to-do list, or a board ----------
  function renderTasks(ranked, loading, none){
    const done = tasks.filter(t => t.done).sort(cmpDone);
    $('#taskSub').textContent = loading ? 'Loading your tasks…' : ranked.length + ' to do · ' + done.length + ' done';
    document.querySelectorAll('[data-layout]').forEach(b => b.setAttribute('aria-pressed', b.dataset.layout === layout));
    $('#listView').hidden = layout !== 'list'; $('#board').hidden = layout !== 'board';
    const custom = pref('prioMode','auto') === 'custom';
    $('#prioReset').hidden = layout === 'board' || !custom;
    $('#taskHint').textContent = layout === 'board' ? 'Drag cards between columns' : custom ? 'Your order ·' : 'Auto-sorted by priority';
    $('#board').innerHTML = loading ? '' : boardHtml(ranked, done);
    if (loading) { $('#taskList').innerHTML = '<p class="muted pad">Loading…</p>'; $('[data-tt="tasks"] .tt-head').hidden = true; return; }
    fillTable('tasks', ranked, done, none ? emptyHtml('No tasks yet', 'Type one above, or load an example week to explore.', true)
      : '<div class="empty"><strong>All caught up</strong><span>Nothing left to do. Nice work.</span></div>', true);
  }

  // ---------- dashboard: today, the next 7 days, and projects ----------
  function dashRow(r){
    const t = r.t, n = r.n;
    const when = n < -1 ? 'Overdue by '+(-n)+' days' : n === -1 ? 'Overdue by 1 day' : n === 0 ? 'Due today' : n === 1 ? 'Due tomorrow' : 'Due '+fmt(parse(t.due), {weekday:'short', month:'short', day:'numeric'});
    return '<div class="row" data-row-id="'+t.id+'">'
      + '<button class="check" data-toggle="'+t.id+'" aria-pressed="false" aria-label="Mark done: '+esc(t.name)+'">'+checkSvg+'</button>'
      + '<div class="t-main"><span class="t-name">'+esc(t.name)+'</span><div class="meta">'+subjChip(t)+projTag(t)
      + '<span class="date '+(n < 0 ? 'over' : n === 0 ? 'today' : '')+'">'+esc(when)+'</span>'+doingTag(t)+'</div></div></div>';
  }
  function renderDashboard(ranked, loading, none){
    const t0 = today(), [mon] = weekBounds(), hour = new Date().getHours();
    const first = session ? displayName(session.user).split(' ')[0] : '';
    $('#dashHello').textContent = (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening') + (first ? ', ' + first : '');
    const over = ranked.filter(r => r.n < 0), dueToday = ranked.filter(r => r.n === 0);
    const week = ranked.filter(r => r.n >= 1 && r.n <= 7);
    const doneWeek = tasks.filter(t => t.done && t.doneAt && t.doneAt >= mon.getTime()).length;
    const stat = (lab, num, note, cls) => '<div class="card stat '+cls+'"><span class="label">'+lab+'</span><span class="num">'+(loading ? '–' : num)+'</span><span class="note">'+note+'</span></div>';
    $('#stats').innerHTML =
      stat('Overdue', over.length, over.length ? 'Past due' : 'Nothing late', over.length ? 'is-crit' : '') +
      stat('Due today', dueToday.length, dueToday.length ? 'Before tonight' : 'Nothing due today', dueToday.length ? 'is-warn' : '') +
      stat('Next 7 days', week.length, week.length === 1 ? 'task coming up' : 'tasks coming up', '') +
      stat('Done this week', doneWeek, doneWeek ? 'Since Monday' : 'Tick one off', doneWeek ? 'is-ok' : '');
    $('#dashSub').textContent = fmt(t0, {weekday:'long', month:'long', day:'numeric'}) + ' · ' + (loading ? 'Loading your tasks…'
      : over.length ? plural(over.length, 'task') + ' overdue. Start with those.' : dueToday.length ? plural(dueToday.length, 'task') + ' due today.'
      : ranked.length ? 'Nothing urgent. A good day to get ahead.' : none ? 'Add your first task to get started.' : 'Everything is done.');

    // Today: overdue, due today, and anything already in progress.
    const focus = ranked.filter(r => r.n <= 0 || r.t.status === 'doing'), shown = focus.slice(0, 8);
    $('#todaySub').textContent = loading ? '' : focus.length ? plural(focus.length, 'task') + ' to focus on' : '';
    $('#todayList').innerHTML = loading ? '<p class="muted">Loading…</p>'
      : shown.length ? shown.map(dashRow).join('') + (focus.length > shown.length ? '<button class="link more-link" data-go="tasks">+'+(focus.length - shown.length)+' more in Tasks</button>' : '')
      : none ? emptyHtml('No tasks yet', 'Add your first assignment, or load an example week to explore.', true)
      : ranked.length ? '<div class="empty"><strong>Nothing due today</strong><span>Next up: '+esc(ranked[0].t.name)+', due '+(ranked[0].n === 1 ? 'tomorrow' : esc(fmt(parse(ranked[0].t.due), {weekday:'long', month:'short', day:'numeric'})))+'.</span></div>'
      : '<div class="empty"><strong>All caught up</strong><span>Every task is ticked off.</span></div>';

    // Coming up: tomorrow to a week from today, by day.
    const days = [];
    for (let n = 1; n <= 7; n++) { const list = week.filter(r => r.n === n); if (list.length) days.push([n, list]); }
    $('#agenda').innerHTML = loading ? '<p class="muted">Loading…</p>' : days.length ? days.map(([n, list]) => {
      const d = addDays(t0, n);
      return '<div class="agenda-day"><div class="agenda-date"><b>'+(n === 1 ? 'Tomorrow' : fmt(d, {weekday:'long'}))+'</b><span>'+fmt(d, {month:'short', day:'numeric'})+'</span></div>'
        + '<ul>'+list.map(r => '<li><i class="dot" style="--c:'+colorOf('subjects', subjOf(r.t))+'"></i><span>'+esc(r.t.name)+'</span>'
          + (r.t.importance === 'high' ? '<span class="imp-flag">High</span>' : '') + '</li>').join('')+'</ul></div>';
    }).join('') : '<div class="empty"><strong>A clear week ahead</strong><span>Nothing is due in the next 7 days.</span></div>';

    // Projects: what's left in each, and when it's due.
    $('#dashProjectsCard').hidden = !v2 || loading;
    const live = projects.filter(p => !p.done).sort(projSort), finished = projects.length - live.length;
    $('#dashProjects').innerHTML = live.length ? live.map(p => {
      const ts = tasks.filter(t => t.projectId === p.id), dn = ts.filter(t => t.done).length, pct = ts.length ? Math.round(dn / ts.length * 100) : 0;
      const s = projSubject(p.id), due = p.due ? shortDue(p.due) : null, ms = membersOf(p.id);
      return '<button class="ptile" data-open-project="'+p.id+'"><span class="ptile-name">'+esc(p.name)+'</span>'
        + '<span class="meta"><span class="chip" style="--c:'+colorOf('subjects', s)+'"><i class="dot"></i>'+esc(s || 'No subject')+'</span>'
        + (due ? '<span class="date '+due.cls+'">Due '+esc(due.text)+'</span>' : '') + '</span>'
        + '<span class="bar"><i style="width:'+pct+'%"></i></span>'
        + '<span class="ptile-foot"><span>'+(ts.length ? dn+' of '+plural(ts.length, 'task')+' done' : 'No tasks yet')+'</span>'
        + (ms.length > 1 ? '<span class="avatars">'+ms.slice(0, 3).map(m => '<i>'+esc(initials(nameOf(m.userId)))+'</i>').join('')+'</span>' : '') + '</span></button>';
    }).join('') + (finished ? '<p class="muted pfoot">'+plural(finished, 'finished project')+'</p>' : '')
      : '<div class="empty"><strong>No projects yet</strong><span>Got a group report or anything with several steps? Make it a project, or turn an existing task into one from its edit dialog.</span></div>';
  }

  let drag = null, bdrag = null, renderPending = false;
  function render(){
    if (drag || bdrag) { renderPending = true; return; }
    tablePending = false;
    renderPending = false;
    const t0 = today();
    $('#sideDate').textContent = fmt(t0, {weekday:'long', month:'short', day:'numeric'});
    $('#sideWeek').textContent = 'Week ' + isoWeek(t0) + ' of ' + t0.getFullYear();

    const active = tasks.filter(t => !t.done);
    $('#navCount').textContent = active.length;
    const loading = mode === 'loading' || mode === 'db-wait';
    const none = !loading && tasks.length === 0;

    const b = $('#banner');
    if (tasks.some(t => t.example)) { b.hidden = false; b.innerHTML = '<span>Showing example tasks so you can see how it works. Your own tasks appear alongside them.</span><button class="btn" data-clear-ex="1">Remove examples</button>'; }
    else b.hidden = true;

    const ranked = prioList();
    renderDashboard(ranked, loading, none);
    renderTasks(ranked, loading, none);
    renderItems();
    renderSubject();
    renderProject();
  }

  // ---------- navigation ----------
  // Views: dashboard, tasks, subject (#subject/<id>), project (#project/<id>), settings.
  // "subjects" is the subject list, used as a page only on phones, where the sidebar is a bottom bar.
  const VIEWS = ['dashboard','tasks','subjects','subject','project','settings'];
  function go(v){
    if (v === 'priorities') v = 'tasks'; // old links
    if (v && v.indexOf('project/') === 0) { currentProject = v.slice(8); v = 'project'; }
    if (v && v.indexOf('subject/') === 0) { currentSubject = v.slice(8); v = 'subject'; }
    if (!VIEWS.includes(v) || (v === 'project' && !currentProject) || (v === 'subject' && !currentSubject)) v = 'dashboard';
    document.querySelectorAll('.view').forEach(s => s.hidden = s.id !== 'v-'+v);
    const sec = document.getElementById('v-'+v); sec.classList.add('enter'); clearTimeout(go.t); go.t = setTimeout(() => sec.classList.remove('enter'), 700);
    mover = null; cardMover = null; projConfirm = null; picking = null; confirming = null;
    const navV = v === 'project' || v === 'subject' ? 'subjects' : v;
    document.querySelectorAll('.nav button, .me').forEach(b => { if (b.dataset.view === navV) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
    const hash = v === 'project' ? 'project/' + currentProject : v === 'subject' ? 'subject/' + currentSubject : v;
    try { history.replaceState(null, '', location.pathname + location.search + '#' + hash); } catch(e) {}
    window.scrollTo(0,0);
    render();
  }
  function openProject(id){ currentProject = id; go('project'); }
  function openSubject(id){ currentSubject = id; go('subject'); }
  // The subject name to preset when adding from the subject page.
  const presetSubject = () => { const it = currentView() === 'subject' && subjectById(currentSubject); return it ? it.name : ''; };

  document.addEventListener('click', e => {
    const el = e.target.closest('button'); if (!el) return;
    const wrap = el.closest('.item-wrap'), kind = wrap && wrap.dataset.kind, id = wrap && wrap.dataset.id, d = el.dataset;
    if (d.view) go(d.view);
    else if (d.go) go(d.go);
    else if (d.newTask) openTask(null, d.newTask === 'project' && currentProject ? {projectId:currentProject} : d.newTask === 'subject' ? {subject:presetSubject()} : null);
    else if (d.newProject) openQuick('project', {subject:presetSubject()});
    else if (d.newSubject) openQuick('subject');
    else if (d.closeQuick) closeQuick();
    else if (d.openSubject) openSubject(d.openSubject);
    else if (d.openProject) openProject(d.openProject);
    else if (d.projToggle) toggleProject(d.projToggle);
    else if (d.toggle) toggle(d.toggle);
    else if (d.del) { const t = tasks.find(x => x.id === d.del); remove(d.del); if (t) toast('Deleted “'+short(t.name)+'”'); }
    else if (d.examples) loadExamples();
    else if (d.clearEx) clearExamples();
    else if (d.pushToggle) togglePush();
    else if (d.emailToggle) toggleEmail();
    else if (d.doneToggle) { doneOpen[d.doneToggle] = !doneOpen[d.doneToggle]; render(); }
    else if (d.layout) { layout = d.layout; lsSet(LAYOUT, layout); mover = null; cardMover = null; render(); }
    else if (d.pick) { picking = picking && picking.id === id && picking.kind === kind ? null : {kind, id}; confirming = null; render(); }
    else if (d.color) setColor(kind, id, Number(d.color));
    else if (d.delitem) {
      const it = listOf(kind).find(x => x.id === id); if (!it) return;
      if (!usage(kind, it.name).count) deleteItem(kind, id, '__clear');
      else { confirming = {kind, id}; picking = null; render(); }
    }
    else if (d.confirmdel) deleteItem(kind, id, $('#mv-'+kind+'-'+id).value);
    else if (d.canceldel) { confirming = null; render(); }
    else if (d.grip) {
      if (justDragged) return;
      const k = el.closest('[data-reorder]').dataset.reorder, tid = d.grip;
      mover = mover && mover.id === tid && mover.kind === k ? null : {kind:k, id:tid};
      render();
      const first = document.querySelector('.mover [data-move="up"]'); if (first) first.focus();
    }
    else if (d.move) {
      const m = mover; if (!m) return;
      if (d.move === 'close') { mover = null; render(); const g = document.querySelector('[data-reorder="'+m.kind+'"] [data-grip="'+m.id+'"]'); if (g) g.focus(); return; }
      if (!moveTask(m.kind, m.id, d.move)) { toast(d.move === 'up' || d.move === 'top' ? 'Already at the top' : 'Already at the bottom'); return; }
      const again = document.querySelector('.mover [data-move="'+d.move+'"]'); if (again) again.focus();
    }
    else if (d.cardGrip) {
      if (justDragged) return;
      cardMover = cardMover === d.cardGrip ? null : d.cardGrip;
      render();
      const first = document.querySelector('.kcard .mover button'); if (first) first.focus();
    }
    else if (d.statusMove) {
      const tid = cardMover; cardMover = null;
      if (d.statusMove === 'close') render(); else setStatus(tid, d.statusMove);
      const g = document.querySelector('[data-card-grip="'+tid+'"]'); if (g) g.focus();
    }
    else if (d.edit) openTask(d.edit);
    else if (d.closeEdit) closeEdit();
    else if (d.editDel) editDelete(d.editDel);
    else if (d.convertTask) convertToProject(editing);
    else if (d.orderMode) resetOrder();
    else if (d.copyInvite) copyInvite(currentProject);
    else if (d.resetInvite) resetInvite(currentProject);
    else if (d.removeMember) removeMember(currentProject, d.removeMember);
    else if (d.projDanger) {
      const p = projOf(currentProject); if (!p) return;
      if (d.projDanger === 'ask') { projConfirm = p.id; renderProject(); const y = document.querySelector('[data-proj-danger="no"]'); if (y) y.focus(); }
      else if (d.projDanger === 'no') { projConfirm = null; renderProject(); }
      else { projConfirm = null; if (isOwner(p)) deleteProject(p.id); else leaveProject(p.id); }
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#quickModal').hidden) closeQuick(); else if (!$('#editModal').hidden) closeEdit();
  });

  // ---------- drag to reorder (ranked list) ----------
  const rowsIn = list => [...list.querySelectorAll(':scope > [data-row-id]')];
  document.addEventListener('pointerdown', e => {
    const g = e.target.closest('[data-grip]'); if (!g || e.button > 0) return;
    const row = g.closest('[data-row-id]'), list = row && row.parentElement;
    if (!list || !list.dataset.reorder) return;
    e.preventDefault();
    try { g.setPointerCapture(e.pointerId); } catch(err) {}
    drag = {row, list, moved:false, startY:e.clientY, before: rowsIn(list).map(r => r.dataset.rowId).join()};
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moved) {
      if (Math.abs(e.clientY - drag.startY) < 5) return;
      drag.moved = true; drag.row.classList.add('dragging'); drag.list.classList.add('is-sorting');
    }
    const y = e.clientY, sibs = rowsIn(drag.list).filter(r => r !== drag.row);
    const next = sibs.find(s => { const b = s.getBoundingClientRect(); return y < b.top + b.height / 2; });
    if (next) { if (drag.row.nextElementSibling !== next) drag.list.insertBefore(drag.row, next); }
    else if (sibs.length && drag.list.lastElementChild !== drag.row) sibs[sibs.length - 1].after(drag.row);
    edgeScroll(y);
  });
  const edgeScroll = y => { const bottomEdge = innerHeight - (innerWidth <= 760 ? 110 : 60); if (y < 70) scrollBy(0, -12); else if (y > bottomEdge) scrollBy(0, 12); };
  function endDrag(){
    if (!drag) return;
    const d = drag; drag = null;
    d.row.classList.remove('dragging'); d.list.classList.remove('is-sorting');
    if (d.moved) { justDragged = true; setTimeout(() => { justDragged = false; }, 0); }
    const ids = rowsIn(d.list).map(r => r.dataset.rowId);
    if (ids.join() !== d.before) { commitOrder(d.list.dataset.reorder, ids); toast('Order saved'); }
    else if (renderPending) render();
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);
  let justDragged = false;
  function moveTask(kind, id, how){
    const list = document.querySelector('[data-reorder="'+kind+'"]'); if (!list) return false;
    const ids = rowsIn(list).map(r => r.dataset.rowId), i = ids.indexOf(id); if (i < 0) return false;
    const j = how === 'up' ? i - 1 : how === 'down' ? i + 1 : how === 'top' ? 0 : ids.length - 1;
    if (j < 0 || j >= ids.length || j === i) return false;
    ids.splice(i, 1); ids.splice(j, 0, id);
    commitOrder(kind, ids);
    return true;
  }
  // Keyboard: arrow keys on a handle move the task one place.
  document.addEventListener('keydown', e => {
    const g = e.target.closest && e.target.closest('[data-grip]'); if (!g || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const kind = g.closest('[data-reorder]').dataset.reorder, id = g.dataset.grip;
    if (moveTask(kind, id, e.key === 'ArrowUp' ? 'up' : 'down')) { const again = document.querySelector('[data-reorder="'+kind+'"] [data-grip="'+id+'"]'); if (again) again.focus(); }
  });

  // ---------- drag between board columns ----------
  const cardsIn = body => [...body.querySelectorAll(':scope > .kcard')];
  document.addEventListener('pointerdown', e => {
    const g = e.target.closest('[data-card-grip]'); if (!g || e.button > 0) return;
    const card = g.closest('.kcard'), body = card && card.parentElement; if (!body) return;
    e.preventDefault();
    try { g.setPointerCapture(e.pointerId); } catch(err) {}
    const r = card.getBoundingClientRect();
    bdrag = {card, id:g.dataset.cardGrip, from:body.dataset.colBody, startX:e.clientX, startY:e.clientY, moved:false,
      dx:e.clientX - r.left, dy:e.clientY - r.top, w:r.width, ghost:null, x:e.clientX, y:e.clientY, raf:0};
  });
  // While a card is dragged, a lifted copy (the ghost) follows the pointer and the card itself stays in the board,
  // faded, as a placeholder showing where it will land.
  const tilt = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? '' : ' rotate(2deg)';
  function placeGhost(){
    const d = bdrag; if (!d || !d.ghost) return;
    d.raf = 0;
    d.ghost.style.transform = 'translate3d('+(d.x - d.dx)+'px,'+(d.y - d.dy)+'px,0)' + tilt();
  }
  function startGhost(d){
    const gh = d.card.cloneNode(true);
    gh.classList.add('kcard-ghost'); gh.classList.remove('dragging');
    gh.setAttribute('aria-hidden', 'true');
    gh.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    gh.querySelectorAll('.mover').forEach(n => n.remove());
    gh.style.width = d.w + 'px';
    document.body.appendChild(gh);
    d.ghost = gh; placeGhost();
    d.card.closest('.col').classList.add('drag-from');
  }
  document.addEventListener('pointermove', e => {
    if (!bdrag) return;
    if (!bdrag.moved) {
      if (Math.hypot(e.clientX - bdrag.startX, e.clientY - bdrag.startY) < 5) return;
      bdrag.moved = true; bdrag.card.classList.add('dragging'); $('#board').classList.add('is-sorting');
      startGhost(bdrag);
    }
    bdrag.x = e.clientX; bdrag.y = e.clientY;
    if (!bdrag.raf) bdrag.raf = requestAnimationFrame(placeGhost);
    const under = document.elementFromPoint(e.clientX, e.clientY), col = under && under.closest('.col');
    const body = col && col.querySelector('[data-col-body]');
    if (body) {
      document.querySelectorAll('.col.drop').forEach(c => c.classList.toggle('drop', c === col)); col.classList.add('drop');
      const sibs = cardsIn(body).filter(c => c !== bdrag.card);
      const next = sibs.find(s => { const b = s.getBoundingClientRect(); return e.clientY < b.top + b.height / 2; });
      if (next) { if (bdrag.card.nextElementSibling !== next) body.insertBefore(bdrag.card, next); }
      else if (bdrag.card.parentElement !== body || body.lastElementChild !== bdrag.card) body.appendChild(bdrag.card);
    }
    edgeScroll(e.clientY);
  });
  function endBoardDrag(){
    if (!bdrag) return;
    const d = bdrag; bdrag = null;
    if (d.raf) cancelAnimationFrame(d.raf);
    if (d.ghost) d.ghost.remove();
    d.card.classList.remove('dragging'); $('#board').classList.remove('is-sorting');
    document.querySelectorAll('.col.drop, .col.drag-from').forEach(c => c.classList.remove('drop', 'drag-from'));
    if (!d.moved) return;
    justDragged = true; setTimeout(() => { justDragged = false; }, 0);
    const to = d.card.parentElement && d.card.parentElement.dataset.colBody;
    if (to && to !== d.from) setStatus(d.id, to); else render();
  }
  document.addEventListener('pointerup', endBoardDrag);
  document.addEventListener('pointercancel', endBoardDrag);

  // ---------- task dialog (new and edit) ----------
  let editing = null, editReturn = null;
  function syncSubjectField(){
    const inProj = !!$('#e-project').value;
    $('#e-subject-field').hidden = inProj; $('#e-proj-note').hidden = !inProj;
  }
  function openTask(id, preset){
    const t = id ? tasks.find(x => x.id === id) : null; if (id && !t) return;
    editing = t ? t.id : null; editReturn = document.activeElement;
    $('#editTitle').textContent = t ? 'Edit task' : 'New task';
    $('#editSubmit').textContent = t ? 'Save changes' : 'Add task';
    $('#e-name').value = t ? t.name : '';
    $('#e-due').value = t ? t.due : iso(addDays(today(), 2));
    fillProjects($('#e-project'), t && t.projectId); $('#e-project').value = t ? (t.projectId || '') : ((preset && preset.projectId) || '');
    const subs = listOf('subjects');
    fillSelect($('#e-subject'), subs, 'subjects');
    $('#e-subject').value = t ? (t.subject || '') : preset && preset.subject != null ? preset.subject : (subs[0] ? subs[0].name : '');
    $('#e-subject-new').hidden = true;
    $('#e-subject-new').value = '';
    const imp = document.getElementById('eimp-' + (t ? t.importance || 'medium' : 'medium')); if (imp) imp.checked = true;
    const st = document.getElementById('estat-' + (t ? statusOf(t) : 'todo')); if (st) st.checked = true;
    // Without the projects migration there is nowhere to save a project or the Doing status.
    $('#e-project').closest('.field').hidden = !v2;
    $('label[for="estat-doing"]').hidden = !v2;
    $('#estat-doing').closest('.seg').style.gridTemplateColumns = v2 ? '' : 'repeat(2,1fr)';
    syncSubjectField();
    $('#editDelete').hidden = !t; editDelete('reset'); showErr('#editErr', '');
    // A personal task that turns out to have several steps can become a project.
    $('#editConvert').hidden = !t || !!t.projectId || !v2;
    $('#editModal').hidden = false; $('#e-name').focus();
  }
  function closeEdit(){
    $('#editModal').hidden = true; editing = null;
    if (editReturn && editReturn.isConnected) editReturn.focus();
  }
  function editDelete(step){
    const box = $('#editDelete');
    if (step === 'ask') box.innerHTML = '<span>Delete this task?</span><button class="btn danger" type="button" data-edit-del="yes">Delete</button><button class="btn ghost" type="button" data-edit-del="reset">Keep</button>';
    else if (step === 'yes') { const t = tasks.find(x => x.id === editing); const id = editing; closeEdit(); remove(id); if (t) toast('Deleted “'+short(t.name)+'”'); }
    else box.innerHTML = '<button class="btn ghost danger-text" type="button" data-edit-del="ask">Delete task</button>';
  }
  $('#editModal').addEventListener('click', e => { if (e.target.id === 'editModal') closeEdit(); });
  $('#e-project').addEventListener('change', syncSubjectField);
  ['e-subject'].forEach(id => $('#'+id).addEventListener('change', e => {
    const nw = $('#'+id+'-new'); nw.hidden = e.target.value !== '__new'; if (!nw.hidden) nw.focus();
  }));
  // Reuse existing spelling; add genuinely new names to the managed lists.
  function adopt(L, k, v){
    if (!v) return {name:v, changed:false};
    const hit = L[k].find(x => x.name.toLowerCase() === v.toLowerCase());
    if (hit) return {name:hit.name, changed:false};
    L[k].push({id:uid(), name:v, color:hashColor(v)}); return {name:v, changed:true};
  }
  $('#editForm').addEventListener('submit', e => {
    e.preventDefault();
    const t = editing ? tasks.find(x => x.id === editing) : null; if (editing && !t) return closeEdit();
    const projectId = $('#e-project').value || null;
    const sSel = $('#e-subject').value;
    const name = $('#e-name').value.trim(), due = $('#e-due').value;
    const sNew = !projectId && sSel === '__new';
    const err = !name ? ['Give the task a name.', '#e-name']
      : (sNew && !$('#e-subject-new').value.trim()) ? ['Type a name for the new subject, or pick one.', '#e-subject-new']
      : !due ? ['Pick a due date.', '#e-due'] : null;
    if (err) { showErr('#editErr', err[0]); $(err[1]).focus(); return; }
    const L = materialize();
    const s = adopt(L, 'subjects', projectId ? '' : sNew ? $('#e-subject-new').value.trim() : sSel);
    if (s.changed) saveLists(L);
    const status = (document.querySelector('input[name="estat"]:checked') || {}).value || 'todo', done = status === 'done';
    const importance = (document.querySelector('input[name="eimp"]:checked') || {}).value || 'medium';
    const base = t || {id:uid(), createdAt:Date.now()};
    // A personal task must belong to you; a project task keeps whoever created it.
    const userId = projectId ? (base.userId || myId()) : myId();
    saveMany([{...base, userId, projectId, name, subject:s.name || '', category:base.category || '', due, importance, status, done, doneAt: done ? (base.doneAt || Date.now()) : null}]);
    closeEdit();
    const p = projectId && projOf(projectId);
    toast(t ? 'Saved changes to “'+short(name)+'”' : 'Added “'+short(name)+'”' + (p ? ' to '+short(p.name) : ''));
  });

  // ---------- project page: name, subject and due date edited in place ----------
  document.addEventListener('keydown', e => {
    if (e.target.id !== 'projTitle') return;
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    if (e.key === 'Escape') { e.stopPropagation(); const p = projOf(currentProject); if (p) e.target.textContent = p.name; e.target.blur(); }
  });
  document.addEventListener('focusout', e => {
    if (e.target.id !== 'projTitle') return;
    const p = projOf(currentProject); if (!p) return;
    const name = e.target.textContent.replace(/\s+/g, ' ').trim().slice(0, 120);
    if (!name) { e.target.textContent = p.name; return toast('The project needs a name'); }
    if (name !== p.name) { saveProject({...p, name}); toast('Renamed to “'+short(name)+'”'); }
  }, true);
  document.addEventListener('change', e => {
    const f = e.target.dataset && e.target.dataset.projField; if (!f) return;
    const p = projOf(currentProject); if (!p) return;
    if (f === 'due') { if (e.target.value !== (p.due || '')) saveProject({...p, due:e.target.value}); return; }
    if (e.target.value === '__new') {
      e.target.value = projSubject(p.id);
      return openQuick('subject', {after: name => setProjectSubject(p.id, name)});
    }
    setProjectSubject(p.id, e.target.value);
    e.target.blur();
  });
  // A task that turned out to be bigger: make it a project with the same name, subject and due date.
  async function convertToProject(id){
    const t = tasks.find(x => x.id === id); if (!t || t.projectId) return;
    closeEdit();
    const pid = await createProject(t.name, t.subject || '', t.due);
    if (!pid) return;
    remove(t.id);
    openProject(pid);
    toast('“'+short(t.name)+'” is now a project. Add its steps below.');
  }

  // Re-check when the date rolls over or the tab comes back into view.
  let lastDay = iso(today());
  function dayCheck(){ const td = iso(today()); if (td !== lastDay) { lastDay = td; render(); } }
  setInterval(dayCheck, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) dayCheck(); });

  // Rename boxes (subject page header, categories in Settings).
  document.addEventListener('change', e => {
    if (e.target.matches('[data-rename]')) { const w = e.target.closest('.item-wrap'); renameItem(w.dataset.kind, w.dataset.id, e.target.value); }
  });
  document.addEventListener('keydown', e => {
    if (!e.target.matches || !e.target.matches('[data-rename]')) return;
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    if (e.key === 'Escape') { e.stopPropagation(); e.target.value = e.target.defaultValue; e.target.blur(); }
  });
  document.addEventListener('focusout', () => setTimeout(() => { if (itemsPending || tablePending) render(); }, 0));
  // Tasks table: every cell saves as soon as it changes.
  document.addEventListener('change', e => {
    if (!e.target.matches || !e.target.matches('[data-cell]')) return;
    editCell(e.target);
    if (e.target.tagName === 'SELECT') e.target.blur();
  });
  // Task names are edited in place: Enter or leaving the name saves, Esc puts it back.
  document.addEventListener('keydown', e => {
    if (!e.target.matches || !e.target.matches('[data-cell="name"]')) return;
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    if (e.key === 'Escape') { e.stopPropagation(); const t = tasks.find(x => x.id === e.target.closest('[data-task]').dataset.task); if (t) e.target.textContent = t.name; e.target.blur(); }
  });
  document.addEventListener('focusout', e => { if (e.target.matches && e.target.matches('[data-cell="name"]')) editCell(e.target); }, true);
  document.addEventListener('paste', e => {
    if (!e.target.closest || !e.target.closest('[data-cell="name"]')) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData.getData('text/plain') || '').replace(/\s+/g, ' '));
  });
  // Clicking anywhere on a due date opens the date picker.
  document.addEventListener('click', e => {
    const cell = e.target.closest && e.target.closest('.date-cell'), inp = cell && cell.querySelector('input');
    if (inp && inp.showPicker) { try { inp.showPicker(); } catch(err) {} }
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest && e.target.closest('[data-tt-add]'); if (!f) return;
    e.preventDefault();
    const inp = f.querySelector('input'), name = inp.value.trim(); if (!name) return;
    const key = f.dataset.ttAdd, sub = key === 'subject' && currentSubject !== 'none' ? subjectById(currentSubject) : null;
    const projectId = key === 'project' && projOf(currentProject) ? currentProject : null;
    inp.value = '';
    saveMany([{id:uid(), userId:myId(), projectId, name, subject: sub ? sub.name : '', category:'', due:iso(addDays(today(), 2)), importance:'medium',
      status:'todo', done:false, doneAt:null, createdAt:Date.now()}]);
    toast('Added “'+short(name)+'”');
  });
  $('#quickModal').addEventListener('click', e => { if (e.target.id === 'quickModal') closeQuick(); });
  $('#q-subject').addEventListener('change', e => { const nw = $('#q-subject-new'); nw.hidden = e.target.value !== '__new'; if (!nw.hidden) nw.focus(); });
  $('#quickForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#q-name').value.trim();
    if (!name) { showErr('#quickErr', quickKind === 'project' ? 'Give the project a name.' : 'Give the subject a name.'); $('#q-name').focus(); return; }
    if (quickKind === 'subject') {
      if (!addItem('subjects', name)) { showErr('#quickErr', '“'+short(name)+'” is already one of your subjects.'); $('#q-name').focus(); return; }
      const after = quickAfter; closeQuick(); toast('Added “'+short(name)+'”');
      const it = listOf('subjects').find(x => x.name.toLowerCase() === name.toLowerCase());
      if (after) after(it ? it.name : name); else if (it) openSubject(it.id);
      return;
    }
    const sSel = $('#q-subject').value;
    if (sSel === '__new' && !$('#q-subject-new').value.trim()) { showErr('#quickErr', 'Type a name for the new subject, or pick one.'); $('#q-subject-new').focus(); return; }
    let subject = sSel;
    if (sSel === '__new') { const L = materialize(), s = adopt(L, 'subjects', $('#q-subject-new').value.trim()); subject = s.name; if (s.changed) saveLists(L); }
    const due = $('#q-due').value;
    closeQuick();
    const id = await createProject(name, subject, due);
    if (id) openProject(id);
  });

  let toastTimer;
  function toast(msg){ const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, 2800); }

  // ---------- theme ----------
  const THEME = 'workload.theme.v1', root = document.documentElement, hostTheme = root.getAttribute('data-theme');
  function applyTheme(v){
    if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v);
    else if (hostTheme) root.setAttribute('data-theme', hostTheme);
    else root.removeAttribute('data-theme');
    const r = document.getElementById('th-' + (v === 'light' || v === 'dark' ? v : 'system')); if (r) r.checked = true;
  }
  applyTheme(lsGet(THEME));
  document.querySelectorAll('input[name="theme"]').forEach(r => r.addEventListener('change', e => {
    applyTheme(e.target.value); lsSet(THEME, e.target.value);
    toast(e.target.value === 'system' ? 'Following your device theme' : (e.target.value === 'dark' ? 'Dark mode on' : 'Light mode on'));
  }));

  // ---------- auth (Supabase) ----------
  // The UI reads only session.user.{id, email, created_at, user_metadata.full_name, user_metadata.school}.
  // A database trigger copies full_name and school into public.profiles whenever they change.
  const auth = sb.auth;

  let session = null, bootedFor = null;
  const validEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const displayName = u => (u.user_metadata && u.user_metadata.full_name) || u.email.split('@')[0];
  const initials = n => n.trim().split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase() || '?';
  function showErr(id, msg){ const el = $(id); el.textContent = msg || ''; el.hidden = !msg; }
  async function busy(btn, text, fn){ const old = btn.textContent; btn.disabled = true; btn.textContent = text; try { return await fn(); } finally { btn.disabled = false; btn.textContent = old; } }

  function showAuth(on){ $('#auth').hidden = !on; $('.app').hidden = on; if (on) { setTimeout(() => $('#a-email').focus(), 30); } }
  function enterApp(){
    showAuth(false); renderAccount();
    if (bootedFor !== session.user.id) { teardown(); bootedFor = session.user.id; boot(); }
  }
  function renderAccount(){
    if (!session) return;
    const u = session.user, name = displayName(u), ini = initials(name);
    $('#meAvatar').textContent = ini; $('#meName').textContent = name; $('#meEmail').textContent = u.email;
    $('#pAvatar').textContent = ini; $('#pName').textContent = name; $('#pEmail').textContent = u.email;
    $('#pId').textContent = u.id;
    $('#pSince').textContent = fmt(new Date(u.created_at), {year:'numeric', month:'long', day:'numeric'});
    $('#sessionNote').textContent = 'Signed in on this browser as ' + u.email + '.';
    const set = (id, v) => { const el = $(id); if (document.activeElement !== el) el.value = v; };
    set('#p-name', name); set('#p-email', u.email); set('#p-school', (u.user_metadata && u.user_metadata.school) || '');
  }

  let authMode = 'signin';
  function setAuthMode(m){
    authMode = m; const up = m === 'signup';
    document.querySelectorAll('[data-auth-mode]').forEach(b => { const on = b.dataset.authMode === m; b.setAttribute('aria-selected', on); b.setAttribute('aria-pressed', on); });
    $('#nameField').hidden = !up; $('#forgotBtn').hidden = up; $('#pwHint').hidden = !up;
    $('#authTitle').textContent = up ? 'Create your account' : 'Welcome back';
    $('#authLede').textContent = pendingJoin() ? (up ? 'Create an account to join the shared project you were invited to.' : 'Sign in to join the shared project you were invited to.')
      : up ? 'Start tracking your classes and deadlines.' : 'Sign in to see your tasks and deadlines.';
    $('#authSubmit').textContent = up ? 'Create account' : 'Sign in';
    $('#a-pass').setAttribute('autocomplete', up ? 'new-password' : 'current-password');
    $('#a-pass').placeholder = up ? 'At least 8 characters' : 'Your password';
    showErr('#authErr', '');
  }
  document.querySelectorAll('[data-auth-mode]').forEach(b => b.addEventListener('click', () => setAuthMode(b.dataset.authMode)));
  document.querySelectorAll('[data-showpw]').forEach(b => b.addEventListener('click', () => {
    const inp = document.getElementById(b.dataset.showpw), show = inp.type === 'password';
    inp.type = show ? 'text' : 'password'; b.textContent = show ? 'Hide' : 'Show'; b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  }));
  $('#authForm').addEventListener('submit', async e => {
    e.preventDefault();
    const up = authMode === 'signup', name = $('#a-name').value.trim(), email = $('#a-email').value.trim(), pass = $('#a-pass').value;
    const err = up && !name ? ['Enter your name.', '#a-name'] : !validEmail(email) ? ['Enter a valid email address, like you@school.edu.', '#a-email']
      : !pass ? ['Enter your password.', '#a-pass'] : up && pass.length < 8 ? ['Use a password with at least 8 characters.', '#a-pass'] : null;
    if (err) { showErr('#authErr', err[0]); $(err[1]).focus(); return; }
    showErr('#authErr', '');
    const res = await busy($('#authSubmit'), up ? 'Creating account…' : 'Signing in…', () =>
      up ? auth.signUp({email, password: pass, options:{data:{full_name: name}}}) : auth.signInWithPassword({email, password: pass}));
    if (res.error) { showErr('#authErr', res.error.message); return; }
    $('#a-pass').value = '';
    // With email confirmation on, sign-up returns no session until the link is clicked.
    if (up && !res.data.session) { showErr('#authErr', 'Check ' + email + ' for a confirmation link, then sign in.'); setAuthMode('signin'); $('#a-email').value = email; return; }
    toast(up ? 'Welcome, ' + name.split(' ')[0] + '!' : 'Signed in');
  });
  $('#forgotBtn').addEventListener('click', () => {
    $('#authPanel').hidden = true; $('#resetPanel').hidden = false;
    $('#r-email').value = $('#a-email').value; showErr('#resetErr', ''); $('#resetOk').hidden = true; $('#r-email').focus();
  });
  $('#backToSignin').addEventListener('click', () => { $('#resetPanel').hidden = true; $('#authPanel').hidden = false; $('#a-email').focus(); });
  $('#resetForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#r-email').value.trim();
    if (!validEmail(email)) { showErr('#resetErr', 'Enter a valid email address.'); $('#r-email').focus(); return; }
    showErr('#resetErr', '');
    const res = await busy($('#resetSubmit'), 'Sending…', () => auth.resetPasswordForEmail(email, {redirectTo: location.origin + location.pathname}));
    if (res.error) { showErr('#resetErr', res.error.message); return; }
    const ok = $('#resetOk'); ok.textContent = 'If an account exists for ' + email + ', a reset link is on its way. Open it in this browser.'; ok.hidden = false;
  });

  $('#profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#p-name').value.trim(), email = $('#p-email').value.trim(), school = $('#p-school').value.trim();
    if (!name) { showErr('#profileErr', 'Your display name can’t be empty.'); $('#p-name').focus(); return; }
    if (!validEmail(email)) { showErr('#profileErr', 'Enter a valid email address.'); $('#p-email').focus(); return; }
    showErr('#profileErr', '');
    const changedEmail = email.toLowerCase() !== session.user.email;
    const res = await busy($('#profileSave'), 'Saving…', () => auth.updateUser({email: changedEmail ? email : undefined, data:{full_name:name, school}}));
    if (res.error) { showErr('#profileErr', res.error.message); return; }
    toast(changedEmail ? 'Saved. Check your email to confirm the new address.' : 'Profile saved');
  });
  $('#pwForm').addEventListener('submit', async e => {
    e.preventDefault();
    const a = $('#pw-new').value, b = $('#pw-confirm').value;
    $('#pwOk').hidden = true;
    if (a.length < 8) { showErr('#pwErr', 'Use at least 8 characters.'); $('#pw-new').focus(); return; }
    if (a !== b) { showErr('#pwErr', 'The two passwords don’t match.'); $('#pw-confirm').focus(); return; }
    showErr('#pwErr', '');
    const res = await busy($('#pwSave'), 'Updating…', () => auth.updateUser({password: a}));
    if (res.error) { showErr('#pwErr', res.error.message); return; }
    $('#pw-new').value = ''; $('#pw-confirm').value = '';
    const ok = $('#pwOk'); ok.textContent = 'Password updated.'; ok.hidden = false;
  });
  $('#signOutBtn').addEventListener('click', async () => { await auth.signOut(); toast('Signed out'); });

  go((location.hash || '').slice(1));
  render();

  // Fires INITIAL_SESSION on load, then SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY, SIGNED_OUT.
  auth.onAuthStateChange((evt, s) => {
    session = s;
    // Deferred: supabase-js can deadlock if Supabase is queried inside this callback.
    setTimeout(() => {
      if (!s) { teardown(); setAuthMode('signin'); showAuth(true); return; }
      if (evt === 'USER_UPDATED') { renderAccount(); return; }
      enterApp();
      if (evt === 'PASSWORD_RECOVERY') { go('settings'); $('#pw-new').focus(); toast('Choose a new password'); }
    }, 0);
  });
})();
