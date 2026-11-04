// All game art is drawn here with code when the game starts. No image files, no remote assets.
import Phaser from 'phaser';

type G = Phaser.GameObjects.Graphics;
const c = (hex: string) => Phaser.Display.Color.HexStringToColor(hex).color;

function tex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

// ─────────────────────────── People ───────────────────────────
export type Dir = 'down' | 'up' | 'side';
interface Look {
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  extra?: 'ponytail' | 'bun' | 'cap' | 'glasses' | 'apron';
  small?: boolean;
}
export const looks: Record<string, Look> = {
  tala: { skin: '#b97a52', shirt: '#e86f51', pants: '#2c4a6b', hair: '#2b1d16', extra: 'ponytail' },
  nonoy: { skin: '#a86c45', shirt: '#2f9c8a', pants: '#5b4636', hair: '#1f1712', small: true },
  lolo: { skin: '#9c6a4a', shirt: '#5b7fd6', pants: '#4a4a52', hair: '#d9d4cc', extra: 'glasses' },
  nena: { skin: '#b07650', shirt: '#a066c9', pants: '#3f3550', hair: '#2b1d16', extra: 'bun' },
  jun: { skin: '#8f5d3e', shirt: '#f2b33d', pants: '#36505c', hair: '#1f1712', extra: 'cap' },
};

function person(g: G, l: Look, dir: Dir, frame: number) {
  const s = l.small ? 0.86 : 1;
  const ox = 16;
  const top = l.small ? 8 : 2;
  const y = (v: number) => top + v * s;
  // shadow
  g.fillStyle(0x000000, 0.18).fillEllipse(ox, 42, 22 * s, 7);
  // legs (walking frames move them)
  const step = frame === 0 ? 0 : frame === 1 ? 1 : -1;
  g.fillStyle(c(l.pants));
  if (dir === 'side') {
    g.fillRect(ox - 4 + step * 3, y(30), 5 * s, 9 * s);
    g.fillRect(ox - 1 - step * 3, y(30), 5 * s, 9 * s);
  } else {
    g.fillRect(ox - 6, y(30) + (step > 0 ? -1 : 0), 5 * s, 9 * s);
    g.fillRect(ox + 1, y(30) + (step < 0 ? -1 : 0), 5 * s, 9 * s);
  }
  g.fillStyle(0x3a2a20).fillRect(ox - 7, y(38), 6 * s, 3).fillRect(ox + 1, y(38), 6 * s, 3);
  // body
  g.fillStyle(c(l.shirt)).fillRoundedRect(ox - 9 * s, y(18), 18 * s, 15 * s, 5);
  if (l.extra === 'apron') g.fillStyle(0xffffff, 0.9).fillRect(ox - 5, y(24), 10, 9);
  // arms swing
  g.fillStyle(c(l.skin));
  if (dir !== 'side') {
    g.fillRoundedRect(ox - 12 * s, y(20) + step, 4, 11 * s, 2);
    g.fillRoundedRect(ox + 8 * s, y(20) - step, 4, 11 * s, 2);
  } else {
    g.fillRoundedRect(ox - 2 + step * 2, y(20), 4, 11 * s, 2);
  }
  // head
  const hy = y(11);
  g.fillStyle(c(l.skin)).fillCircle(ox, hy, 10 * s);
  // hair
  g.fillStyle(c(l.hair));
  if (dir === 'up') {
    g.fillCircle(ox, hy - 1, 10 * s);
  } else if (dir === 'down') {
    g.slice(ox, hy, 10.5 * s, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false).fillPath();
    g.fillRect(ox - 10 * s, hy - 2, 4, 5);
    g.fillRect(ox + 6 * s, hy - 2, 4, 5);
  } else {
    g.slice(ox, hy, 10.5 * s, Phaser.Math.DegToRad(160), Phaser.Math.DegToRad(380), false).fillPath();
    g.fillRect(ox - 10 * s, hy - 3, 6, 9);
  }
  if (l.extra === 'ponytail') {
    const px = dir === 'side' ? ox - 11 : ox + 9;
    g.fillStyle(c(l.hair)).fillEllipse(px, hy + 5, 6, 12);
    g.fillStyle(0xf2b33d).fillCircle(dir === 'side' ? ox - 8 : ox + 7, hy - 6, 2.6);
  }
  if (l.extra === 'bun') g.fillStyle(c(l.hair)).fillCircle(ox, hy - 10, 4.5);
  if (l.extra === 'cap') {
    g.fillStyle(0x2f7a4a).slice(ox, hy - 1, 11, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false).fillPath();
    if (dir !== 'up') g.fillRect(dir === 'side' ? ox : ox - 9, hy - 3, dir === 'side' ? 12 : 18, 3);
  }
  if (l.extra === 'glasses' && dir !== 'up') {
    g.lineStyle(1.4, 0x3a2a20);
    if (dir === 'down') {
      g.strokeCircle(ox - 4, hy + 1, 3).strokeCircle(ox + 4, hy + 1, 3);
    } else g.strokeCircle(ox + 5, hy + 1, 3);
  }
  // face
  if (dir === 'down') {
    g.fillStyle(0x23313a).fillCircle(ox - 4, hy + 1, 1.6).fillCircle(ox + 4, hy + 1, 1.6);
    g.lineStyle(1.4, 0x7a2e22).beginPath().arc(ox, hy + 4, 3, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160)).strokePath();
    g.fillStyle(0xe86f51, 0.3).fillCircle(ox - 6, hy + 4, 1.8).fillCircle(ox + 6, hy + 4, 1.8);
  } else if (dir === 'side') {
    g.fillStyle(0x23313a).fillCircle(ox + 5, hy + 1, 1.6);
  }
}

