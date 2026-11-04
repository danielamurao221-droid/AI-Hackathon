/*
 * The barangay map: places, who lives there, and what they say when tapped.
 * STATUS: reviewed: false. Places with `level` are restored by that level.
 * Locked places are future neighbours and show "Malapit na / Coming soon".
 */
import type { Bi, CharId, PlaceId } from '../types';

export interface Place {
  id: PlaceId;
  name: Bi;
  /** Centre of the place on the map, 0-100 (% of width / height). */
  x: number;
  y: number;
  locked?: boolean;
  /** Level that restores this place. */
  level?: number;
  who?: CharId;
  greeting?: Bi;
}

export const BARANGAY_META = { reviewed: false };

export const places: Place[] = [
  { id: 'plaza', name: { fil: 'Plaza', en: 'Plaza' }, x: 50, y: 47, level: 1 },
  {
    id: 'talaHome',
    name: { fil: 'Bahay ni Tala', en: 'Tala’s home' },
    x: 25,
    y: 74,
    who: 'tala',
    greeting: { fil: 'Tara sa plaza! Kailangan ko ng tulong mo.', en: 'Let’s go to the plaza! I need your help.' },
  },
  {
    id: 'workshop',
    name: { fil: 'Pagawaan ni Lolo Ben', en: 'Lolo Ben’s workshop' },
    x: 76,
    y: 74,
    who: 'lolo',
    greeting: { fil: 'Magandang araw, apo! May kawayan ako rito.', en: 'Good day! I have bamboo here.' },
  },
  {
    id: 'nonoyHome',
    name: { fil: 'Bahay ni Nonoy', en: 'Nonoy’s house' },
    x: 15,
    y: 47,
    who: 'nonoy',
    greeting: { fil: 'Hi! Mahilig din ako sa saranggola!', en: 'Hi! I like kites too!' },
  },
  { id: 'school', name: { fil: 'Paaralan', en: 'School' }, x: 22, y: 22, locked: true },
  { id: 'market', name: { fil: 'Palengke', en: 'Market' }, x: 78, y: 22, locked: true },
  { id: 'court', name: { fil: 'Basketbolan', en: 'Basketball court' }, x: 85, y: 47, locked: true },
  { id: 'library', name: { fil: 'Aklatan', en: 'Library' }, x: 50, y: 91, locked: true },
];
