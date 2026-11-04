// The barangay: one connected map larger than the screen, with a following camera.
// No quest arrows or markers. A soft sparkle appears only after repeated wrong tries.
import Phaser from 'phaser';
import { SPARKLE_AFTER } from '../config';
import { q1Needs, type ItemId } from '../content/adventure';
import { sfx } from '../lib/sfx';
import { currentGame, savePosition, subscribe, updateGame, type GameProgress } from '../lib/store';
import { makeAnims, makeTextures, WORLD_H, WORLD_W } from './art';
import { bus, input, reducedMotion, type InteractKind, type NearInfo } from './bus';

interface Spot {
  id: string;
  x: number;
  y: number;
  kind: InteractKind;
  r?: number;
}

const START = { x: 210, y: 1345 };
const SPEED = 150;

/** Where each item lies on the map. */
export const ITEM_SPOTS: Record<ItemId, { x: number; y: number }> = {
  longBamboo: { x: 760, y: 292 },
  slipper: { x: 420, y: 282 },
  redPaper: { x: 330, y: 1350 },
  bluePaper: { x: 120, y: 990 },
  soyBottle: { x: 370, y: 985 },
  glueJar: { x: 612, y: 818 },
  shortBamboo: { x: 900, y: 1010 },
};

const NPCS: { id: 'nena' | 'nonoy' | 'lolo' | 'jun'; x: number; y: number }[] = [
  { id: 'nena', x: 300, y: 980 },
  { id: 'nonoy', x: 660, y: 985 },
  { id: 'lolo', x: 830, y: 1338 },
  { id: 'jun', x: 556, y: 648 },
];