function cat(g: G, awake: boolean) {
  g.fillStyle(0x000000, 0.15).fillEllipse(16, 22, 24, 6);
  g.fillStyle(0xf2a65a);
  if (awake) {
    g.fillEllipse(16, 15, 14, 14);
    g.fillCircle(16, 7, 6);
    g.fillTriangle(11, 4, 12, -1, 15, 3).fillTriangle(21, 4, 20, -1, 17, 3);
    g.fillStyle(0x23313a).fillCircle(14, 7, 1).fillCircle(18, 7, 1);
    g.lineStyle(3, 0xf2a65a).beginPath().arc(24, 16, 6, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(90)).strokePath();
  } else {
    g.fillEllipse(16, 17, 22, 11);
    g.fillCircle(9, 15, 5.5);
    g.fillTriangle(5, 12, 6, 8, 9, 11).fillTriangle(11, 11, 12, 7, 14, 11);
    g.lineStyle(1.2, 0x7a4a20).lineBetween(7, 15, 9, 15).lineBetween(10, 15, 12, 15);
    g.lineStyle(3, 0xf2a65a).beginPath().arc(16, 19, 9, Phaser.Math.DegToRad(10), Phaser.Math.DegToRad(150)).strokePath();
  }
  g.fillStyle(0xd98a3a).fillRect(14, 12, 2, 6).fillRect(19, 12, 2, 6);
}

