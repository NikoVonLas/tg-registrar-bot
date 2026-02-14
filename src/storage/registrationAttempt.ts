import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { logger } from '../logger';

export interface RegistrationAttempt {
  userId: number;
  eventId: string;
  startedAt: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

const ATTEMPTS_FILE = path.join(config.dataDir, 'registration-attempts.json');

export class RegistrationAttemptStorage {
  private attempts: Map<string, RegistrationAttempt> = new Map();

  constructor() {
    this.load();
  }

  private load() {
    if (!fs.existsSync(ATTEMPTS_FILE)) return;

    try {
      const data = JSON.parse(fs.readFileSync(ATTEMPTS_FILE, 'utf-8'));
      this.attempts = new Map(
        data.map((a: RegistrationAttempt) => [this.getKey(a.userId, a.eventId), a])
      );
      logger.info('Loaded registration attempts:', this.attempts.size);
    } catch (error) {
      logger.error('Failed to load registration attempts:', error);
      this.attempts = new Map();
    }
  }

  private save() {
    try {
      const data = Array.from(this.attempts.values());
      fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      logger.debug('Saved registration attempts:', this.attempts.size);
    } catch (error) {
      logger.error('Failed to save registration attempts:', error);
    }
  }

  private getKey(userId: number, eventId: string): string {
    return `${userId}:${eventId}`;
  }

  recordAttempt(
    userId: number,
    eventId: string,
    userInfo: { username?: string; firstName?: string; lastName?: string }
  ) {
    const key = this.getKey(userId, eventId);
    const attempt: RegistrationAttempt = {
      userId,
      eventId,
      startedAt: new Date().toISOString(),
      username: userInfo.username,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
    };
    this.attempts.set(key, attempt);
    this.save();
    logger.debug('Recorded registration attempt:', { userId, eventId });
  }

  removeAttempt(userId: number, eventId: string) {
    const key = this.getKey(userId, eventId);
    const removed = this.attempts.delete(key);
    if (removed) {
      this.save();
      logger.debug('Removed registration attempt:', { userId, eventId });
    }
  }

  getAttemptsByEvent(eventId: string): RegistrationAttempt[] {
    return Array.from(this.attempts.values()).filter(a => a.eventId === eventId);
  }

  getAttemptCount(eventId: string): number {
    return this.getAttemptsByEvent(eventId).length;
  }
}
