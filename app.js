(function(){
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const short = s => s.length > 40 ? s.slice(0,40)+'…' : s;

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
  // Publishable key only: it is safe in the browser because row-level security limits every table to its owner.
  const SUPABASE_URL = 'https://rikvhwqwcoxrbzyakywy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_LJwiTker1KeALruRVXYWZg_4U7K2Dt8';
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {auth:{flowType:'pkce'}});

  let tasks = [], lists = null, mode = 'loading';
  let filter = 'active', groupBy = 'subject', picking = null, confirming = null, itemsPending = false;
  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} };
  const uid = () => crypto.randomUUID();
  const hash = s => { let h = 0; for (const c of s.toLowerCase()) h = (h*31 + c.charCodeAt(0)) >>> 0; return h; };
  const hashColor = s => hash(s) % 8 + 1;
  const DEFAULT_CATS = ['Assignment','Reading','Exam prep','Project'];
  const FIELD = {subjects:'subject', categories:'category'};

  // Stored list, plus any name still used by a task but missing from it.
  function listOf(kind){
    const base = lists && Array.isArray(lists[kind]) ? lists[kind]
      : kind === 'categories' ? DEFAULT_CATS.map(n => ({id:'d-'+hash(n), name:n, color:hashColor(n)})) : [];
    const seen = new Set(base.map(x => x.name.toLowerCase())), out = base.map(x => ({...x}));
    tasks.forEach(t => { const n = t[FIELD[kind]]; if (n && !seen.has(n.toLowerCase())) { seen.add(n.toLowerCase()); out.push({id:'d-'+hash(n), name:n, color:hashColor(n)}); } });
    return out;
  }
  function colorOf(kind, name){
    if (!name) return 'var(--faint)';
    const it = listOf(kind).find(x => x.name.toLowerCase() === name.toLowerCase());
    return 'var(--c'+(it ? it.color : hashColor(name))+')';
  }

  function samples(){
    const t = today(), d = n => iso(addDays(t,n));
    return [
      {name:'Problem set 5: integration by parts', subject:'Calculus', category:'Assignment', due:d(-1), importance:'high'},
      {name:'Read chapters 7–8, The Great Gatsby', subject:'English', category:'Reading', due:d(0), importance:'medium'},
      {name:'Lab report: acid–base titration', subject:'Chemistry', category:'Assignment', due:d(2), importance:'high'},
      {name:'Flashcards for unit 3 quiz', subject:'History', category:'Exam prep', due:d(1), importance:'low'},
      {name:'Group project outline', subject:'Economics', category:'Project', due:d(3), importance:'medium'},
      {name:'Midterm review sheet', subject:'Calculus', category:'Exam prep', due:d(4), importance:'high'},
      {name:'Discussion post: Federalist No. 10', subject:'History', category:'Assignment', due:d(3), importance:'medium'},
      {name:'Pre-lab questions', subject:'Chemistry', category:'Reading', due:d(5), importance:'low'},
      {name:'Essay draft: symbolism', subject:'English', category:'Assignment', due:d(9), importance:'high'},
      {name:'Vocabulary list 4', subject:'English', category:'Reading', due:d(-3), importance:'low', done:true},
    ].map(x => ({id:uid(), done:false, createdAt:Date.now(), example:true, ...x}));
  }

  // ---------- persistence (Supabase) ----------
  const toRow = t => ({id:t.id, user_id:session.user.id, name:t.name, subject:t.subject, category:t.category || '', due:t.due, importance:t.importance,
    done:!!t.done, done_at: t.doneAt ? new Date(t.doneAt).toISOString() : null, created_at: new Date(t.createdAt || Date.now()).toISOString(),
    snoozed_until: t.snoozedUntil || null, example:!!t.example});
  const fromRow = r => ({id:r.id, name:r.name, subject:r.subject, category:r.category || '', due:r.due, importance:r.importance, done:r.done,
    doneAt: r.done_at ? Date.parse(r.done_at) : null, createdAt: Date.parse(r.created_at), snoozedUntil: r.snoozed_until || '', ...(r.example ? {example:true} : {})});
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
    const {error} = await sb.from('user_settings').upsert({user_id, remind_days: L.remindDays || 3, prio_mode: L.prioMode || 'auto', prio_order: L.prioOrder || [],
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
  const materialize = () => ({subjects: listOf('subjects'), categories: listOf('categories'), remindDays: remindDays(),
    prioMode: pref('prioMode','auto'), prioOrder: pref('prioOrder',[]).slice(), taskMode: pref('taskMode','auto'), taskOrder: pref('taskOrder',[]).slice()});

  // ---------- manual order ----------
  // Ids in the saved order keep their place; anything not in it is slotted in where the automatic sort would put it.
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
  function taskLists(){
    const custom = pref('taskMode','auto') === 'custom', order = pref('taskOrder',[]), id = t => t.id;
    const act = tasks.filter(t => !t.done), done = tasks.filter(t => t.done);
    return custom ? [arrange(act, order, cmpDue, id), arrange(done, order, cmpDone, id)] : [act.sort(cmpDue), done.sort(cmpDone)];
  }
  function commitOrder(kind, ids){
    const L = materialize(), live = new Set(tasks.map(t => t.id));
    const key = kind === 'prio' ? 'prioOrder' : 'taskOrder';
    L[key] = [...ids, ...L[key].filter(x => !ids.includes(x) && live.has(x))];
    L[kind === 'prio' ? 'prioMode' : 'taskMode'] = 'custom';
    saveLists(L);
  }
  function setOrderMode(kind, m){
    const L = materialize();
    if (kind === 'prio') { L.prioMode = m; if (m === 'custom' && !L.prioOrder.length) L.prioOrder = rank(tasks).map(r => r.t.id); }
    else { L.taskMode = m; if (m === 'custom' && !L.taskOrder.length) L.taskOrder = taskLists().flat().map(t => t.id); }
    saveLists(L);
    toast(m === 'custom' ? 'Using your own order. Drag the handles to rearrange.' : (kind === 'prio' ? 'Back to automatic ranking' : 'Sorted by due date'));
  }

  // ---------- reminders ----------
  const remindDays = () => (lists && Number(lists.remindDays)) || 3;
  const whenText = n => n < -1 ? 'Overdue by '+(-n)+' days' : n === -1 ? 'Overdue by 1 day' : n === 0 ? 'Due today' : n === 1 ? 'Due tomorrow' : 'Due in '+n+' days';
  const tone = n => n < 0 ? 'crit' : n === 0 ? 'warn' : 'info';
  function reminders(){
    const L = remindDays(), td = iso(today());
    return tasks.filter(t => !t.done && daysUntil(t.due) <= L)
      .map(t => ({t, n:daysUntil(t.due), snoozed: !!(t.snoozedUntil && t.snoozedUntil > td)}))
      .sort((a,b) => a.n - b.n || (IMP[b.t.importance]||0) - (IMP[a.t.importance]||0));
  }
  function snooze(id, on){
    const t = tasks.find(x => x.id === id); if (!t) return;
    saveMany([{...t, snoozedUntil: on ? iso(addDays(today(),1)) : ''}]);
    if (on) { markSeen(id); toast('You’ll be reminded about “'+short(t.name)+'” tomorrow'); }
  }
  const SEEN = 'workload.seen.v1';
  function seenIds(){ const s = lsGet(SEEN); return s && s.date === iso(today()) && Array.isArray(s.ids) ? s.ids : []; }
  function markSeen(id){ const ids = seenIds(); if (!ids.includes(id)) ids.push(id); lsSet(SEEN, {date:iso(today()), ids}); popIds = popIds.filter(x => x !== id); }
  let popIds = [], poppedFor = null, panelOpen = false, lastFocus = null;
  function maybePop(){
    const td = iso(today()); if (poppedFor === td) return;
    poppedFor = td;
    const seen = seenIds();
    popIds = reminders().filter(r => !r.snoozed && !seen.includes(r.t.id)).map(r => r.t.id);
    renderPops();
  }
  const bellSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
  const xSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function renderAlerts(loading){
    const el = $('#alerts');
    if (loading) { el.innerHTML = '<span class="muted">Checking deadlines…</span>'; return; }
    const r = reminders(), L = remindDays();
    const over = r.filter(x => x.n < 0), tod = r.filter(x => x.n === 0), soon = r.filter(x => x.n > 0);
    const names = list => list.slice(0,2).map(x => x.t.name).join(', ') + (list.length > 2 ? ' +' + (list.length-2) : '');
    const pill = (cls, text) => '<button class="pill '+cls+'" data-open-rem="1" title="'+esc(text)+'"><i class="pdot"></i><span>'+esc(text)+'</span></button>';
    let h = '';
    if (over.length) h += pill('crit', over.length + ' overdue: ' + names(over));
    if (tod.length) h += pill('warn', tod.length + ' due today: ' + names(tod));
    if (soon.length) h += pill('info', soon.length + ' due in the next ' + L + (L === 1 ? ' day' : ' days') + ': ' + names(soon));
    if (!h) h = '<span class="pill okay"><i class="pdot"></i><span>No deadlines in the next '+L+(L === 1 ? ' day' : ' days')+'</span></span>';
    el.innerHTML = h;
    const live = r.filter(x => !x.snoozed).length, badge = $('#bellBadge'), bell = $('#bell');
    badge.hidden = !live; badge.textContent = live > 99 ? '99+' : live;
    bell.classList.toggle('has', live > 0);
    bell.setAttribute('aria-label', 'Reminders' + (live ? ', ' + live + ' need attention' : ''));
  }

  function remItem(x){
    const t = x.t;
    return '<div class="ritem"><button class="check" data-toggle="'+t.id+'" aria-label="Mark done: '+esc(t.name)+'">'+checkSvg+'</button>'
      + '<div class="t-main"><span class="t-name">'+esc(t.name)+'</span><div class="meta">'
      + '<span class="chip" style="--c:'+colorOf('subjects', t.subject)+'"><i class="dot"></i>'+esc(t.subject)+'</span>'
      + (t.category ? '<span class="cat">'+esc(t.category)+'</span>' : '')
      + '<span class="imp '+t.importance+'">'+t.importance+'</span></div>'
      + '<div class="r-actions">' + (x.snoozed
          ? '<button class="mini" data-unsnooze="'+t.id+'">Remind me today</button>'
          : '<button class="mini" data-snooze="'+t.id+'">Snooze until tomorrow</button>')
      + '</div></div></div>';
  }
  function renderPanel(){
    if (!panelOpen) return;
    const sel = $('#remDays'); if (document.activeElement !== sel) sel.value = String(remindDays());
    const r = reminders(), live = r.filter(x => !x.snoozed), L = remindDays();
    const groups = [
      ['crit', 'Overdue', live.filter(x => x.n < 0)],
      ['warn', 'Due today', live.filter(x => x.n === 0)],
      ['info', 'Due tomorrow', live.filter(x => x.n === 1)],
      ['info', 'Coming up', live.filter(x => x.n > 1)],
      ['okay', 'Snoozed until tomorrow', r.filter(x => x.snoozed)],
    ].filter(g => g[2].length);
    $('#remBody').innerHTML = groups.length ? groups.map(([cls, title, list]) =>
      '<div class="rgroup '+cls+'"><h3><i class="pdot"></i>'+title+' · '+list.length+'</h3>' + list.map(x => '<div class="'+cls+'">'+remItem(x)+'</div>').join('') + '</div>').join('')
      : '<div class="empty"><strong>You’re all clear</strong><span>Nothing is overdue or due in the next '+L+(L === 1 ? ' day' : ' days')+'.</span></div>';
  }
  function renderPops(){
    const td = iso(today());
    popIds = popIds.filter(id => { const t = tasks.find(x => x.id === id); return t && !t.done && !(t.snoozedUntil && t.snoozedUntil > td); });
    const shown = popIds.slice(0,3), more = popIds.length - shown.length;
    $('#pops').innerHTML = shown.map(id => {
      const t = tasks.find(x => x.id === id), n = daysUntil(t.due);
      return '<div class="pop '+tone(n)+'" role="alert"><span class="pop-ico">'+bellSvg+'</span>'
        + '<div class="t-main"><span class="pop-when">'+whenText(n)+'</span><span class="pop-name">'+esc(t.name)+'</span>'
        + '<div class="meta"><span class="chip" style="--c:'+colorOf('subjects', t.subject)+'"><i class="dot"></i>'+esc(t.subject)+'</span><span class="imp '+t.importance+'">'+t.importance+'</span></div>'
        + '<div class="r-actions"><button class="mini solid" data-pop-done="'+id+'">Mark done</button><button class="mini" data-snooze="'+id+'">Remind me tomorrow</button></div></div>'
        + '<button class="del" data-pop-dismiss="'+id+'" aria-label="Dismiss reminder for '+esc(t.name)+'">'+xSvg+'</button></div>';
    }).join('') + (more > 0 ? '<div class="pop info"><span class="pop-ico">'+bellSvg+'</span><div class="t-main"><span class="pop-name">'+more+' more '+(more === 1 ? 'reminder' : 'reminders')+'</span><div class="r-actions"><button class="mini solid" data-pop-all="1">View all</button><button class="mini" data-pop-clear="1">Dismiss all</button></div></div><span></span></div>' : '');
  }
  function openPanel(){
    panelOpen = true; lastFocus = document.activeElement;
    $('#scrim').hidden = false; $('#panel').hidden = false;
    renderPanel(); $('#panelTitle').focus();
  }
  function closePanel(){
    panelOpen = false; $('#scrim').hidden = true; $('#panel').hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function toggle(id){
    const t = tasks.find(x => x.id === id); if (!t) return;
    const n = {...t, done:!t.done, doneAt: t.done ? null : Date.now()};
    saveMany([n]);
    if (n.done) toast('Marked “'+short(n.name)+'” as done');
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
  function addItem(kind, name){
    name = name.trim(); if (!name) return false;
    const L = materialize();
    if (L[kind].some(x => x.name.toLowerCase() === name.toLowerCase())) { toast('“'+short(name)+'” is already in your list'); return false; }
    L[kind].push({id:uid(), name, color:hashColor(name)});
    saveLists(L); return true;
  }
  async function renameItem(kind, id, raw){
    const name = raw.trim(), L = materialize(), it = L[kind].find(x => x.id === id);
    if (!it || name === it.name) return renderItems();
    if (!name) { toast('A '+label(kind)+' needs a name'); return renderItems(); }
    if (L[kind].some(x => x !== it && x.name.toLowerCase() === name.toLowerCase())) { toast('“'+short(name)+'” already exists. Pick a different name.'); return renderItems(); }
    const old = it.name, f = FIELD[kind]; it.name = name;
    const changed = tasks.filter(t => t[f] === old).map(t => ({...t, [f]:name}));
    changed.forEach(upsertLocal);
    await saveLists(L); await saveMany(changed);
    toast('Renamed to “'+short(name)+'”' + (changed.length ? ' and updated '+changed.length+(changed.length === 1 ? ' task' : ' tasks') : ''));
  }
  function setColor(kind, id, c){ const L = materialize(), it = L[kind].find(x => x.id === id); if (!it) return; it.color = c; picking = null; saveLists(L); }
  async function deleteItem(kind, id, action){
    const L = materialize(), it = L[kind].find(x => x.id === id); if (!it) return;
    const f = FIELD[kind], used = tasks.filter(t => t[f] === it.name);
    L[kind] = L[kind].filter(x => x !== it); confirming = null;
    const moved = used.map(t => ({...t, [f]: action === '__clear' ? '' : action}));
    if (action === '__delete') tasks = tasks.filter(t => !used.includes(t)); else moved.forEach(upsertLocal);
    await saveLists(L);
    if (action === '__delete') { for (const t of used) await remove(t.id); }
    else if (used.length) await saveMany(moved);
    toast('Deleted “'+short(it.name)+'”');
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
    if (bootedFor !== me) return; // signed out while loading
    if (t.error || s.error || c.error || st.error) {
      toast('Could not load your tasks. Retrying…');
      setTimeout(() => { if (bootedFor === me) boot(); }, 5000);
      return;
    }
    tasks = t.data.map(fromRow);
    stored = {subjects:new Set(s.data.map(r => r.id)), categories:new Set(c.data.map(r => r.id))};
    // No saved settings yet means a new account: leave lists null so the default categories apply.
    const r = st.data;
    lists = r || s.data.length || c.data.length ? {subjects: toItems(s.data), categories: toItems(c.data),
      remindDays: r ? r.remind_days : 3, prioMode: r ? r.prio_mode : 'auto', prioOrder: r ? r.prio_order : [],
      taskMode: r ? r.task_mode : 'auto', taskOrder: r ? r.task_order : []} : null;
    mode = 'db'; render(); maybePop();
    // Keep tasks in sync with other tabs and devices. Delete events carry only the id, so they are not filtered by user.
    channel = sb.channel('tasks-' + me)
      .on('postgres_changes', {event:'*', schema:'public', table:'tasks'}, p => {
        if (p.eventType === 'DELETE') tasks = tasks.filter(x => x.id !== p.old.id);
        else if (p.new.user_id === me) upsertLocal(fromRow(p.new));
        render();
      })
      .subscribe();
  }
  function teardown(){
    if (channel) { sb.removeChannel(channel); channel = null; }
    bootedFor = null; tasks = []; lists = null; mode = 'loading';
    stored = {subjects:new Set(), categories:new Set()}; poppedFor = null; popIds = [];
    render();
  }

  // ---------- rendering ----------
  const checkSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>';
  const binSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';

  const gripSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
  const penSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  const gripBtn = t => '<button class="grip" data-grip="'+t.id+'" title="Drag to reorder, or click for move buttons" aria-expanded="'+!!(mover && mover.id === t.id)+'" aria-label="Reorder '+esc(t.name)+'. Drag, press the up and down arrow keys, or press Enter for move buttons.">'+gripSvg+'</button>';
  // Single-pointer alternative to dragging (WCAG 2.5.7): clicking a handle opens move buttons for that task.
  let mover = null;
  const moverHtml = (kind, t) => mover && mover.kind === kind && mover.id === t.id
    ? '<div class="mover" role="group" aria-label="Move '+esc(t.name)+'"><span>Move</span><button class="mini" data-move="up">↑ Up</button><button class="mini" data-move="down">↓ Down</button><button class="mini" data-move="top">To top</button><button class="mini" data-move="bottom">To bottom</button><button class="mini solid" data-move="close">Done</button></div>' : '';
  const editBtn = t => '<button class="del edit" data-edit="'+t.id+'" title="Edit" aria-label="Edit '+esc(t.name)+'">'+penSvg+'</button>';

  function rowHtml(t, opts={}){
    const due = dueLabel(t.due);
    const mv = opts.grip ? moverHtml('task', t) : '';
    return '<div class="row'+(t.done?' is-done':'')+(mv?' has-mover':'')+'" data-row-id="'+t.id+'">'
      + (opts.grip ? gripBtn(t) : '')
      + '<button class="check" data-toggle="'+t.id+'" aria-pressed="'+!!t.done+'" aria-label="'+(t.done?'Mark not done: ':'Mark done: ')+esc(t.name)+'">'+checkSvg+'</button>'
      + '<div class="t-main"><span class="t-name">'+esc(t.name)+'</span><div class="meta">'
      + '<span class="chip" style="--c:'+colorOf('subjects', t.subject)+'"><i class="dot"></i>'+esc(t.subject)+'</span>'
      + (t.category ? '<span class="cat">'+esc(t.category)+'</span>' : '')
      + '<span class="date '+(t.done?'':due.cls)+'">'+(t.done ? 'Done · '+esc(due.text.replace(/^Due /,'')) : esc(due.text))+'</span>'
      + '<span class="imp '+t.importance+'">'+t.importance+'</span>'
      + (t.example ? '<span class="tag">Example</span>' : '')
      + '</div></div>'
      + editBtn(t)
      + (opts.del ? '<button class="del" data-del="'+t.id+'" title="Delete" aria-label="Delete '+esc(t.name)+'">'+binSvg+'</button>' : '')
      + mv + '</div>';
  }

  function emptyHtml(title, text, withExamples){
    return '<div class="empty"><strong>'+title+'</strong><span>'+text+'</span>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="btn primary" data-go="tasks" data-focus="1">Add a task</button>'
      + (withExamples ? '<button class="btn" data-examples="1">Load example week</button>' : '') + '</div></div>';
  }

  function fillSelect(sel, items, kind){
    if (document.activeElement === sel) return;
    const prev = sel.value;
    const opts = (kind === 'categories' ? '<option value="">No category</option>' : '')
      + items.map(x => '<option value="'+esc(x.name)+'">'+esc(x.name)+'</option>').join('')
      + '<option value="__new">+ New '+label(kind)+'…</option>';
    sel.innerHTML = opts;
    const names = items.map(x => x.name);
    sel.value = prev && (prev === '__new' || prev === '' || names.includes(prev)) ? prev : (kind === 'subjects' ? (names[0] || '__new') : '');
    $('#'+sel.id+'-new').hidden = sel.value !== '__new';
  }

  function renderItems(){
    if (document.activeElement && document.activeElement.matches('[data-rename]')) { itemsPending = true; return; }
    itemsPending = false;
    ['subjects','categories'].forEach(kind => {
      const items = listOf(kind), f = FIELD[kind], el = $('#items-'+kind);
      if (!items.length) { el.innerHTML = '<div class="empty"><strong>No '+kind+' yet</strong><span>Add one below, or create one while adding a task.</span></div>'; return; }
      el.innerHTML = items.map(it => {
        const used = tasks.filter(t => t[f] === it.name), act = used.filter(t => !t.done).length;
        const isPick = picking && picking.kind === kind && picking.id === it.id;
        const isConf = confirming && confirming.kind === kind && confirming.id === it.id;
        let h = '<div class="item-wrap" data-kind="'+kind+'" data-id="'+it.id+'"><div class="item">'
          + '<button class="swatch" style="--c:var(--c'+it.color+')" data-pick="1" aria-expanded="'+!!isPick+'" aria-label="Change color for '+esc(it.name)+'"></button>'
          + '<input class="item-name" id="ren-'+kind+'-'+it.id+'" value="'+esc(it.name)+'" maxlength="40" data-rename="1" aria-label="Rename '+esc(it.name)+'">'
          + '<span class="item-count">'+(used.length ? act+' active · '+(used.length-act)+' done' : 'No tasks')+'</span>'
          + '<button class="del" data-delitem="1" aria-label="Delete '+esc(it.name)+'">'+binSvg+'</button></div>';
        if (isPick) h += '<div class="palette" role="group" aria-label="Colors">' + [1,2,3,4,5,6,7,8].map(c => '<button style="--c:var(--c'+c+')" data-color="'+c+'" aria-pressed="'+(c === it.color)+'" aria-label="Color '+c+'"></button>').join('') + '</div>';
        if (isConf) {
          const others = items.filter(x => x !== it);
          const opts = (kind === 'categories' ? '<option value="__clear">Leave them with no category</option>' : '')
            + others.map(x => '<option value="'+esc(x.name)+'">Move them to '+esc(x.name)+'</option>').join('')
            + '<option value="__delete">Delete those tasks too</option>';
          h += '<div class="confirm"><span>Delete <b>'+esc(it.name)+'</b>? '+used.length+(used.length === 1 ? ' task uses' : ' tasks use')+' it.</span>'
            + '<div class="confirm-row"><select id="mv-'+kind+'-'+it.id+'" aria-label="What to do with its tasks">'+opts+'</select>'
            + '<button class="btn danger" data-confirmdel="1">Delete</button><button class="btn ghost" data-canceldel="1">Cancel</button></div></div>';
        }
        return h + '</div>';
      }).join('');
    });
  }

  let drag = null, renderPending = false;
  function render(){
    if (drag) { renderPending = true; return; }
    renderPending = false;
    const t0 = today(), [mon, sun] = weekBounds();
    $('#sideDate').textContent = fmt(t0, {weekday:'long', month:'short', day:'numeric'});
    $('#sideWeek').textContent = 'Week ' + isoWeek(t0) + ' of ' + t0.getFullYear();

    const active = tasks.filter(t => !t.done);
    const dueToday = active.filter(t => daysUntil(t.due) === 0);
    const overdue = active.filter(t => daysUntil(t.due) < 0);
    $('#navCount').textContent = active.length;
    const loading = mode === 'loading' || mode === 'db-wait';
    const none = !loading && tasks.length === 0;

    const b = $('#banner');
    if (tasks.some(t => t.example)) { b.hidden = false; b.innerHTML = '<span>Showing example tasks so you can see how it works. Your own tasks appear alongside them.</span><button class="btn" data-clear-ex="1">Remove examples</button>'; }
    else b.hidden = true;

    // stats
    const stat = (lab, num, note, cls) => '<div class="card stat '+cls+'"><span class="label">'+lab+'</span><span class="num">'+(loading?'–':num)+'</span><span class="note">'+note+'</span></div>';
    $('#stats').innerHTML =
      stat('Remaining', active.length, active.length === 1 ? 'active task' : 'active tasks', '') +
      stat('Due today', dueToday.length, dueToday.length ? dueToday.slice(0,2).map(t=>esc(t.subject)).join(', ') : 'Nothing due today', dueToday.length ? 'is-warn' : '') +
      stat('Overdue', overdue.length, overdue.length ? 'Past due and not done' : 'All caught up', overdue.length ? 'is-crit' : '');
    $('#dashSub').textContent = loading ? 'Loading your tasks…' : overdue.length ? overdue.length + ' overdue. Start with the Priorities list.' : dueToday.length ? dueToday.length + ' due today.' : 'Nothing urgent. Good time to get ahead.';

    // weekly breakdown
    const kind = groupBy === 'subject' ? 'subjects' : 'categories';
    $('#breakTitle').textContent = 'This week by ' + groupBy;
    $('#weekRange').textContent = 'Due ' + fmt(mon,{weekday:'short', month:'short', day:'numeric'}) + ' – ' + fmt(sun,{weekday:'short', month:'short', day:'numeric'});
    const inWeek = tasks.filter(t => { const d = parse(t.due); return d >= mon && d <= sun; });
    const by = {};
    inWeek.forEach(t => { const k = t[groupBy] || ''; by[k] = by[k] || {left:0, done:0}; by[k][t.done?'done':'left']++; });
    const rows = Object.entries(by).sort((a,b) => (b[1].left+b[1].done) - (a[1].left+a[1].done) || a[0].localeCompare(b[0]));
    const max = Math.max(1, ...rows.map(r => r[1].left + r[1].done));
    $('#bars').innerHTML = loading ? '<p class="muted">Loading…</p>' : rows.length
      ? '<div class="bars">' + rows.map(([s, c]) => { const nm = s || 'No category'; return '<div class="bar-row" style="--c:'+colorOf(kind, s)+'"><span class="bar-name"><i class="dot"></i><span>'+esc(nm)+'</span></span>'
          + '<div class="track" role="img" aria-label="'+esc(nm)+': '+c.left+' left, '+c.done+' done"><i class="left" style="width:'+(c.left/max*100)+'%"></i><i class="done" style="width:'+(c.done/max*100)+'%"></i></div>'
          + '<span class="bar-num"><b>'+c.left+'</b> left'+(c.done?' · '+c.done+' done':'')+'</span></div>'; }).join('') + '</div>'
          + '<div class="legend"><span><i></i>Still to do</span><span><i class="l2"></i>Done</span></div>'
      : (none ? emptyHtml('No tasks yet', 'Add your first assignment to see this week broken down.', true) : '<div class="empty"><strong>Nothing due this week</strong><span>Tasks due between Monday and Sunday show up here.</span></div>');

    // up next
    const ranked = prioList();
    $('#upnext').innerHTML = loading ? '<p class="muted">Loading…</p>' : ranked.length
      ? ranked.slice(0,4).map(r => rowHtml(r.t)).join('')
      : (none ? emptyHtml('Your list is clear', 'Tasks you add are ranked here automatically.', false) : '<div class="empty"><strong>All done</strong><span>Every task is checked off.</span></div>');

    // tasks
    fillSelect($('#f-subject'), listOf('subjects'), 'subjects');
    fillSelect($('#f-category'), listOf('categories'), 'categories');
    const [actList, doneList] = taskLists();
    const shown = filter === 'active' ? actList : filter === 'done' ? doneList : actList.concat(doneList);
    $('#taskSub').textContent = active.length + ' active · ' + (tasks.length - active.length) + ' done';
    const taskCustom = pref('taskMode','auto') === 'custom';
    $('#taskHint').innerHTML = taskCustom
      ? 'In your own order. <button class="link" data-order-mode="task:auto">Sort by due date</button>'
      : 'Sorted by due date. Drag a handle to set your own order.';
    $('#taskList').innerHTML = loading ? '<p class="muted">Loading…</p>' : shown.length ? shown.map(t => rowHtml(t, {del:true, grip:true})).join('')
      : none ? '<div class="empty"><strong>No tasks yet</strong><span>Use the form to add one, or load an example week to explore.</span><button class="btn" data-examples="1">Load example week</button></div>'
      : '<div class="empty"><strong>'+(filter === 'done' ? 'Nothing finished yet' : 'No active tasks')+'</strong><span>'+(filter === 'done' ? 'Tick a task to move it here.' : 'Everything is done. Nice work.')+'</span></div>';

    // priorities
    const prioCustom = pref('prioMode','auto') === 'custom';
    $('#prioReset').hidden = !prioCustom;
    $('#prioHint').textContent = prioCustom
      ? 'Showing your own order. New tasks are slotted in by urgency.'
      : 'Ranked automatically. Drag a task by its handle to override the ranking.';
    $('#prioList').innerHTML = loading ? '<p class="muted">Loading…</p>' : ranked.length ? ranked.map((r, i) =>
      '<div class="p-row t-'+r.tier[0]+(moverHtml('prio', r.t)?' has-mover':'')+'" data-row-id="'+r.t.id+'">'+gripBtn(r.t)+'<span class="rank">'+(i+1)+'</span>'
      + '<button class="check" data-toggle="'+r.t.id+'" aria-label="Mark done: '+esc(r.t.name)+'">'+checkSvg+'</button>'
      + '<div class="t-main"><span class="t-name">'+esc(r.t.name)+(r.t.example?' <span class="tag">Example</span>':'')+'</span>'
      + '<div class="meta"><span class="chip" style="--c:'+colorOf('subjects', r.t.subject)+'"><i class="dot"></i>'+esc(r.t.subject)+'</span>'
      + (r.t.category ? '<span class="cat">'+esc(r.t.category)+'</span>' : '')
      + '<span class="reason"><b>'+r.when+'</b>, '+r.t.importance+' importance</span></div></div>'
      + '<span class="tier">'+r.tier[1]+'</span>'+editBtn(r.t)+moverHtml('prio', r.t)+'</div>').join('')
      : '<div class="card">'+(none ? emptyHtml('Nothing to rank yet', 'Add tasks and they will be ordered here by urgency and importance.', true) : '<div class="empty"><strong>All caught up</strong><span>No active tasks left to rank.</span></div>')+'</div>';

    renderItems();
    renderAlerts(loading);
    const setSel = $('#setRemDays'); if (document.activeElement !== setSel) setSel.value = String(remindDays());
    renderPanel();
    renderPops();
  }

  // ---------- navigation ----------
  const VIEWS = ['dashboard','tasks','priorities','subjects','settings'];
  function go(v, focus){
    if (!VIEWS.includes(v)) v = 'dashboard';
    document.querySelectorAll('.view').forEach(s => s.hidden = s.id !== 'v-'+v);
    const sec = document.getElementById('v-'+v); sec.classList.add('enter'); clearTimeout(go.t); go.t = setTimeout(() => sec.classList.remove('enter'), 700);
    if (mover) { mover = null; render(); }
    document.querySelectorAll('.nav button, .me').forEach(b => { if (b.dataset.view === v) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
    try { history.replaceState(null, '', '#'+v); } catch(e) {}
    window.scrollTo(0,0);
    if (focus) setTimeout(() => $('#f-name').focus(), 30);
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('button'); if (!el) return;
    const wrap = el.closest('.item-wrap'), kind = wrap && wrap.dataset.kind, id = wrap && wrap.dataset.id;
    if (el.dataset.view) go(el.dataset.view);
    else if (el.dataset.go) go(el.dataset.go, el.dataset.focus);
    else if (el.dataset.toggle) toggle(el.dataset.toggle);
    else if (el.dataset.del) { const t = tasks.find(x => x.id === el.dataset.del); remove(el.dataset.del); if (t) toast('Deleted “'+short(t.name)+'”'); }
    else if (el.dataset.examples) loadExamples();
    else if (el.dataset.clearEx) clearExamples();
    else if (el.dataset.filter) { filter = el.dataset.filter; document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', b === el)); render(); }
    else if (el.dataset.group) { groupBy = el.dataset.group; document.querySelectorAll('[data-group]').forEach(b => b.setAttribute('aria-pressed', b === el)); render(); }
    else if (el.dataset.pick) { picking = picking && picking.id === id && picking.kind === kind ? null : {kind, id}; confirming = null; renderItems(); }
    else if (el.dataset.color) setColor(kind, id, Number(el.dataset.color));
    else if (el.dataset.delitem) {
      const it = listOf(kind).find(x => x.id === id); if (!it) return;
      if (!tasks.some(t => t[FIELD[kind]] === it.name)) deleteItem(kind, id, '');
      else { confirming = {kind, id}; picking = null; renderItems(); }
    }
    else if (el.dataset.confirmdel) deleteItem(kind, id, $('#mv-'+kind+'-'+id).value);
    else if (el.dataset.canceldel) { confirming = null; renderItems(); }
    else if (el.dataset.grip) {
      if (justDragged) return;
      const kind = el.closest('[data-reorder]').dataset.reorder, id = el.dataset.grip;
      mover = mover && mover.id === id && mover.kind === kind ? null : {kind, id};
      render();
      const first = document.querySelector('.mover [data-move="up"]'); if (first) first.focus();
    }
    else if (el.dataset.move) {
      const m = mover; if (!m) return;
      if (el.dataset.move === 'close') { mover = null; render(); const g = document.querySelector('[data-reorder="'+m.kind+'"] [data-grip="'+m.id+'"]'); if (g) g.focus(); return; }
      if (!moveTask(m.kind, m.id, el.dataset.move)) { toast(el.dataset.move === 'up' || el.dataset.move === 'top' ? 'Already at the top' : 'Already at the bottom'); return; }
      const again = document.querySelector('.mover [data-move="'+el.dataset.move+'"]'); if (again) again.focus();
    }
    else if (el.dataset.edit) openEdit(el.dataset.edit);
    else if (el.dataset.closeEdit) closeEdit();
    else if (el.dataset.editDel) editDelete(el.dataset.editDel);
    else if (el.dataset.orderMode) { const [k, m] = el.dataset.orderMode.split(':'); if (pref(k === 'prio' ? 'prioMode' : 'taskMode', 'auto') !== m) setOrderMode(k, m); }
    else if (el.dataset.openRem) openPanel();
    else if (el.dataset.closeRem) closePanel();
    else if (el.dataset.snooze) snooze(el.dataset.snooze, true);
    else if (el.dataset.unsnooze) snooze(el.dataset.unsnooze, false);
    else if (el.dataset.popDone) { markSeen(el.dataset.popDone); toggle(el.dataset.popDone); }
    else if (el.dataset.popDismiss) { markSeen(el.dataset.popDismiss); renderPops(); }
    else if (el.dataset.popAll) { popIds.slice().forEach(markSeen); renderPops(); openPanel(); }
    else if (el.dataset.popClear) { popIds.slice().forEach(markSeen); renderPops(); }
  });
  $('#scrim').addEventListener('click', closePanel);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#editModal').hidden) closeEdit(); else if (panelOpen) closePanel();
  });

  // ---------- drag to reorder ----------
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
    const bottomEdge = innerHeight - (innerWidth <= 760 ? 110 : 60);
    if (y < 70) scrollBy(0, -12); else if (y > bottomEdge) scrollBy(0, 12);
  });
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

  // ---------- edit dialog ----------
  let editing = null, editReturn = null;
  function openEdit(id){
    const t = tasks.find(x => x.id === id); if (!t) return;
    editing = id; editReturn = document.activeElement;
    $('#e-name').value = t.name; $('#e-due').value = t.due; $('#e-done').checked = !!t.done;
    fillSelect($('#e-subject'), listOf('subjects'), 'subjects'); $('#e-subject').value = t.subject; $('#e-subject-new').hidden = true;
    fillSelect($('#e-category'), listOf('categories'), 'categories'); $('#e-category').value = t.category || ''; $('#e-category-new').hidden = true;
    const r = document.getElementById('eimp-' + (t.importance || 'medium')); if (r) r.checked = true;
    editDelete('reset'); showErr('#editErr', '');
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
  ['e-subject','e-category'].forEach(id => $('#'+id).addEventListener('change', e => {
    const nw = $('#'+id+'-new'); nw.hidden = e.target.value !== '__new'; if (!nw.hidden) nw.focus();
  }));
  $('#editForm').addEventListener('submit', e => {
    e.preventDefault();
    const t = tasks.find(x => x.id === editing); if (!t) return closeEdit();
    const sSel = $('#e-subject').value, cSel = $('#e-category').value;
    const name = $('#e-name').value.trim(), due = $('#e-due').value;
    let subject = sSel === '__new' ? $('#e-subject-new').value.trim() : sSel;
    let category = cSel === '__new' ? $('#e-category-new').value.trim() : cSel;
    const err = !name ? ['Give the task a name.', '#e-name'] : !subject ? ['Choose a subject, or add a new one.', sSel === '__new' ? '#e-subject-new' : '#e-subject']
      : (cSel === '__new' && !category) ? ['Type a name for the new category, or pick an existing one.', '#e-category-new'] : !due ? ['Pick a due date.', '#e-due'] : null;
    if (err) { showErr('#editErr', err[0]); $(err[1]).focus(); return; }
    const L = materialize(); let listChanged = false;
    [['subjects', subject], ['categories', category]].forEach(([k, v]) => {
      if (!v) return;
      const hit = L[k].find(x => x.name.toLowerCase() === v.toLowerCase());
      if (hit) { if (k === 'subjects') subject = hit.name; else category = hit.name; }
      else { L[k].push({id:uid(), name:v, color:hashColor(v)}); listChanged = true; }
    });
    if (listChanged) saveLists(L);
    const done = $('#e-done').checked;
    const importance = (document.querySelector('input[name="eimp"]:checked')||{}).value || 'medium';
    saveMany([{...t, name, subject, category: category || '', due, importance, done, doneAt: done ? (t.doneAt || Date.now()) : null}]);
    closeEdit();
    toast('Saved changes to “'+short(name)+'”');
  });
  document.querySelectorAll('.rem-select').forEach(s => s.addEventListener('change', e => { saveLists({...materialize(), remindDays: Number(e.target.value)}); toast('Reminders now cover the next '+e.target.value+(e.target.value === '1' ? ' day' : ' days')); }));

  // Re-check when the date rolls over or the tab comes back into view.
  let lastDay = iso(today());
  function dayCheck(){ const td = iso(today()); if (td !== lastDay) { lastDay = td; render(); if (mode === 'db') maybePop(); } }
  setInterval(dayCheck, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) dayCheck(); });

  const subjView = $('#v-subjects');
  subjView.addEventListener('change', e => {
    if (e.target.matches('[data-rename]')) { const w = e.target.closest('.item-wrap'); renameItem(w.dataset.kind, w.dataset.id, e.target.value); }
  });
  subjView.addEventListener('keydown', e => {
    if (!e.target.matches('[data-rename]')) return;
    if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    if (e.key === 'Escape') { e.target.value = e.target.defaultValue; e.target.blur(); }
  });
  subjView.addEventListener('focusout', () => setTimeout(() => { if (itemsPending) renderItems(); }, 0));
  document.querySelectorAll('.add-item').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const input = f.querySelector('input');
    if (addItem(f.dataset.kind, input.value)) { toast('Added “'+short(input.value.trim())+'”'); input.value = ''; }
    input.focus();
  }));

  ['f-subject','f-category'].forEach(id => $('#'+id).addEventListener('change', e => {
    const nw = $('#'+id+'-new'); nw.hidden = e.target.value !== '__new'; if (!nw.hidden) nw.focus();
  }));

  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    const sSel = $('#f-subject').value, cSel = $('#f-category').value;
    const name = $('#f-name').value.trim(), due = $('#f-due').value;
    let subject = sSel === '__new' ? $('#f-subject-new').value.trim() : sSel;
    let category = cSel === '__new' ? $('#f-category-new').value.trim() : cSel;
    const importance = (document.querySelector('input[name="imp"]:checked')||{}).value || 'medium';
    const err = !name ? 'Give the task a name.' : !subject ? 'Choose a subject, or add a new one.' : (cSel === '__new' && !category) ? 'Type a name for the new category, or pick an existing one.' : !due ? 'Pick a due date.' : '';
    const fe = $('#formErr');
    if (err) { fe.textContent = err; fe.hidden = false; (!name ? $('#f-name') : !subject ? (sSel === '__new' ? $('#f-subject-new') : $('#f-subject')) : (cSel === '__new' && !category) ? $('#f-category-new') : $('#f-due')).focus(); return; }
    fe.hidden = true;
    // Reuse existing spelling; add genuinely new names to the managed lists.
    const L = materialize(); let listChanged = false;
    [['subjects', subject], ['categories', category]].forEach(([k, v]) => {
      if (!v) return;
      const hit = L[k].find(x => x.name.toLowerCase() === v.toLowerCase());
      if (hit) { if (k === 'subjects') subject = hit.name; else category = hit.name; }
      else { L[k].push({id:uid(), name:v, color:hashColor(v)}); listChanged = true; }
    });
    if (listChanged) saveLists(L);
    const t = {id:uid(), name, subject, category: category || '', due, importance, done:false, createdAt:Date.now()};
    saveMany([t]);
    if (sSel === '__new') { $('#f-subject-new').value = ''; $('#f-subject').value = subject; $('#f-subject-new').hidden = true; }
    if (cSel === '__new') { $('#f-category-new').value = ''; $('#f-category').value = category; $('#f-category-new').hidden = true; }
    $('#f-name').value = ''; $('#f-name').focus();
    toast('Added “'+short(name)+'”');
  });

  let toastTimer;
  function toast(msg){ const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, 2600); }

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

  function showAuth(on){ $('#auth').hidden = !on; $('.app').hidden = on; $('#pops').hidden = on; if (on) { closePanel(); setTimeout(() => $('#a-email').focus(), 30); } }
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
    $('#authLede').textContent = up ? 'Start tracking your classes and deadlines.' : 'Sign in to see your tasks and deadlines.';
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

  $('#f-due').value = iso(addDays(today(), 2));
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