// ─────────────────────────── Buildings + scenery ───────────────────────────
function house(g: G, w: number, h: number, roof: string, wall = '#fff4dd', opts: { awning?: string; saw?: boolean; locked?: boolean } = {}) {
  const roofH = h * 0.45;
  g.fillStyle(0x000000, 0.15).fillRect(8, h - 10, w - 8, 10);
  g.fillStyle(c(wall)).fillRect(10, roofH - 6, w - 20, h - roofH - 4);
  g.lineStyle(2, 0xc9b48a).strokeRect(10, roofH - 6, w - 20, h - roofH - 4);
  g.fillStyle(c(roof)).fillTriangle(0, roofH, w / 2, 0, w, roofH);
  g.fillStyle(0x000000, 0.12).fillTriangle(w / 2, 0, w, roofH, w / 2, roofH);
  // door + windows
  g.fillStyle(opts.locked ? 0xa8a194 : 0x8a5a36).fillRect(w / 2 - 14, h - 52, 28, 48);
  g.fillStyle(opts.locked ? 0xc4bdaf : 0xcfe9f0);
  g.fillRect(24, roofH + 14, 30, 24).fillRect(w - 54, roofH + 14, 30, 24);
  g.lineStyle(2, opts.locked ? 0xa8a194 : 0x8a5a36).strokeRect(24, roofH + 14, 30, 24).strokeRect(w - 54, roofH + 14, 30, 24);
  if (opts.awning) {
    for (let i = 0; i < 8; i++) {
      g.fillStyle(i % 2 ? 0xffffff : c(opts.awning)).fillRect(14 + i * ((w - 28) / 8), roofH - 6, (w - 28) / 8, 14);
    }
  }
  if (opts.saw) {
    // hanging sign with a saw
    g.fillStyle(0x6b4b2f).fillRect(w - 60, roofH + 46, 46, 30);
    g.fillStyle(0xd9d4cc).fillRect(w - 54, roofH + 56, 32, 8);
    g.fillStyle(0x6b4b2f);
    for (let i = 0; i < 6; i++) g.fillTriangle(w - 54 + i * 5.5, roofH + 64, w - 51 + i * 5.5, roofH + 68, w - 48 + i * 5.5, roofH + 64);
    g.fillStyle(0xc9873a).fillRect(w - 22, roofH + 55, 6, 10);
  }
}

function palm(g: G) {
  g.fillStyle(0x000000, 0.15).fillEllipse(30, 92, 34, 9);
  g.lineStyle(7, 0x8a5a36).beginPath().moveTo(30, 92).lineTo(34, 60).lineTo(40, 26).strokePath();
  g.fillStyle(0x3fa36b);
  g.fillEllipse(22, 22, 40, 12).fillEllipse(56, 24, 40, 12).fillEllipse(40, 12, 16, 30).fillEllipse(28, 32, 34, 10).fillEllipse(52, 34, 34, 10);
  g.fillStyle(0x7a5a2e).fillCircle(37, 27, 4).fillCircle(44, 28, 4);
}

function mangoTree(g: G) {
  g.fillStyle(0x000000, 0.15).fillEllipse(40, 86, 50, 12);
  g.fillStyle(0x8a5a36).fillRect(35, 50, 10, 36);
  g.fillStyle(0x3fa36b).fillCircle(40, 34, 30);
  g.fillStyle(0x4cb87a).fillCircle(22, 44, 18).fillCircle(58, 44, 18).fillCircle(40, 22, 18);
  g.fillStyle(0xf6b73c);
  [[26, 30], [52, 26], [44, 48], [30, 52], [60, 50]].forEach(([x, y]) => g.fillEllipse(x, y, 7, 9));
}

function bush(g: G) {
  g.fillStyle(0x000000, 0.12).fillEllipse(20, 30, 34, 8);
  g.fillStyle(0x3fa36b).fillCircle(12, 20, 11).fillCircle(28, 20, 11).fillCircle(20, 13, 11);
  g.fillStyle(0xe98fb0).fillCircle(14, 15, 2.5).fillCircle(26, 18, 2.5);
}

