import { SAVE_KEY, SAVE_VERSION } from '../config/GameConfig';
import type { CharacterId, SkillId } from '../types';
import { defaultSave, type SaveData } from './SaveTypes';

/**
 * Singleton that owns the in-memory save object and syncs it to localStorage.
 * All mutations go through this class so persistence is always consistent.
 */
class SaveService {
  private data: SaveData;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return this.migrate(parsed);
    } catch {
      return defaultSave();
    }
  }

  /** Fill in missing fields from newer versions and bump the version number. */
  private migrate(raw: Partial<SaveData>): SaveData {
    const def = defaultSave();
    const save: SaveData = {
      version: SAVE_VERSION,
      profile: { ...def.profile, ...(raw.profile ?? {}) },
      upgrades: { ...def.upgrades, ...(raw.upgrades ?? {}) },
      characters: raw.characters ?? def.characters
    };
    // Ranger is always owned.
    if (!save.characters.includes('ranger')) save.characters.push('ranger');
    this.persist(save);
    return save;
  }

  private persist(save: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // localStorage may be unavailable in some environments — fail silently.
    }
  }

  get(): SaveData {
    return this.data;
  }

  addCoins(amount: number): void {
    this.data.profile.coins += amount;
    this.persist(this.data);
  }

  spendCoins(amount: number): boolean {
    if (this.data.profile.coins < amount) return false;
    this.data.profile.coins -= amount;
    this.persist(this.data);
    return true;
  }

  setSkillLevel(id: SkillId, level: number): void {
    this.data.upgrades[id] = level;
    this.persist(this.data);
  }

  unlockCharacter(id: CharacterId): void {
    if (!this.data.characters.includes(id)) {
      this.data.characters.push(id);
      this.persist(this.data);
    }
  }

  equipCharacter(id: CharacterId): void {
    this.data.profile.equippedCharacter = id;
    this.persist(this.data);
  }

  /** Wipe the save — useful for testing; not exposed to players in this milestone. */
  reset(): void {
    this.data = defaultSave();
    this.persist(this.data);
  }
}

// Singleton instance exported for use across all scenes.
export const saveService = new SaveService();