const FIXED_SPOTS: Spot[] = [
  { id: 'boat', x: 220, y: 248, kind: 'look', r: 70 },
  { id: 'basket', x: 600, y: 948, kind: 'look' },
  { id: 'bench', x: 360, y: 724, kind: 'look' },
  { id: 'home', x: 210, y: 1300, kind: 'look' },
  { id: 'locked-library', x: 140, y: 575, kind: 'read' },
  { id: 'locked-clinic', x: 820, y: 575, kind: 'read' },
];

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private gateBlock!: Phaser.GameObjects.Rectangle;
  private gate!: Phaser.GameObjects.Image;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private npcs = new Map<string, Phaser.GameObjects.Sprite>();
  private itemSprites = new Map<ItemId, Phaser.GameObjects.Image>();
  private cat!: Phaser.GameObjects.Image;
  private zzz?: Phaser.GameObjects.Particles.ParticleEmitter;
  private plazaOn!: Phaser.GameObjects.Image;
  private sparkles: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private sparkleKey = '';
  private burst!: Phaser.GameObjects.Particles.ParticleEmitter;
  private spots: Spot[] = [];
  private near: Spot | null = null;
  private facing: 'down' | 'up' | 'side' = 'down';
  private lastStep = 0;
  private lastSave = 0;
  private moved = false;
  private unsub: Array<() => void> = [];
  private restoring = false;

  constructor() {
    super('world');
  }

  create() {
    makeTextures(this);
    makeAnims(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.add.image(0, 0, 'ground').setOrigin(0).setDepth(-10);

    // Plaza (faded until Kite Day is won)
    this.add.image(480, 480, 'plaza-off').setDepth(-5);
    this.plazaOn = this.add.image(480, 480, 'plaza-on').setDepth(-4).setAlpha(0);

    this.solids = this.physics.add.staticGroup();
    const block = (x: number, y: number, w: number, h: number) => {
      const r = this.add.rectangle(x + w / 2, y + h / 2, w, h);
      this.physics.add.existing(r, true);
      this.solids.add(r);
      return r;
    };
    block(0, 0, WORLD_W, 138); // sea
    block(292, 352, 376, 16); // plaza hedges
    block(292, 352, 16, 256);
    block(652, 352, 16, 256);
    block(292, 592, 160, 16);
    block(508, 592, 160, 16);
    this.gateBlock = block(452, 590, 56, 18);
    this.gate = this.add.image(480, 610, 'gate-closed').setOrigin(0.5, 1).setDepth(610);
    block(0, 1418, WORLD_W, 22); // fence

    // Buildings
    const building = (key: string, x: number, baseY: number, w: number, h: number) => {
      this.add.image(x, baseY, key).setOrigin(0.5, 1).setDepth(baseY);
      block(x - w / 2 + 10, baseY - h + 40, w - 20, h - 46);
    };
    building('bld-store', 210, 930, 240, 170);
    building('bld-nonoy', 750, 930, 240, 170);
    building('bld-tala', 210, 1290, 240, 170);
    building('bld-workshop', 750, 1290, 240, 170);
    building('bld-locked', 140, 560, 160, 140);
    building('bld-locked', 820, 560, 160, 140);
    this.add.image(140, 446, 'sign-lock').setDepth(561);
    this.add.image(820, 446, 'sign-lock').setDepth(561);

    // Scenery with small colliders at the trunk
    const prop = (key: string, x: number, y: number, cw = 14, ch = 10, sway = false) => {
      const img = this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
      block(x - cw / 2, y - ch, cw, ch);
      if (sway && !reducedMotion) {
        this.tweens.add({ targets: img, angle: { from: -2.5, to: 2.5 }, duration: 2200 + x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      return img;
    };
    prop('palm', 90, 300, 14, 10, true);
    prop('palm', 520, 200, 14, 10, true);
    prop('palm', 890, 300, 14, 10, true);
    prop('mango', 370, 1080, 16, 12);
    prop('mango', 590, 800, 16, 12);
    prop('mango', 60, 760, 16, 12);
    prop('boat', 220, 262, 100, 20);
    prop('basket', 600, 960, 26, 10);
    prop('bench', 360, 740, 56, 10);
    for (const [x, y] of [[40, 1000], [420, 1220], [920, 820], [520, 1130], [880, 1390], [40, 1380], [250, 600], [700, 600]]) prop('bush', x, y, 24, 10);

    // Ambient: waves, chickens, butterflies
    if (!reducedMotion) {
      for (let i = 0; i < 9; i++) {
        const w = this.add.image(60 + i * 105, 40 + (i % 3) * 30, 'wave').setDepth(-9).setAlpha(0.8);
        this.tweens.add({ targets: w, x: w.x + 18, alpha: 0.3, duration: 1800 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      for (const [x, y] of [[640, 1385], [700, 1395], [140, 1392]]) this.chicken(x, y);
      for (const [x, y] of [[620, 700], [330, 820], [840, 640]]) {
        const b = this.add.image(x, y, 'butterfly').setDepth(2000);
        this.tweens.add({ targets: b, x: x + 40, y: y - 24, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: b, scaleX: 0.4, duration: 180, yoyo: true, repeat: -1 });
      }
    }

    // Muning the cat, by the boat
    this.cat = this.add.image(262, 246, 'cat-sleep').setDepth(246);
    if (!reducedMotion) {
      this.zzz = this.add.particles(0, 0, 'zzz', { x: 270, y: 232, speedY: -14, speedX: 6, lifespan: 1800, frequency: 900, alpha: { start: 1, end: 0 }, scale: { start: 0.6, end: 1.1 } });
      this.zzz.setDepth(3000);
    }

    // Neighbours
    for (const n of NPCS) {
      const s = this.add.sprite(n.x, n.y, `${n.id}-down-0`).setOrigin(0.5, 1).setDepth(n.y);
      block(n.x - 10, n.y - 10, 20, 10);
      if (!reducedMotion) this.tweens.add({ targets: s, scaleY: 1.03, duration: 900 + n.x / 3, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.npcs.set(n.id, s);
    }

    // Items (shown only while Quest 1 is active)
    for (const [id, p] of Object.entries(ITEM_SPOTS) as [ItemId, { x: number; y: number }][]) {
      const img = this.add.image(p.x, p.y, `item-${id}`).setOrigin(0.5, 1).setDepth(p.y).setVisible(false);
      if (!reducedMotion) this.tweens.add({ targets: img, y: p.y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.itemSprites.set(id, img);
    }

    // Player
    const g = currentGame();
    const start = g.pos ?? START;
    this.player = this.physics.add.sprite(start.x, start.y, 'tala-down-0').setOrigin(0.5, 1);
    this.player.setCollideWorldBounds(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 10).setOffset(7, 34);
    this.physics.add.collider(this.player, this.solids);

    this.burst = this.add.particles(0, 0, 'sparkle', {
      speed: { min: 60, max: 160 },
      lifespan: 700,
      scale: { start: 1, end: 0 },
      emitting: false,
    });
    this.burst.setDepth(5000);

    // Camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.startFollow(this.player, true, 0.14, 0.14);
    this.fitZoom();
    this.scale.on('resize', this.fitZoom, this);

    // Keyboard
    const kb = this.input.keyboard;
    if (kb) {
      this.cursors = kb.createCursorKeys();
      this.keys = kb.addKeys('W,A,S,D,SPACE,ENTER', false) as Record<string, Phaser.Input.Keyboard.Key>;
      kb.on('keydown-SPACE', () => this.act());
      kb.on('keydown-ENTER', () => this.act());
    }

    this.unsub.push(bus.on('action', () => this.act()));
    this.unsub.push(bus.on('fx', (p) => this.fx(p as string)));
    this.unsub.push(subscribe(() => this.sync()));
    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
    this.sync();
    this.exposeForTests();
    bus.emit('world:ready');
  }

  private fitZoom() {
    const { width, height } = this.scale;
    const z = Phaser.Math.Clamp(Math.min(width, height) / 430, 1, 1.6);
    this.cameras.main.setZoom(z);
  }

  private chicken(x: number, y: number) {
    const ch = this.add.image(x, y, 'chicken').setOrigin(0.5, 1).setDepth(y);
    const wander = () => {
      const nx = Phaser.Math.Clamp(ch.x + Phaser.Math.Between(-60, 60), 40, 920);
      ch.setFlipX(nx < ch.x);
      this.tweens.add({ targets: ch, x: nx, duration: 1400, ease: 'Sine.easeInOut', onComplete: () => this.time.delayedCall(Phaser.Math.Between(800, 2400), wander) });
    };
    wander();
  }

  /** Match the world to saved progress: items, gate, cat, plaza, sparkles. */
  private sync() {
    if (!this.player) return;
    const g = currentGame();
    const q1Active = g.quests.q1.status === 'active';
    for (const [id, img] of this.itemSprites) img.setVisible(q1Active && !g.bag.includes(id) && !g.q1Delivered.includes(id));

    const open = g.gateOpen;
    this.gate.setTexture(open ? 'gate-open' : 'gate-closed');
    const gb = this.gateBlock.body as Phaser.Physics.Arcade.StaticBody;
    gb.enable = !open;

    const found = g.q3.hasString;
    this.cat.setTexture(found ? 'cat-awake' : 'cat-sleep');
    this.cat.setPosition(found ? 290 : 262, found ? 258 : 246);
    this.zzz?.setVisible(!found);

    if (g.restored && !this.restoring) {
      if (!g.restoreSeen) this.playRestore();
      else this.plazaOn.setAlpha(1);
    }

    this.spots = this.computeSpots(g);
    this.updateSparkles(g);
  }

  private computeSpots(g: GameProgress): Spot[] {
    const spots: Spot[] = [...FIXED_SPOTS];
    for (const n of NPCS) spots.push({ id: n.id, x: n.x, y: n.y, kind: 'talk', r: 58 });
    if (g.quests.q1.status === 'active') {
      for (const [id, p] of Object.entries(ITEM_SPOTS) as [ItemId, { x: number; y: number }][]) {
        if (!g.bag.includes(id) && !g.q1Delivered.includes(id)) spots.push({ id: `item:${id}`, x: p.x, y: p.y, kind: 'pick', r: 44 });
      }
    }
    if (g.gateOpen) spots.push({ id: 'race', x: 480, y: 440, kind: 'race', r: 80 });
    return spots;
  }

  /** Soft sparkle near the target, only after SPARKLE_AFTER wrong tries. */
  private updateSparkles(g: GameProgress) {
    const targets: { x: number; y: number }[] = [];
    if (g.quests.q1.status === 'active' && g.quests.q1.attempts >= SPARKLE_AFTER) {
      for (const id of q1Needs) if (!g.bag.includes(id) && !g.q1Delivered.includes(id)) targets.push(ITEM_SPOTS[id]);
    }
    if (g.quests.q3.status === 'active' && !g.q3.hasString && g.quests.q3.attempts >= SPARKLE_AFTER) targets.push({ x: 262, y: 250 });
    const key = targets.map((t) => `${t.x},${t.y}`).join('|');
    if (key === this.sparkleKey) return;
    this.sparkleKey = key;
    this.sparkles.forEach((s) => s.destroy());
    this.sparkles = targets.map((t) => {
      const e = this.add.particles(t.x, t.y - 14, 'sparkle', {
        x: { min: -14, max: 14 },
        y: { min: -10, max: 6 },
        lifespan: 900,
        frequency: reducedMotion ? 600 : 220,
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.9, end: 0 },
      });
      e.setDepth(4000);
      return e;
    });
    if (targets.length > 0) bus.emit('sparkle');
  }

  private act() {
    if (input.paused || !this.near) return;
    const id = this.near.id;
    sfx.tap();
    const npc = this.npcs.get(id);
    if (npc) {
      npc.setTexture(`${id}-${this.player.x < npc.x - 12 ? 'side' : this.player.x > npc.x + 12 ? 'side' : 'down'}-0`);
      npc.setFlipX(this.player.x < npc.x);
      if (!reducedMotion) this.tweens.add({ targets: npc, y: npc.y - 6, duration: 110, yoyo: true });
    }
    bus.emit('interact', id);
  }

  private fx(kind: string) {
    if (kind === 'pickup') {
      sfx.pick();
      this.burst.explode(reducedMotion ? 4 : 12, this.player.x, this.player.y - 24);
    }
    if (kind === 'celebrate') {
      this.burst.explode(reducedMotion ? 6 : 24, this.player.x, this.player.y - 30);
    }
  }

  private playRestore() {
    this.restoring = true;
    input.paused = true;
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan(480, 470, reducedMotion ? 0 : 900, 'Sine.easeInOut');
    this.time.delayedCall(reducedMotion ? 0 : 900, () => {
      sfx.restore();
      this.tweens.add({ targets: this.plazaOn, alpha: 1, duration: reducedMotion ? 10 : 1400 });
      if (!reducedMotion) {
        const conf = this.add.particles(480, 380, 'confetti', {
          x: { min: -170, max: 170 },
          speedY: { min: 40, max: 140 },
          speedX: { min: -40, max: 40 },
          rotate: { min: 0, max: 360 },
          lifespan: 2200,
          quantity: 3,
          frequency: 40,
          tint: [0xe86f51, 0xf2b33d, 0x2f9c8a, 0x5b7fd6, 0xa066c9],
        });
        conf.setDepth(5000);
        this.time.delayedCall(1800, () => conf.stop());
      }
      this.time.delayedCall(reducedMotion ? 200 : 2200, () => {
        cam.startFollow(this.player, true, 0.14, 0.14);
        input.paused = false;
        this.restoring = false;
        updateGame((g) => ({ ...g, restoreSeen: true }));
        bus.emit('restored');
      });
    });
  }

  update(time: number) {
    if (!this.player) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let dx = input.dx;
    let dy = input.dy;
    if (this.cursors) {
      if (this.cursors.left.isDown || this.keys.A.isDown) dx = -1;
      else if (this.cursors.right.isDown || this.keys.D.isDown) dx = 1;
      if (this.cursors.up.isDown || this.keys.W.isDown) dy = -1;
      else if (this.cursors.down.isDown || this.keys.S.isDown) dy = 1;
    }
    if (input.paused) dx = dy = 0;
    const len = Math.hypot(dx, dy);
    if (len > 0.15) {
      const k = Math.min(1, len);
      body.setVelocity((dx / len) * SPEED * k, (dy / len) * SPEED * k);
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = 'side';
        this.player.setFlipX(dx < 0);
      } else this.facing = dy < 0 ? 'up' : 'down';
      this.player.anims.play(`tala-walk-${this.facing}`, true);
      if (time - this.lastStep > 300) {
        this.lastStep = time;
        sfx.step();
      }
      this.moved = true;
    } else {
      body.setVelocity(0, 0);
      this.player.anims.stop();
      this.player.setTexture(`tala-${this.facing}-0`);
    }
    this.player.setDepth(this.player.y);

    // What is Tala standing next to?
    let best: Spot | null = null;
    let bestD = Infinity;
    for (const s of this.spots) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y);
      if (d < (s.r ?? 52) && d < bestD) {
        best = s;
        bestD = d;
      }
    }
    if (best?.id !== this.near?.id) {
      this.near = best;
      bus.emit('near', best ? ({ id: best.id, kind: best.kind } satisfies NearInfo) : null);
    }

    if (this.moved && time - this.lastSave > 1500) {
      this.lastSave = time;
      this.moved = false;
      savePosition(this.player.x, this.player.y);
    }
  }

  private exposeForTests() {
    try {
      if (!new URLSearchParams(window.location.search).has('e2e')) return;
      (window as unknown as Record<string, unknown>).__bqWorld = {
        teleport: (x: number, y: number) => this.player.setPosition(x, y),
        teleportTo: (id: string) => {
          const s = this.spots.find((sp) => sp.id === id) ?? FIXED_SPOTS.find((sp) => sp.id === id);
          if (s) this.player.setPosition(s.x + (s.kind === 'talk' ? -30 : 0), s.y + 12);
        },
        near: () => this.near?.id ?? null,
        pos: () => ({ x: Math.round(this.player.x), y: Math.round(this.player.y) }),
        sparkles: () => this.sparkles.length,
        plazaAlpha: () => this.plazaOn.alpha,
      };
    } catch {
      /* ignore */
    }
  }

  private cleanup() {
    this.unsub.forEach((u) => u());
    this.unsub = [];
    this.scale.off('resize', this.fitZoom, this);
  }
}
