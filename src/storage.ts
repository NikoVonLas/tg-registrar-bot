import * as fs from 'fs';
import * as path from 'path';

export interface Registration {
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  city: string;
  registeredAt: string;
  qrScan?: string;
}

const STORAGE_PATH = path.join(process.cwd(), 'data', 'registrations.json');

export class RegistrationStorage {
  private registrations: Map<number, Registration> = new Map();

  constructor() {
    this.load();
  }

  private ensureDataDir() {
    const dir = path.dirname(STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private load() {
    this.ensureDataDir();
    if (fs.existsSync(STORAGE_PATH)) {
      try {
        const data = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8'));
        this.registrations = new Map(data.map((r: Registration) => [r.userId, r]));
      } catch (error) {
        console.error('Failed to load registrations:', error);
      }
    }
  }

  private save() {
    this.ensureDataDir();
    const data = Array.from(this.registrations.values());
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  }

  isRegistered(userId: number): boolean {
    return this.registrations.has(userId);
  }

  register(userId: number, city: string, userInfo: { username?: string; firstName?: string; lastName?: string }): Registration {
    const registration: Registration = {
      userId,
      username: userInfo.username,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      city,
      registeredAt: new Date().toISOString(),
    };
    this.registrations.set(userId, registration);
    this.save();
    return registration;
  }

  getRegistration(userId: number): Registration | undefined {
    return this.registrations.get(userId);
  }

  getAllRegistrations(): Registration[] {
    return Array.from(this.registrations.values());
  }

  getStats(): { total: number; byCities: Record<string, number> } {
    const all = this.getAllRegistrations();
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
