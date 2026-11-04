// Creates the Phaser game inside a DOM element. Loaded lazily, only for the student game.
import Phaser from 'phaser';
import { RaceScene } from './RaceScene';
import { WorldScene } from './WorldScene';

export type GameMode = 'world' | 'race';

export function createGame(parent: HTMLElement, mode: GameMode): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#cfe7c2',
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth || 360, height: parent.clientHeight || 600 },
    physics: { default: 'arcade', arcade: { debug: false } },
    input: { activePointers: 2 },
    render: { antialias: true, powerPreference: 'low-power' },
    fps: { target: 60, min: 20 },
    scene: [],
  });
  game.scene.add('world', WorldScene, mode === 'world');
  game.scene.add('race', RaceScene, mode === 'race');
  return game;
}

/** Switch between the barangay and the race without reloading the game. */
export function showMode(game: Phaser.Game, mode: GameMode) {
  const other = mode === 'world' ? 'race' : 'world';
  if (game.scene.isActive(other) || game.scene.isPaused(other)) game.scene.stop(other);
  if (mode === 'race' && game.scene.isActive('race')) {
    game.scene.getScene('race').scene.restart();
    return;
  }
  if (!game.scene.isActive(mode)) game.scene.start(mode);
}