// ─────────────────────────── Items ───────────────────────────
function itemArt(g: G, id: string) {
  g.fillStyle(0x000000, 0.15).fillEllipse(18, 31, 26, 6);
  switch (id) {
    case 'longBamboo':
      g.fillStyle(0xb9874f).fillRoundedRect(2, 15, 32, 5, 2);
      g.fillStyle(0x8a5a36).fillRect(11, 15, 2, 5).fillRect(22, 15, 2, 5);
      break;
    case 'shortBamboo':
      g.fillStyle(0xb9874f).fillRoundedRect(12, 15, 13, 5, 2);
      g.fillStyle(0x8a5a36).fillRect(18, 15, 2, 5);
      break;
    case 'redPaper':
      g.fillStyle(0xd94a3a).fillRect(8, 6, 20, 22);
      g.fillStyle(0xffffff, 0.25).fillTriangle(8, 6, 16, 6, 8, 14);
      break;
    case 'bluePaper':
      g.fillStyle(0x4f7fd6).fillRect(8, 6, 20, 22);
      g.fillStyle(0xffffff, 0.25).fillTriangle(8, 6, 16, 6, 8, 14);
      break;
    case 'glueJar':
      g.fillStyle(0xe8f1f2).fillRoundedRect(10, 12, 16, 16, 3);
      g.fillStyle(0xf2b33d).fillRect(9, 8, 18, 5);
      g.fillStyle(0xffffff).fillRect(12, 17, 12, 6);
      break;
    case 'soyBottle':
      g.fillStyle(0x3a2420).fillRoundedRect(12, 8, 12, 21, 3).fillRect(15, 2, 6, 8);
      g.fillStyle(0xe86f51).fillRect(12, 15, 12, 6);
      break;
    case 'slipper':
      g.fillStyle(0x4f7fd6).fillEllipse(18, 18, 14, 26);
      g.lineStyle(2, 0xf2b33d).lineBetween(12, 13, 18, 18).lineBetween(24, 13, 18, 18);
      break;
  }
}

// ─────────────────────────── Ground (whole map in one texture) ───────────────────────────
export const WORLD_W = 960;
export const WORLD_H = 1440;

function ground(g: G) {
  g.fillStyle(0xcfe7c2).fillRect(0, 0, WORLD_W, WORLD_H);
  // grass speckles (fixed pattern)
  let seed = 7;
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  g.fillStyle(0xb9dbab);
  for (let i = 0; i < 520; i++) g.fillRect(r() * WORLD_W, 330 + r() * (WORLD_H - 330), 3, 2);
  // sea + beach
  g.fillStyle(0x8fcbe0).fillRect(0, 0, WORLD_W, 150);
  g.fillStyle(0x7bbcd6).fillRect(0, 0, WORLD_W, 70);
  g.fillStyle(0xf1dfb3).fillRect(0, 150, WORLD_W, 180);
  for (let x = 0; x < WORLD_W; x += 40) g.fillStyle(0xf1dfb3).fillCircle(x + 20, 150, 22);
  g.fillStyle(0xe6cf9c);
  for (let i = 0; i < 90; i++) g.fillCircle(r() * WORLD_W, 175 + r() * 140, 1.6);
  // roads
  g.fillStyle(0xe9d7ae).fillRect(0, 632, WORLD_W, 58).fillRect(452, 600, 56, WORLD_H - 600);
  g.fillRect(170, 690, 40, 70).fillRect(750, 690, 40, 70).fillRect(170, 1290, 40, 40).fillRect(730, 1290, 40, 40);
  g.fillRect(208, 1330, 244, 34).fillRect(508, 1330, 260, 34);
  g.lineStyle(2, 0xd9c494);
  for (let x = 20; x < WORLD_W; x += 60) g.lineBetween(x, 661, x + 26, 661);
  // plaza hedge ring (drawn; blocked by colliders)
  g.fillStyle(0x3fa36b);
  g.fillRoundedRect(292, 352, 376, 16, 8);
  g.fillRoundedRect(292, 352, 16, 256, 8).fillRoundedRect(652, 352, 16, 256, 8);
  g.fillRoundedRect(292, 592, 160, 16, 8).fillRoundedRect(508, 592, 160, 16, 8);
  // yard fences
  g.fillStyle(0xc9a86a);
  for (let x = 60; x < 360; x += 14) g.fillRect(x, 1420, 8, 14);
  for (let x = 600; x < 900; x += 14) g.fillRect(x, 1420, 8, 14);
  // flower patches
  for (let i = 0; i < 40; i++) {
    const fx = r() * WORLD_W;
    const fy = 720 + r() * 680;
    if (fx > 440 && fx < 520) continue;
    g.fillStyle([0xe98fb0, 0xf2b33d, 0xffffff, 0xa066c9][i % 4]).fillCircle(fx, fy, 2.6);
  }
}

