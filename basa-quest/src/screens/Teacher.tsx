// Teacher dashboard (/teacher). English only. Demo data only.
import { useEffect, useMemo, useState } from 'react';
import { APP_NAME, PLAYABLE_LEVELS } from '../config';
import { DemoBadge, Stars } from '../components/Common';
import { IconClose, IconSearch } from '../components/Icons';
import { skillNames, skillTips } from '../data/demoClass';
import { buildRows, levelLabel, NEED_CUTOFF, pct, SKILLS, timeAgo, type Row } from '../lib/classData';
import { setBand, setReviewed, useAppState } from '../lib/store';
import type { Skill } from '../types';

function SkillChip({ skill }: { skill: Skill | null }) {
  if (!skill) return <span className="chip chip-ok">On track</span>;
  return <span className={`chip chip-${skill}`}>{skillNames[skill]}</span>;
}

export function Teacher() {
  const s = useAppState();
  const rows = useMemo(() => buildRows(s), [s]);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const open = rows.find((r) => r.learner.id === openId) ?? null;

  useEffect(() => {
    document.title = `${APP_NAME} · Teacher`;
    return () => {
      document.title = APP_NAME;
    };
  }, []);

  const needing = rows.filter((r) => r.needScore >= NEED_CUTOFF);
  const helpList = needing.filter((r) => !r.reviewedAt).sort((a, b) => b.needScore - a.needScore).slice(0, 5);
  const reviewedCount = needing.filter((r) => r.reviewedAt).length;
  const practiced = rows.filter((r) => r.sessionsThisWeek > 0).length;
  const avgSessions = rows.reduce((n, r) => n + r.sessionsThisWeek, 0) / rows.length;
  const skillCounts = SKILLS.map((sk) => ({ sk, n: rows.filter((r) => r.helpSkill === sk).length }));
  const topSkill = [...skillCounts].sort((a, b) => b.n - a.n)[0];

  const q = query.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      !q ||
      r.learner.name.toLowerCase().includes(q) ||
      r.learner.demoId.toLowerCase().includes(q) ||
      (r.helpSkill && skillNames[r.helpSkill].toLowerCase().includes(q)),
  );

  return (
    <main className="screen teacher" lang="en">
      <header className="t-header">
        <div>
          <h1>{APP_NAME} · Teacher view</h1>
          <p className="muted">Grade 3 · Demo class (DEMO123) · 30 learners</p>
        </div>
        <DemoBadge />
      </header>

      {/* 1. Class summary */}
      <section className="t-section" aria-labelledby="sum-h">
        <h2 id="sum-h">This week at a glance</h2>
        <div className="summary-grid">
          <div className="stat"><b>{practiced}/30</b><span>practiced this week</span></div>
          <div className="stat"><b>{avgSessions.toFixed(1)}</b><span>avg. sessions per learner (goal 2–3)</span></div>
          <div className="stat"><b>{needing.length}</b><span>may need extra help</span></div>
          <div className="stat"><b>{topSkill.n > 0 ? skillNames[topSkill.sk] : '—'}</b><span>most common need</span></div>
        </div>
        <p className="t-summary">
          Most learners are practicing. Start with the 5 learners below, then check
          “{topSkill.n > 0 ? skillNames[topSkill.sk] : 'the full list'}” as a small-group focus during ARAL time.
        </p>
        <div className="skill-bars" aria-label="Learners needing help, by skill">
          {skillCounts.map(({ sk, n }) => (
            <div key={sk} className="skill-bar">
              <span className="skill-bar-label">{skillNames[sk]}</span>
              <span className="skill-bar-track"><span className={`skill-bar-fill fill-${sk}`} style={{ width: `${(n / 30) * 100}%` }} /></span>
              <span className="skill-bar-n">{n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2 + 3. Needs help this week */}
      <section className="t-section" aria-labelledby="help-h">
        <h2 id="help-h">Needs help this week</h2>
        <p className="muted">Top 5, based on first-try answers, sessions and last activity.{reviewedCount > 0 && ` ${reviewedCount} already reviewed.`}</p>
        {helpList.length === 0 && <p className="card">Everyone on the list has been reviewed. 🎉</p>}
        <ol className="help-list">
          {helpList.map((r) => (
            <li key={r.learner.id} className="help-card">
              <button type="button" className="help-main" onClick={() => setOpenId(r.learner.id)}>
                <span className="avatar" style={{ background: r.learner.color }}>{r.learner.name.slice(-2)}</span>
                <span className="help-text">
                  <strong>{r.learner.name}</strong>
                  <span className="muted tiny">{r.reasons[0] ?? 'Check in this week'}</span>
                </span>
                <SkillChip skill={r.helpSkill} />
              </button>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => setReviewed(r.learner.id, true)}>
                Mark as reviewed
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* All learners */}
      <section className="t-section" aria-labelledby="all-h">
        <h2 id="all-h">All learners</h2>
        <label className="search">
          <IconSearch />
          <input
            type="search"
            placeholder="Search learner, DEMO ID or skill"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search learners"
          />
        </label>
        <div className="table">
          <div className="tr th" aria-hidden="true">
            <span>Learner</span>
            <span>Sessions this week</span>
            <span>Current level</span>
            <span>Band</span>
            <span>Last activity</span>
            <span>Needs help with</span>
          </div>
          {filtered.map((r) => (
            <button key={r.learner.id} type="button" className={`tr ${r.live ? 'is-live' : ''}`} onClick={() => setOpenId(r.learner.id)}>
              <span className="td-name">
                <span className="avatar avatar-sm" style={{ background: r.learner.color }}>{r.learner.name.slice(-2)}</span>
                <span>
                  <strong>{r.learner.name}</strong>
                  {r.reviewedAt && <span className="tag">Reviewed</span>}
                  {r.live && <span className="tag tag-live">Played on this device</span>}
                </span>
              </span>
              <span data-label="Sessions">{r.sessionsThisWeek}</span>
              <span data-label="Level">{levelLabel(r)}</span>
              <span data-label="Band">Band {r.band}</span>
              <span data-label="Last">{timeAgo(r.lastActivity)}</span>
              <span data-label="Help"><SkillChip skill={r.helpSkill} /></span>
            </button>
          ))}
          {filtered.length === 0 && <p className="muted pad">No learners match “{query}”.</p>}
        </div>
      </section>

      <footer className="t-foot muted tiny">
        Band A = shorter text, Band B = longer text. Learners never see their band. Word reading comes from the
        teacher’s read-aloud check (demo numbers); the other skills come from first-try answers in the app.
      </footer>

      {open && <Detail row={open} onClose={() => setOpenId(null)} />}
    </main>
  );
}

function Detail({ row: r, onClose }: { row: Row; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-h" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="avatar avatar-lg" style={{ background: r.learner.color }}>{r.learner.name.slice(-2)}</span>
          <div className="grow">
            <h2 id="detail-h">{r.learner.name}</h2>
            <p className="muted tiny">{r.learner.demoId} · fictional learner</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>
        <DemoBadge />

        <dl className="facts">
          <div><dt>Current level</dt><dd>{levelLabel(r)}</dd></div>
          <div><dt>Sessions this week</dt><dd>{r.sessionsThisWeek}</dd></div>
          <div><dt>Last activity</dt><dd>{timeAgo(r.lastActivity)}</dd></div>
          <div><dt>Stars</dt><dd>{r.stars} / {PLAYABLE_LEVELS * 3}</dd></div>
        </dl>

        <h3>Levels</h3>
        <ul className="lvl-stars">
          {r.starsByLevel.map((n, i) => (
            <li key={i}><span>Level {i + 1}</span><Stars count={n} size={18} /></li>
          ))}
        </ul>

        <h3>Skills (right on first try)</h3>
        <ul className="skill-detail">
          {SKILLS.map((sk) => (
            <li key={sk} className={r.helpSkill === sk ? 'weak' : ''}>
              <span>{skillNames[sk]}</span>
              <span className="skill-bar-track"><span className={`skill-bar-fill fill-${sk}`} style={{ width: pct(r.accuracy[sk]) }} /></span>
              <span>{pct(r.accuracy[sk])}</span>
            </li>
          ))}
        </ul>

        <div className="card soft">
          <strong>{r.helpSkill ? `Focus: ${skillNames[r.helpSkill]}` : 'On track'}</strong>
          <p>{r.helpSkill ? skillTips[r.helpSkill] : 'Keep 2–3 short sessions a week. Praise effort and good reasons.'}</p>
          {r.reasons.length > 0 && (
            <ul className="reasons">
              {r.reasons.map((x) => <li key={x}>{x}</li>)}
            </ul>
          )}
        </div>

        <h3>Reading band</h3>
        <div className="band-switch" role="group" aria-label="Reading band">
          {(['A', 'B'] as const).map((b) => (
            <button key={b} type="button" aria-pressed={r.band === b} onClick={() => setBand(r.learner.id, b)}>
              Band {b} <span className="tiny">({b === 'A' ? 'shorter text' : 'longer text'})</span>
            </button>
          ))}
        </div>

        <div className="modal-actions">
          {r.reviewedAt ? (
            <button type="button" className="btn btn-soft btn-block" onClick={() => setReviewed(r.learner.id, false)}>
              Reviewed {timeAgo(r.reviewedAt)} · Undo
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-block" onClick={() => setReviewed(r.learner.id, true)}>
              Mark as reviewed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
