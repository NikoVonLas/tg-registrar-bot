import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import { DATA_DIR } from '@/constants';
import { log } from '@/utils/sdk-helpers';

export interface Event {
  id: string;
  name: string;
  createdAt: string;
  createdBy: number;
  active: boolean;
}

const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

export class EventStorage {
  private events: Map<string, Event> = new Map();

  constructor() {
    this.ensureDataDir();
    this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      log.info('Created data directory:', DATA_DIR);
    }
  }


  private load() {
    if (fs.existsSync(EVENTS_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
        this.events = new Map(data.map((e: Event) => [e.id, e]));
        log.info('Loaded events:', this.events.size);
      } catch (error) {
        log.error('Failed to load events:', error);
      }
    }
  }

  private save() {
    fs.writeFileSync(
      EVENTS_FILE,
      JSON.stringify(Array.from(this.events.values()), null, 2)
    );
    log.debug('Saved events:', this.events.size);
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
    log.info('Created event:', { id: event.id, name: event.name, createdBy });
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
    const deleted = this.events.delete(id);
    if (deleted) {
      this.save();
      log.info('Deleted event:', id);
    }
    return deleted;
  }

  toggleActive(id: string): boolean {
    const event = this.events.get(id);
    if (!event) return false;
    event.active = !event.active;
    this.save();
    log.info('Toggled event active status:', { id, active: event.active });
    return true;
  }
}
