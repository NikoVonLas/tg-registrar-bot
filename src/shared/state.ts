import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR } from '@/constants';
import { log } from '@/utils/sdk-helpers';

export interface UserState {
  action: string;
  data?: any;
  timestamp: number;
}

const STATE_FILE = path.join(DATA_DIR, 'user-states.json');
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds
const STATE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export class UserStateManager {
  private states = new Map<number, UserState>();
  private autoSaveTimer?: NodeJS.Timeout;

  constructor() {
    this.load();
    this.startAutoSave();
    this.cleanupOldStates();
  }

  private load() {
    if (!fs.existsSync(STATE_FILE)) return;

    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      this.states = new Map(Object.entries(data).map(([k, v]) => [Number(k), v as UserState]));
      log.info('Loaded user states:', this.states.size);
    } catch (error) {
      log.error('Failed to load user states:', error);
      this.states = new Map();
    }
  }

  private save() {
    try {
      const data = Object.fromEntries(this.states);
      fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf-8');
      log.debug('Saved user states:', this.states.size);
    } catch (error) {
      log.error('Failed to save user states:', error);
    }
  }

  private startAutoSave() {
    this.autoSaveTimer = setInterval(() => {
      if (this.states.size > 0) {
        this.save();
      }
    }, AUTO_SAVE_INTERVAL);
  }

  private cleanupOldStates() {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, state] of this.states) {
      if (now - state.timestamp > STATE_TTL) {
        this.states.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      log.info(`Cleaned up ${cleaned} old user states`);
      this.save();
    }
  }

  get(userId: number): UserState | undefined {
    return this.states.get(userId);
  }

  set(userId: number, action: string, data?: any) {
    this.states.set(userId, {
      action,
      data,
      timestamp: Date.now(),
    });
    log.debug(`Set user state: userId=${userId}, action=${action}`);
  }

  delete(userId: number) {
    const deleted = this.states.delete(userId);
    if (deleted) {
      log.debug(`Deleted user state: userId=${userId}`);
    }
  }

  cleanup() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    this.save();
  }
}
