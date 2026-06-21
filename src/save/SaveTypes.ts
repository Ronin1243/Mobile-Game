import { SAVE_VERSION } from '../config/GameConfig';
import type { CharacterId, SkillId } from '../types';

export interface SaveProfile {
  coins: number;
  gems: number;
  equippedCharacter: CharacterId;
}

export type SkillLevels = Record<SkillId, number>;

export interface SaveData {
  version: number;
  profile: SaveProfile;
  upgrades: SkillLevels;
  /** Owned character ids. Ranger is always owned. */
  characters: CharacterId[];
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    profile: {
      coins: 0,
      gems: 0,
      equippedCharacter: 'ranger'
    },
    upgrades: {
      vitality: 0,
      power: 0,
      swiftness: 0,
      magnetism: 0,
      greed: 0,
      headStart: 0,
      secondWind: 0
    },
    characters: ['ranger']
  };
}
