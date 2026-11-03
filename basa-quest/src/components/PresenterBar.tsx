// Small presenter control for demos. Not part of the real product.
import { useState } from 'react';
import { navigate, type Route } from '../lib/router';
import { loadSampleLearner, resetDemo } from '../lib/store';
import { IconClose, IconSliders } from './Icons';

export function PresenterBar({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // In-page confirmation (browser confirm() dialogs are blocked in some hosts).
  const [confirming, setConfirming] = useState(false);

  function flash(msg: string) {
    setNote(msg);
    window.setTimeout(() => setNote(null), 2200);
  }

  return (
    <div className={`presenter ${open ? 'open' : ''}`} lang="en">
      {open && (
        <div className="presenter-panel" role="dialog" aria-label="Presenter controls">
          <div className="presenter-title">
            <strong>Presenter</strong>
            <span className="tiny">Demo prototype: sample data only</span>
          </div>
          <div className="seg" role="group" aria-label="View">
            <button type="button" aria-pressed={route === 'student'} onClick={() => navigate('student')}>Student View</button>
            <button type="button" aria-pressed={route === 'teacher'} onClick={() => navigate('teacher')}>Teacher View</button>
          </div>
          <button
            type="button"
            className="btn btn-soft btn-block btn-sm"
            onClick={() => {
              loadSampleLearner();
              navigate('student');
              flash('Learner 07 loaded: levels 1–2 done');
            }}
          >
            Show sample learner (Learner 07)
          </button>
          {confirming ? (
            <div className="confirm-box" role="group" aria-label="Confirm reset">
              <p className="tiny">Clear all demo progress on this device?</p>
              <div className="row-btns">
                <button type="button" className="btn btn-ghost btn-sm grow" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm grow"
                  onClick={() => {
                    resetDemo();
                    setConfirming(false);
                    flash('Demo data reset');
                  }}
                >
                  Yes, reset
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost btn-block btn-sm" onClick={() => setConfirming(true)}>
              Reset demo data
            </button>
          )}
          {note && <p className="tiny presenter-note" role="status">{note}</p>}
        </div>
      )}
      <button
        type="button"
        className="presenter-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close presenter controls' : 'Open presenter controls'}
      >
        {open ? <IconClose size={20} /> : <IconSliders size={20} />}
        {open && <span>Demo</span>}
      </button>
    </div>
  );
}