function plaza(g: G, on: boolean) {
  const W = 344;
  const H = 224;
  g.fillStyle(on ? 0xf3dfb5 : 0xdcd6c8).fillRoundedRect(0, 0, W, H, 14);
  g.lineStyle(2, on ? 0xe2c993 : 0xc9c2b2);
  for (let x = 0; x <= W; x += 43) g.lineBetween(x, 0, x, H);
  for (let y = 0; y <= H; y += 43) g.lineBetween(0, y, W, y);
  // stage
  g.fillStyle(on ? 0xe86f51 : 0xb8b0a2).fillRect(W / 2 - 60, 18, 120, 44);
  g.fillStyle(on ? 0x2f9c8a : 0x9e978a).fillTriangle(W / 2 - 70, 18, W / 2, -2, W / 2 + 70, 18);
  // planters
  for (const [x, y] of [[30, 30], [W - 30, 30], [30, H - 30], [W - 30, H - 30]]) {
    g.fillStyle(on ? 0xa8652e : 0xa59c8e).fillRect(x - 14, y - 6, 28, 18);
    g.fillStyle(on ? 0x4cb87a : 0x9aa392).fillCircle(x, y - 8, 14);
    if (on) g.fillStyle(0xe98fb0).fillCircle(x - 5, y - 12, 3).fillCircle(x + 6, y - 6, 3);
  }
  if (!on) {
    g.lineStyle(2, 0xb4ac9c);
    g.lineBetween(90, 120, 110, 140).lineBetween(110, 140, 104, 160).lineBetween(230, 100, 250, 118);
  } else {
    // bunting
    g.lineStyle(1.5, 0x6b4b2f).beginPath().moveTo(10, 80).lineTo(W / 2, 96).lineTo(W - 10, 80).strokePath();
    for (let i = 0; i < 16; i++) {
      const x = 18 + i * 20;
      const y = 82 + (x < W / 2 ? (x / (W / 2)) * 14 : ((W - x) / (W / 2)) * 14);
      g.fillStyle([0xe86f51, 0xf2b33d, 0x2f9c8a, 0x5b7fd6][i % 4]).fillTriangle(x - 6, y, x + 6, y, x, y + 12);
    }
  }
}

// ─────────────────────────── Race art ───────────────────────────
function bird(g: G, up: boolean) {
  g.fillStyle(0x3a4a5a);
  g.fillEllipse(20, 14, 16, 9);
  g.fillCircle(29, 12, 5);
  g.fillStyle(0xf2b33d).fillTriangle(33, 11, 39, 13, 33, 14);
  g.fillStyle(0x23313a).fillCircle(30, 11, 1.2);
  g.fillStyle(0x4a5a6a);
  if (up) g.fillTriangle(14, 12, 24, 12, 16, 0);
  else g.fillTriangle(14, 14, 24, 14, 16, 26);
}

function gust(g: G) {
  g.lineStyle(4, 0xffffff, 0.75);
  for (let i = 0; i < 4; i++) {
    const y = 10 + i * 12;
    g.beginPath().moveTo(6 + i * 10, y).lineTo(120 - i * 6, y).strokePath();
    g.beginPath().arc(120 - i * 6, y + 5, 5, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(90)).strokePath();
  }
}

function cloud(g: G) {
  g.fillStyle(0xffffff, 0.9).fillCircle(30, 30, 20).fillCircle(55, 24, 24).fillCircle(80, 32, 18).fillRoundedRect(14, 30, 80, 20, 10);
}

