import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { logger } from '../logger';

export interface Registration {
  userId: number;
  eventId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  city: string;
  registeredAt: string;
  qrScan?: string;
}

const STORAGE_PATH = path.join(config.dataDir, 'registrations.json');

export class RegistrationStorage {
  private registrations: Registration[] = [];

  constructor() {
    this.load();
    this.migrateOldData();
  }

  private ensureDataDir() {
    const dir = path.dirname(STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info('Created data directory:', dir);
    }
  }

  private load() {
    this.ensureDataDir();
    if (fs.existsSync(STORAGE_PATH)) {
      try {
        const data = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8'));
        this.registrations = Array.isArray(data) ? data : [];
        logger.info('Loaded registrations:', this.registrations.length);
      } catch (error) {
        logger.error('Failed to load registrations:', error);
        this.registrations = [];
      }
    }
  }

  private migrateOldData() {
    // Migrate old registrations without eventId to default event
    let needsSave = false;
    for (const reg of this.registrations) {
      if (!reg.eventId) {
        reg.eventId = 'default';
        needsSave = true;
      }
    }
    if (needsSave) {
      logger.info('Migrated old registrations to default event');
      this.save();
    }
  }

  private save() {
    this.ensureDataDir();
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(this.registrations, null, 2), 'utf-8');
    logger.debug('Saved registrations:', this.registrations.length);
  }

  isRegistered(userId: number, eventId: string): boolean {
    return this.registrations.some(r => r.userId === userId && r.eventId === eventId);
  }

  register(userId: number, eventId: string, city: string, userInfo: { username?: string; firstName?: string; lastName?: string }): Registration {
    const registration: Registration = {
      userId,
      eventId,
      username: userInfo.username,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      city,
      registeredAt: new Date().toISOString(),
    };
    this.registrations.push(registration);
    this.save();
    logger.info('New registration:', { userId, eventId, city });
    return registration;
  }

  getRegistration(userId: number, eventId: string): Registration | undefined {
    return this.registrations.find(r => r.userId === userId && r.eventId === eventId);
  }

  getAllRegistrations(eventId?: string): Registration[] {
    if (eventId) {
      return this.registrations.filter(r => r.eventId === eventId);
    }
    return this.registrations;
  }

  getStats(eventId?: string): { total: number; byCities: Record<string, number> } {
    const all = this.getAllRegistrations(eventId);
    const byCities: Record<string, number> = {};

    for (const reg of all) {
      byCities[reg.city] = (byCities[reg.city] || 0) + 1;
    }

    return {
      total: all.length,
      byCities: Object.fromEntries(
        Object.entries(byCities).sort((a, b) => b[1] - a[1])
      ),
    };
  }
}
