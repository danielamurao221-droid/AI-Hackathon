// On-screen joystick and action button (touch + mouse). Arrow keys / WASD also work.
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { ui } from '../content/ui';
import { items, type ItemId } from '../content/adventure';
import { charNames } from '../content/ui';
import { useT } from '../lib/i18n';
import type { CharId } from '../types';
import { bus, input, type NearInfo } from './bus';

const R = 46; // knob travel radius in px

export function Joystick({ horizontalOnly }: { horizontalOnly?: boolean }) {
  const { t } = useT();
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);

  useEffect(
    () => () => {
      input.dx = 0;
      input.dy = 0;
    },
    [],
  );

  function move(e: RPointerEvent<HTMLDivElement>) {
    const r = baseRef.current!.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2);
    let y = horizontalOnly ? 0 : e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(x, y);
    if (len > R) {
      x = (x / len) * R;
      y = (y / len) * R;
    }
    setKnob({ x, y });
    input.dx = x / R;
    input.dy = y / R;
  }
  function end() {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    input.dx = 0;
    input.dy = 0;
  }

  return (
    <div
      ref={baseRef}
      className={`joystick ${horizontalOnly ? 'horizontal' : ''}`}
      role="application"
      aria-label={t(ui.move)}
      onPointerDown={(e) => {
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) move(e);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

export function ActionButton({ near }: { near: NearInfo | null }) {
  const { t } = useT();
  let label = '';
  let sub = '';
  if (near) {
    label = near.kind === 'talk' ? t(ui.talk) : near.kind === 'pick' ? t(ui.pickUp) : near.kind === 'race' ? t(ui.race) : near.kind === 'read' ? t(ui.read) : t(ui.look);
    if (near.kind === 'talk' && near.id in charNames) sub = t(charNames[near.id as CharId]);
    if (near.kind === 'pick') sub = t(items[near.id.slice(5) as ItemId].name);
  }
  return (
    <button
      type="button"
      className={`action-btn ${near ? 'ready' : ''}`}
      disabled={!near}
      onClick={() => bus.emit('action')}
      aria-label={near ? `${label}${sub ? `: ${sub}` : ''}` : t(ui.talk)}
      data-testid="action"
    >
      <span className="action-label">{near ? label : '•'}</span>
      {sub && <span className="action-sub">{sub}</span>}
    </button>
  );
}