/** Make every texture the game needs. */
export function makeTextures(scene: Phaser.Scene) {
  for (const [id, l] of Object.entries(looks)) {
    for (const dir of ['down', 'up', 'side'] as Dir[]) {
      for (const f of [0, 1, 2]) tex(scene, `${id}-${dir}-${f}`, 32, 46, (g) => person(g, l, dir, f));
    }
  }
  tex(scene, 'cat-sleep', 32, 26, (g) => cat(g, false));
  tex(scene, 'cat-awake', 32, 26, (g) => cat(g, true));
  tex(scene, 'bld-store', 240, 170, (g) => house(g, 240, 170, '#4f7fd6', '#fff4dd', { awning: '#4f7fd6' }));
  tex(scene, 'bld-tala', 240, 170, (g) => house(g, 240, 170, '#d9573f'));
  tex(scene, 'bld-nonoy', 240, 170, (g) => house(g, 240, 170, '#2f9c8a', '#f6ead2'));
  tex(scene, 'bld-workshop', 240, 170, (g) => house(g, 240, 170, '#8a5a36', '#e8d2ad', { saw: true }));
  tex(scene, 'bld-locked', 160, 140, (g) => house(g, 160, 140, '#bdb6a8', '#d8d3c8', { locked: true }));
  tex(scene, 'palm', 70, 96, palm);
  tex(scene, 'mango', 80, 90, mangoTree);
  tex(scene, 'bush', 40, 36, bush);
  tex(scene, 'boat', 120, 50, (g) => {
    g.fillStyle(0x000000, 0.15).fillEllipse(60, 44, 110, 10);
    g.fillStyle(0xc9733a).fillRoundedRect(6, 14, 108, 26, 12);
    g.fillStyle(0xe86f51).fillRect(14, 18, 92, 6);
    g.fillStyle(0xf6ead2).fillRect(40, 26, 40, 8);
    g.lineStyle(3, 0x8a5a36).lineBetween(0, 28, 6, 28).lineBetween(114, 28, 120, 28);
  });
  tex(scene, 'basket', 36, 30, (g) => {
    g.fillStyle(0x000000, 0.15).fillEllipse(18, 27, 30, 6);
    g.fillStyle(0xc9873a).fillRoundedRect(4, 10, 28, 17, 4);
    g.lineStyle(1.5, 0x8a5a36).lineBetween(4, 16, 32, 16).lineBetween(4, 21, 32, 21);
    g.fillStyle(0xd94a3a).fillCircle(11, 9, 5).fillCircle(19, 8, 5).fillCircle(26, 10, 4);
  });
  tex(scene, 'bench', 64, 30, (g) => {
    g.fillStyle(0x000000, 0.15).fillRect(4, 24, 58, 5);
    g.fillStyle(0x8a5a36).fillRect(2, 6, 60, 8).fillRect(6, 14, 6, 12).fillRect(52, 14, 6, 12);
    g.fillStyle(0xa8703f).fillRect(2, 2, 60, 5);
  });
  tex(scene, 'gate-closed', 64, 46, (g) => {
    g.fillStyle(0x6b4b2f).fillRect(0, 4, 6, 42).fillRect(58, 4, 6, 42);
    g.fillStyle(0xc9a86a);
    for (let x = 8; x < 56; x += 8) g.fillRect(x, 12, 5, 30);
    g.fillRect(6, 18, 52, 4).fillRect(6, 32, 52, 4);
    g.fillStyle(0xe86f51).fillCircle(32, 26, 6);
  });
  tex(scene, 'gate-open', 64, 46, (g) => {
    g.fillStyle(0x6b4b2f).fillRect(0, 4, 6, 42).fillRect(58, 4, 6, 42);
    g.fillStyle(0xc9a86a).fillRect(6, 12, 8, 30).fillRect(50, 12, 8, 30);
  });
  tex(scene, 'chicken', 24, 22, (g) => {
    g.fillStyle(0x000000, 0.15).fillEllipse(12, 20, 16, 4);
    g.fillStyle(0xffffff).fillEllipse(11, 12, 16, 12);
    g.fillCircle(18, 7, 4.5);
    g.fillStyle(0xe86f51).fillTriangle(17, 2, 19, 0, 21, 3);
    g.fillStyle(0xf2b33d).fillTriangle(22, 7, 25, 8, 22, 9).fillRect(9, 17, 2, 4).fillRect(13, 17, 2, 4);
    g.fillStyle(0x23313a).fillCircle(19, 6, 0.9);
  });
  tex(scene, 'butterfly', 14, 12, (g) => {
    g.fillStyle(0xf2b33d).fillEllipse(4, 4, 7, 7).fillEllipse(10, 4, 7, 7);
    g.fillStyle(0xe86f51).fillEllipse(4, 9, 5, 5).fillEllipse(10, 9, 5, 5);
    g.fillStyle(0x23313a).fillRect(6.5, 2, 1, 9);
  });
  tex(scene, 'wave', 40, 8, (g) => {
    g.lineStyle(2, 0xe8f6fa).beginPath().arc(10, 8, 8, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340)).strokePath();
    g.beginPath().arc(28, 8, 8, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340)).strokePath();
  });
  tex(scene, 'sign-lock', 26, 26, (g) => {
    g.fillStyle(0xffffff).fillCircle(13, 13, 13);
    g.fillStyle(0x5d6b73).fillRoundedRect(7, 12, 12, 9, 2);
    g.lineStyle(2.4, 0x5d6b73).beginPath().arc(13, 12, 4, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360)).strokePath();
  });
  tex(scene, 'zzz', 12, 12, (g) => {
    g.lineStyle(2, 0x5d6b73).lineBetween(2, 2, 10, 2).lineBetween(10, 2, 2, 10).lineBetween(2, 10, 10, 10);
  });
  for (const id of ['longBamboo', 'shortBamboo', 'redPaper', 'bluePaper', 'glueJar', 'soyBottle', 'slipper']) {
    tex(scene, `item-${id}`, 36, 34, (g) => itemArt(g, id));
  }
  tex(scene, 'sparkle', 16, 16, (g) => {
    g.fillStyle(0xfff3b0).fillTriangle(8, 0, 10, 8, 6, 8).fillTriangle(8, 16, 10, 8, 6, 8).fillTriangle(0, 8, 8, 6, 8, 10).fillTriangle(16, 8, 8, 6, 8, 10);
    g.fillStyle(0xffffff).fillCircle(8, 8, 2);
  });
  tex(scene, 'dot', 8, 8, (g) => g.fillStyle(0xffffff).fillCircle(4, 4, 4));
  tex(scene, 'confetti', 6, 10, (g) => g.fillStyle(0xffffff).fillRect(0, 0, 6, 10));
  tex(scene, 'ground', WORLD_W, WORLD_H, ground);
  tex(scene, 'plaza-off', 344, 224, (g) => plaza(g, false));
  tex(scene, 'plaza-on', 344, 224, (g) => plaza(g, true));
  tex(scene, 'bird-0', 40, 28, (g) => bird(g, true));
  tex(scene, 'bird-1', 40, 28, (g) => bird(g, false));
  tex(scene, 'gust', 130, 60, gust);
  tex(scene, 'cloud', 110, 60, cloud);
}

/** Walking animations (made once). */
export function makeAnims(scene: Phaser.Scene) {
  for (const id of Object.keys(looks)) {
    for (const dir of ['down', 'up', 'side'] as Dir[]) {
      const key = `${id}-walk-${dir}`;
      if (scene.anims.exists(key)) continue;
      scene.anims.create({
        key,
        frames: [1, 0, 2, 0].map((f) => ({ key: `${id}-${dir}-${f}` })),
        frameRate: 8,
        repeat: -1,
      });
    }
  }
  if (!scene.anims.exists('bird-flap')) {
    scene.anims.create({ key: 'bird-flap', frames: [{ key: 'bird-0' }, { key: 'bird-1' }], frameRate: 6, repeat: -1 });
  }
}
