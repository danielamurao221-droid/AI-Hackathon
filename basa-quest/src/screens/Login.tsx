import { useState, type FormEvent } from 'react';
import { APP_NAME, CLASS_CODE } from '../config';
import { pictureNames, ui } from '../content/story';
import { LangSwitch, StorageNotice } from '../components/Common';
import { IconBack, IconBook, Picture } from '../components/Icons';
import { demoLearners, findLearner, PICTURES } from '../data/demoClass';
import { useT } from '../lib/i18n';
import { login } from '../lib/store';
import type { PicId } from '../types';

type Step = 'code' | 'learner' | 'pictures';

export function Login() {
  const { t } = useT();
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [picked, setPicked] = useState<PicId[]>([]);
  const [picError, setPicError] = useState(false);
  const learner = findLearner(learnerId);

  function submitCode(e: FormEvent) {
    e.preventDefault();
    if (code.trim().toUpperCase() === CLASS_CODE) {
      setCodeError(false);
      setStep('learner');
    } else {
      setCodeError(true);
    }
  }

  function tapPicture(id: PicId) {
    if (!learner || picked.includes(id)) return;
    const next = [...picked, id];
    setPicError(false);
    if (next.length < 2) {
      setPicked(next);
      return;
    }
    // Any order is accepted. Gentle retry on a mismatch.
    const ok = learner.pictures.every((p) => next.includes(p));
    if (ok) {
      login(learner.id);
    } else {
      setPicked([]);
      setPicError(true);
    }
  }

  return (
    <main className="screen login">
      <header className="topbar">
        {step !== 'code' ? (
          <button
            type="button"
            className="icon-btn"
            aria-label={t(ui.back)}
            onClick={() => {
              setPicked([]);
              setPicError(false);
              setStep(step === 'pictures' ? 'learner' : 'code');
            }}
          >
            <IconBack />
          </button>
        ) : (
          <span className="topbar-spacer" />
        )}
        <div className="topbar-title" />
        <LangSwitch />
      </header>

      <div className="brand">
        <span className="brand-mark"><IconBook size={30} /></span>
        <h1>{APP_NAME}</h1>
        <p>{t(ui.tagline)}</p>
      </div>

      {step === 'code' && (
        <form className="card stack" onSubmit={submitCode}>
          <label htmlFor="code" className="label-lg">{t(ui.enterCode)}</label>
          <input
            id="code"
            className="input code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            maxLength={12}
          />
          <p className="muted">{t(ui.codeHint)}</p>
          {codeError && <p className="gentle" role="alert">{t(ui.codeWrong)}</p>}
          <button className="btn btn-primary btn-block" type="submit">{t(ui.next)}</button>
        </form>
      )}

      {step === 'learner' && (
        <section className="stack">
          <h2 className="center">{t(ui.whoAreYou)}</h2>
          <div className="learner-grid">
            {demoLearners.map((l) => (
              <button
                key={l.id}
                type="button"
                className="learner-btn"
                onClick={() => {
                  setLearnerId(l.id);
                  setPicked([]);
                  setStep('pictures');
                }}
              >
                <span className="avatar" style={{ background: l.color }}>{l.name.slice(-2)}</span>
                <span>{l.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 'pictures' && learner && (
        <section className="stack">
          <div className="who">
            <span className="avatar avatar-lg" style={{ background: learner.color }}>{learner.name.slice(-2)}</span>
            <strong>{learner.name}</strong>
          </div>
          <h2 className="center">{t(ui.pickPictures)}</h2>
          <div className="pw-slots" aria-live="polite">
            {[0, 1].map((i) => (
              <span key={i} className={`pw-slot ${picked[i] ? 'filled' : ''}`}>
                {picked[i] ? <Picture id={picked[i]} size={40} /> : null}
              </span>
            ))}
          </div>
          {picError && <p className="gentle center" role="alert">{t(ui.pictureWrong)}</p>}
          <div className="pic-grid">
            {PICTURES.map((id) => (
              <button
                key={id}
                type="button"
                className={`pic-btn ${picked.includes(id) ? 'picked' : ''}`}
                onClick={() => tapPicture(id)}
                aria-label={t(pictureNames[id])}
              >
                <Picture id={id} />
                <span>{t(pictureNames[id])}</span>
              </button>
            ))}
          </div>
          <p className="demo-hint">
            {t(ui.demoPictures)} <strong>{t(pictureNames[learner.pictures[0]])}</strong> +{' '}
            <strong>{t(pictureNames[learner.pictures[1]])}</strong>
          </p>
        </section>
      )}
      <StorageNotice />
    </main>
  );
}
