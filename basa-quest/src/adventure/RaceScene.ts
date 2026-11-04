// Kite Day race: steer the kite, avoid birds and gusts, fly through the right word gate for a
// boost. Upgrades decide the race:
//   - Without Long String the string runs out at STRING_LIMIT metres (the kite cannot win).
//   - With Long String (and Strong Frame + Better Balance from the earlier quests) the kite
//     reaches 100 m in about 45–60 seconds of flying.
//   - Nonoy's Choice never changes whether a child can win (the kept ribbon is decoration).
// Word gates only use words already in the Word Notebook, and pause while the child reads.
import Phaser from 'phaser';
import { RACE_MAX_SECONDS, RACE_TARGET } from '../config';
import { words } from '../content/adventure';
import { sfx } from '../lib/sfx';
import { currentGame, getState, subscribe, updateGame } from '../lib/store';
import type { RibbonColor } from '../types';
import { makeAnims, makeTextures } from './art';
import { bus, input, reducedMotion } from './bus';

const RIBBON: Record<RibbonColor, number> = { sun: 0xf2b33d, teal: 0x2f9c8a, coral: 0xe86f51, violet: 0xa066c9 };

// Fixed course (seconds of flying time). The same every run: fair and learnable.
const BIRDS: [number, number, number][] = [
  [3, 0.25, 1], [6, 0.75, -1], [9, 0.5, 1], [12, 0.3, -1], [16, 0.7, 1], [19, 0.4, -1], [23, 0.62, 1], [26, 0.22, -1],
  [30, 0.8, 1], [34, 0.5, -1], [37, 0.3, 1], [41, 0.7, -1], [45, 0.42, 1], [48, 0.6, -1], [52, 0.5, 1], [56, 0.3, -1],
  [60, 0.7, 1], [64, 0.4, -1], [68, 0.6, 1],
];
const GUSTS: [number, number][] = [[8, 1], [20, -1], [32, 1], [44, -1], [56, 1]];
const WARNED_GUST = 1;
/** When word gates appear (one per word in the Word Notebook, at most three). */
const GATES = [14, 29, 42];

/** Climb speed in metres per second of flying. */
const CLIMB_LONG_STRING = 1.75;
const CLIMB_SHORT_STRING = 1.3;
/** Without Long String the string runs out here. */
export const STRING_LIMIT = 40;
/** Extra metres for flying through the right word gate. */
const GATE_BOOST = 6;
/** Metres lost when a bird or gust knocks the kite. */
const HIT_DROP = 3;
const FALL_SPEED = 115; // px/s that obstacles drift down

interface Ob {
  kind: 'bird' | 'gust';
  obj: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;
  vx: number;
  dir: number;
  touched: boolean;
  warn?: boolean;
}
interface Gate {
  y: number;
  correct: 'left' | 'right';
  wordIndex: number;
  objs: Phaser.GameObjects.Container;
  labels: Phaser.GameObjects.Text[];
  waiting: boolean;
  passed: boolean;
}

export class RaceScene extends Phaser.Scene {
  private kite!: Phaser.GameObjects.Container;
  private kiteG!: Phaser.GameObjects.Graphics;
  private stringG!: Phaser.GameObjects.Graphics;
  private skyG!: Phaser.GameObjects.Graphics;
  private groundG!: Phaser.GameObjects.Graphics;
  private clouds: Phaser.GameObjects.Image[] = [];
  private tala!: Phaser.GameObjects.Image;
  private nonoy?: Phaser.GameObjects.Image;
  private obs: Ob[] = [];
  private gate: Gate | null = null;
  private burst!: Phaser.GameObjects.Particles.ParticleEmitter;
  private keys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private ad?: Record<string, Phaser.Input.Keyboard.Key>;
  private pointerX: number | null = null;

