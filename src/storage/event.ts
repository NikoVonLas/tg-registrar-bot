import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import { config } from '../config';
import { logger } from '../logger';

export interface Event {
  id: string;
  name: string;
  createdAt: string;
  createdBy: number;
  active: boolean;
}

const EVENTS_FILE = path.join(config.dataDir, 'events.json');
const DEFAULT_EVENT_ID = 'default';

export class EventStorage {
  private events: Map<string, Event> = new Map();

  constructor() {
    this.ensureDataDir();
    this.load();
    this.ensureDefaultEvent();
  }

  private ensureDataDir() {
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
      logger.info('Created data directory:', config.dataDir);
    }
  }

  private ensureDefaultEvent() {
    if (!this.events.has(DEFAULT_EVENT_ID)) {
      this.createEvent('Default Event', 0, DEFAULT_EVENT_ID);
      logger.info('Created default event');
    }
  }

  private load() {
    if (fs.existsSync(EVENTS_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
        this.events = new Map(data.map((e: Event) => [e.id, e]));
        logger.info('Loaded events:', this.events.size);
      } catch (error) {
        logger.error('Failed to load events:', error);
      }
    }
  }

  private save() {
    fs.writeFileSync(
      EVENTS_FILE,
      JSON.stringify(Array.from(this.events.values()), null, 2)
    );
    logger.debug('Saved events:', this.events.size);
  }

  private generateId(): string {
    return randomBytes(8).toString('hex');
  }

  createEvent(name: string, createdBy: number, id?: string): Event {
    const event: Event = {
      id: id || this.generateId(),
      name,
      createdAt: new Date().toISOString(),
      createdBy,
      active: true,
    };
    this.events.set(event.id, event);
    this.save();
    logger.info('Created event:', { id: event.id, name: event.name, createdBy });
    return event;
  }

  getEvent(id: string): Event | undefined {
    return this.events.get(id);
  }

  getAllEvents(): Event[] {
    return Array.from(this.events.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getActiveEvents(): Event[] {
    return this.getAllEvents().filter(e => e.active);
  }

  deleteEvent(id: string): boolean {
    if (id === DEFAULT_EVENT_ID) {
      logger.warn('Attempt to delete default event');
      return false;
    }
    const deleted = this.events.delete(id);
    if (deleted) {
      this.save();
      logger.info('Deleted event:', id);
    }
    return deleted;
  }

  toggleActive(id: string): boolean {
    const event = this.events.get(id);
    if (!event || id === DEFAULT_EVENT_ID) return false;
    event.active = !event.active;
    this.save();
    logger.info('Toggled event active status:', { id, active: event.active });
    return true;
  }

  getDefaultEventId(): string {
    return DEFAULT_EVENT_ID;
  }
}