  private h = 0;
  private t = 0;
  private x = 0;
  private vx = 0;
  private strength = 2;
  private maxStrength = 2;
  private invuln = 0;
  private ended = false;
  private holding = false;
  private nextBird = 0;
  private nextGust = 0;
  private nextGate = 0;
  private warned = false;
  private hudTimer = 0;
  /** Indexes into `words` for the words this child has learned (gates only use these). */
  private gateWords: number[] = [];
  /** Size factor so the race feels the same on a phone and on a classroom TV. */
  private k = 1;
  private up = { frame: false, balance: false, longString: false, ribbon: false, nonoy: false };
  private unsub: Array<() => void> = [];

  constructor() {
    super('race');
  }

  create() {
    makeTextures(this);
    makeAnims(this);
    const g = currentGame();
    this.up = {
      frame: g.upgrades.includes('frame'),
      balance: g.upgrades.includes('balance'),
      longString: g.upgrades.includes('longString'),
      ribbon: g.upgrades.includes('ribbon'),
      nonoy: g.upgrades.includes('nonoy'),
    };
    // Strength comes from the quest upgrades only; Nonoy's Choice never changes it.
    this.maxStrength = 2 + (this.up.frame ? 2 : 0);
    this.gateWords = words.map((w, i) => (g.words.includes(w.id) ? i : -1)).filter((i) => i >= 0).slice(0, GATES.length);
    this.strength = this.maxStrength;
    this.h = 0;
    this.t = 0;
    this.vx = 0;
    this.ended = false;
    this.obs = [];
    this.gate = null;
    this.nextBird = this.nextGust = this.nextGate = 0;
    this.warned = false;
    this.holding = true; // wait for "Start"
    const { width: W, height: H } = this.scale;
    this.x = W / 2;
    this.k = Phaser.Math.Clamp(H / 640, 1, 1.7);

    this.skyG = this.add.graphics().setDepth(-10);
    for (let i = 0; i < 5; i++) {
      this.clouds.push(this.add.image(Phaser.Math.Between(0, W), (H / 5) * i, 'cloud').setAlpha(0.8).setDepth(-8).setScale(0.6 + (i % 3) * 0.2));
    }
    this.groundG = this.add.graphics().setDepth(-5);
    this.stringG = this.add.graphics().setDepth(5);
    this.tala = this.add.image(W / 2, H - 6, 'tala-up-0').setOrigin(0.5, 1).setScale(1.5 * this.k).setDepth(6);
    if (this.up.nonoy) this.nonoy = this.add.image(W / 2 + 46 * this.k, H - 6, 'nonoy-up-0').setOrigin(0.5, 1).setScale(1.4 * this.k).setDepth(6);

    this.kiteG = this.add.graphics();
    this.kite = this.add.container(this.x, this.kiteY(), [this.kiteG]).setDepth(10).setScale(this.k);
    this.drawKite();

    this.burst = this.add.particles(0, 0, 'sparkle', { speed: { min: 80, max: 200 }, lifespan: 700, scale: { start: 1.1, end: 0 }, emitting: false });
    this.burst.setDepth(20);

    const kb = this.input.keyboard;
    if (kb) {
      this.keys = kb.createCursorKeys();
      this.ad = kb.addKeys('A,D', false) as Record<string, Phaser.Input.Keyboard.Key>;
    }
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => (this.pointerX = p.x));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown) this.pointerX = p.x;
    });
    this.input.on('pointerup', () => (this.pointerX = null));

    this.unsub.push(bus.on('race:start', () => this.begin()));
    this.unsub.push(bus.on('race:go', () => this.releaseGate()));
    this.unsub.push(bus.on('race:retry', () => this.scene.restart()));
    this.unsub.push(subscribe(() => this.relabel()));
    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
    this.scale.on('resize', this.onResize, this);
    this.drawSky();
    this.exposeForTests();
    bus.emit('race:ready', { maxStrength: this.maxStrength });
    this.emitHud(true);
  }

  private kiteY() {
    return this.scale.height * (this.up.longString ? 0.42 : 0.5);
  }

  private onResize() {
    this.tala?.setPosition(this.scale.width / 2, this.scale.height - 6);
    this.nonoy?.setPosition(this.scale.width / 2 + 46, this.scale.height - 6);
    this.drawSky();
  }

  private begin() {
    if (!this.holding || this.ended) return;
    this.holding = false;
    updateGame((g) => ({ ...g, finale: { ...g.finale, tries: g.finale.tries + 1 } }));
    sfx.whoosh();
  }

  /** The kite shows its upgrades: thick frame, level crossbar, long string, tail ribbons. */
  private drawKite() {
    const g = this.kiteG;
    g.clear();
    const tilt = this.up.balance ? 0 : 7;
    g.fillStyle(0xd94a3a).fillTriangle(0, -30, 22, -4 + tilt, 0, 34).fillTriangle(0, -30, -22, -4 - tilt, 0, 34);
    g.fillStyle(0xffffff, 0.18).fillTriangle(0, -30, -22, -4 - tilt, 0, -4);
    g.lineStyle(this.up.frame ? 4 : 2, this.up.frame ? 0x6b4b2f : 0xb9874f);
    g.lineBetween(0, -30, 0, 34).lineBetween(-22, -4 - tilt, 22, -4 + tilt);
    // tail with ribbons
    g.lineStyle(1.5, 0x6b4b2f).beginPath().moveTo(0, 34);
    g.lineTo(-5, 48).lineTo(5, 62).lineTo(-5, 76).strokePath();
    const ribbons: RibbonColor[] = ['sun', 'teal'];
    if (this.up.ribbon) ribbons.push('violet');
    if (this.up.longString) ribbons.push('coral');
    ribbons.forEach((r, i) => {
      const y = 44 + i * 10;
      g.fillStyle(RIBBON[r]).fillTriangle(0, y, -8, y - 4, -8, y + 4).fillTriangle(0, y, 8, y - 4, 8, y + 4);
    });
  }

  private drawSky() {
    const { width: W, height: H } = this.scale;
    const k = Phaser.Math.Clamp(this.h / RACE_TARGET, 0, 1);
    const top = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xbfe3ef),
      Phaser.Display.Color.ValueToColor(0x7fb6e0),
      100,
      k * 100,
    );
    this.skyG.clear();
    this.skyG.fillStyle(Phaser.Display.Color.GetColor(top.r, top.g, top.b)).fillRect(0, 0, W, H);
    // ground and plaza slide away as the kite climbs
    this.groundG.clear();
    const gy = H - 70 + this.h * 4;
    if (gy < H) {
      this.groundG.fillStyle(0x9fd0a0).fillRect(0, gy, W, H - gy + 10);
      this.groundG.fillStyle(0xf3dfb5).fillRect(W * 0.15, gy + 20, W * 0.7, H);
    }
  }

  private emitHud(force = false) {
    bus.emit('race:hud', { h: Math.max(0, Math.floor(this.h)), strength: this.strength, max: this.maxStrength, force });
  }

  private spawnBird(xFrac: number, dir: number) {
    const W = this.scale.width;
    const s = this.add.sprite(xFrac * W, -30, 'bird-0').setDepth(8).setScale(this.k);
    s.play('bird-flap');
    s.setFlipX(dir < 0);
    this.obs.push({ kind: 'bird', obj: s, vx: dir * 70 * this.k, dir, touched: false });
  }

  private spawnGust(dir: number, warn: boolean) {
    const W = this.scale.width;
    const wide = W * 0.62;
    const c = this.add.container(dir > 0 ? wide / 2 : W - wide / 2, -40).setDepth(7);
    c.setScale(1, this.k);
    for (let i = 0; i < 3; i++) {
      const img = this.add.image(-wide / 2 + (i + 0.5) * (wide / 3), (i % 2) * 14 - 7, 'gust').setScale(wide / 3 / 130, 0.8).setAlpha(0.85);
      if (dir < 0) img.setFlipX(true);
      if (warn) img.setTint(0xffc46b);
      c.add(img);
      if (!reducedMotion) this.tweens.add({ targets: img, x: img.x + dir * 10, duration: 400, yoyo: true, repeat: -1 });
    }
    c.setSize(wide, 60);
    this.obs.push({ kind: 'gust', obj: c, vx: 0, dir, touched: false, warn });
  }

  private spawnGate(index: number) {
    const W = this.scale.width;
    const correct: 'left' | 'right' = index % 2 === 0 ? 'left' : 'right';
    const c = this.add.container(0, 70).setDepth(9);
    const mk = (cx: number) => {
      const gfx = this.add.graphics();
      const gh = 52 * this.k;
      gfx.lineStyle(6, 0xffffff, 0.95).strokeRoundedRect(cx - W * 0.21, -gh / 2, W * 0.42, gh, 14);
      gfx.fillStyle(0x1f7a6d, 0.55).fillRoundedRect(cx - W * 0.21, -gh / 2, W * 0.42, gh, 14);
      return gfx;
    };
    const labels = [W * 0.25, W * 0.75].map((cx) =>
      this.add.text(cx, 0, '', { fontFamily: 'system-ui, sans-serif', fontSize: `${Math.round(20 * this.k)}px`, fontStyle: 'bold', color: '#ffffff', stroke: '#155e54', strokeThickness: 4 }).setOrigin(0.5),
    );
    c.add([mk(W * 0.25), mk(W * 0.75), ...labels]);
    this.gate = { y: 70, correct, wordIndex: this.gateWords[index], objs: c, labels, waiting: true, passed: false };
    this.relabel();
    sfx.word();
    const w = words[this.gate.wordIndex];
    bus.emit('race:gate', { wordId: w.id, correct });
  }

  /** Put the right words on the gates in the current language. */
  private relabel() {
    if (!this.gate) return;
    const lang = getState().lang;
    const w = words[this.gate.wordIndex];
    const [l, r] = this.gate.labels;
    const right = w.word[lang];
    const wrong = w.decoy[lang];
    l.setText(this.gate.correct === 'left' ? right : wrong);
    r.setText(this.gate.correct === 'left' ? wrong : right);
  }

  private releaseGate() {
    if (this.gate) this.gate.waiting = false;
  }

  private hit(kind: 'bird' | 'gust') {
    if (this.invuln > 0 || this.ended) return;
    const damage = kind === 'gust' && this.up.balance ? 0 : 1;
    if (damage === 0) return;
    this.strength -= damage;
    this.h = Math.max(0, this.h - HIT_DROP);
    this.invuln = 1.4;
    sfx.hit();
    if (!reducedMotion) this.cameras.main.shake(180, 0.008);
    if (this.strength <= 0) this.crash();
    this.emitHud(true);
  }

  private crash() {
    this.ended = true;
    sfx.crash();
    if (!reducedMotion) this.cameras.main.shake(350, 0.015);
    this.tweens.add({ targets: this.kite, angle: 540, y: this.scale.height + 80, duration: reducedMotion ? 10 : 900, ease: 'Quad.easeIn' });
    updateGame((g) => ({ ...g, finale: { ...g.finale, crashes: g.finale.crashes + 1, best: Math.max(g.finale.best, Math.floor(this.h)) } }));
    bus.emit('race:end', { result: 'crash', h: Math.floor(this.h) });
  }

  private win() {
    this.ended = true;
    sfx.restore();
    this.tweens.add({ targets: this.kite, y: this.kite.y - 120, duration: 1400, ease: 'Sine.easeOut' });
    if (!reducedMotion) {
      const conf = this.add.particles(this.scale.width / 2, -10, 'confetti', {
        x: { min: -this.scale.width / 2, max: this.scale.width / 2 },
        speedY: { min: 80, max: 200 },
        rotate: { min: 0, max: 360 },
        lifespan: 2600,
        quantity: 3,
        frequency: 30,
        tint: [0xe86f51, 0xf2b33d, 0x2f9c8a, 0x5b7fd6, 0xa066c9],
      });
      conf.setDepth(30);
      this.time.delayedCall(2000, () => conf.stop());
    }
    updateGame((g) => ({
      ...g,
      finale: { ...g.finale, wins: g.finale.wins + 1, best: Math.max(g.finale.best, RACE_TARGET) },
      restored: true,
      restoreSeen: g.restored ? g.restoreSeen : false,
    }));
    bus.emit('race:end', { result: 'win', h: RACE_TARGET });
  }

  /** Without Long String the kite cannot climb past STRING_LIMIT. */
  private stringRanOut() {
    this.ended = true;
    sfx.hint();
    this.tweens.add({ targets: this.kite, angle: { from: -8, to: 8 }, duration: 260, yoyo: true, repeat: 3 });
    updateGame((g) => ({ ...g, finale: { ...g.finale, best: Math.max(g.finale.best, STRING_LIMIT) } }));
    bus.emit('race:end', { result: 'string', h: STRING_LIMIT });
  }

  private tooLow() {
    this.ended = true;
    this.tweens.add({ targets: this.kite, y: this.kite.y + 60, angle: 20, duration: 1200, ease: 'Sine.easeInOut' });
    updateGame((g) => ({ ...g, finale: { ...g.finale, best: Math.max(g.finale.best, Math.floor(this.h)) } }));
    bus.emit('race:end', { result: 'low', h: Math.floor(this.h) });
  }

  update(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs, 50) / 1000;
    const { width: W } = this.scale;
    const ky = this.kiteY();

    // Steering works even before Start and during word gates, so the child can line up.
    let dx = input.dx;
    if (this.keys?.left.isDown || this.ad?.A.isDown) dx = -1;
    else if (this.keys?.right.isDown || this.ad?.D.isDown) dx = 1;
    if (this.pointerX !== null && Math.abs(dx) < 0.1) dx = Phaser.Math.Clamp((this.pointerX - this.x) / 60, -1, 1);
    const steer = (this.up.balance ? 240 : 165) * this.k;
    const resp = this.up.balance ? 9 : 4;
    const flying = !this.holding && !this.ended && !(this.gate?.waiting ?? false);
    const drift = flying ? Math.sin(this.t * 1.3) * (this.up.balance ? 16 : 58) * this.k : 0;
    if (!this.ended) {
      this.vx += (dx * steer + drift - this.vx) * Math.min(1, resp * dt);
      this.x = Phaser.Math.Clamp(this.x + this.vx * dt, 30 * this.k, W - 30 * this.k);
    }
    if (!this.ended) {
      this.kite.setPosition(this.x, ky + Math.sin(this.t * 2) * 4);
      const wob = this.up.balance ? 0.03 : 0.12;
      this.kite.setRotation(this.vx / 700 + Math.sin(this.t * 6) * wob);
      this.kite.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 10) % 2 === 0 ? 0.4 : 1);
    }
    // string from Tala's hands to the kite
    this.stringG.clear();
    this.stringG.lineStyle(this.up.longString ? 2 : 1.5, 0xffffff, 0.9);
    this.stringG.beginPath().moveTo(this.tala.x + 6 * this.k, this.tala.y - 58 * this.k);
    this.stringG.lineTo((this.tala.x + this.kite.x) / 2 + 20, (this.tala.y + this.kite.y) / 2 + 30);
    this.stringG.lineTo(this.kite.x, this.kite.y + 30 * this.k).strokePath();

    if (!flying) {
      this.emitHud();
      return;
    }

    this.t += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.h += (this.up.longString ? CLIMB_LONG_STRING : CLIMB_SHORT_STRING) * dt;
    if (!this.up.longString && this.h >= STRING_LIMIT) {
      this.h = STRING_LIMIT;
      this.stringRanOut();
      return;
    }

    // course
    while (this.nextBird < BIRDS.length && this.t >= BIRDS[this.nextBird][0]) {
      const [, xf, dir] = BIRDS[this.nextBird++];
      this.spawnBird(xf, dir);
    }
    while (this.nextGust < GUSTS.length && this.t >= GUSTS[this.nextGust][0]) {
      const idx = this.nextGust++;
      this.spawnGust(GUSTS[idx][1], this.up.nonoy && idx === WARNED_GUST);
    }
    if (this.up.nonoy && !this.warned && this.t >= GUSTS[WARNED_GUST][0] - 2.5) {
      this.warned = true;
      bus.emit('race:warn');
    }
    if (this.nextGate < this.gateWords.length && this.t >= GATES[this.nextGate] && !this.gate) this.spawnGate(this.nextGate++);

    for (const o of this.obs) {
      o.obj.y += FALL_SPEED * this.k * dt;
      if (o.kind === 'bird') {
        o.obj.x += o.vx * dt;
        if (!o.touched && Phaser.Math.Distance.Between(o.obj.x, o.obj.y, this.x, ky) < 28 * this.k) {
          o.touched = true;
          this.hit('bird');
        }
      } else {
        const half = (o.obj as Phaser.GameObjects.Container).width / 2;
        const inBand = Math.abs(o.obj.y - ky) < 36 * this.k && Math.abs(this.x - o.obj.x) < half;
        if (inBand) {
          this.vx += o.dir * (this.up.balance ? 260 : 560) * this.k * dt;
          if (!o.touched) {
            o.touched = true;
            this.hit('gust');
          }
        }
      }
    }
    this.obs = this.obs.filter((o) => {
      if (o.obj.y > this.scale.height + 60) {
        o.obj.destroy();
        return false;
      }
      return true;
    });

    if (this.gate) {
      this.gate.y += FALL_SPEED * this.k * dt;
      this.gate.objs.y = this.gate.y;
      if (!this.gate.passed && this.gate.y >= ky) {
        this.gate.passed = true;
        const side = this.x < W / 2 ? 'left' : 'right';
        const ok = side === this.gate.correct;
        if (ok) {
          this.h = this.up.longString ? this.h + GATE_BOOST : Math.min(STRING_LIMIT, this.h + GATE_BOOST);
          sfx.boost();
          this.burst.explode(reducedMotion ? 6 : 20, this.x, ky);
        } else sfx.hint();
        updateGame((g) => ({ ...g, finale: { ...g.finale, gateTries: g.finale.gateTries + 1, gateCorrect: g.finale.gateCorrect + (ok ? 1 : 0) } }));
        bus.emit('race:gateResult', { ok, wordId: words[this.gate.wordIndex].id });
      }
      if (this.gate.y > this.scale.height + 40) {
        this.gate.objs.destroy();
        this.gate = null;
      }
    }

    for (const cl of this.clouds) {
      cl.y += 40 * dt;
      if (cl.y > this.scale.height + 40) {
        cl.y = -40;
        cl.x = Phaser.Math.Between(0, W);
      }
    }
    this.drawSky();
    this.hudTimer += dt;
    if (this.hudTimer > 0.1) {
      this.hudTimer = 0;
      this.emitHud();
    }

    if (this.h >= RACE_TARGET) this.win();
    else if (this.t >= RACE_MAX_SECONDS) this.tooLow();
  }

  private exposeForTests() {
    try {
      if (!new URLSearchParams(window.location.search).has('e2e')) return;
      (window as unknown as Record<string, unknown>).__bqRace = {
        state: () => ({ h: this.h, t: this.t, strength: this.strength, max: this.maxStrength, ended: this.ended, holding: this.holding, gate: !!this.gate?.waiting, x: this.x }),
        setHeight: (h: number) => (this.h = h),
        setTime: (t: number) => (this.t = t),
        hit: () => {
          this.invuln = 0;
          this.hit('bird');
        },
        /** Tests only: no bumps, so timing can be measured. */
        noHits: () => (this.invuln = 1e9),
      };
    } catch {
      /* ignore */
    }
  }

  private cleanup() {
    this.unsub.forEach((u) => u());
    this.unsub = [];
    this.scale.off('resize', this.onResize, this);
    this.clouds = [];
  }
}
