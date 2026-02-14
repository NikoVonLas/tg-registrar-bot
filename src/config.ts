import * as fs from 'fs';
import * as path from 'path';

// Validate required environment variables
export const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN environment variable is required");
}

// Parse admin IDs
const adminIds: string[] = [];
if (process.env.BOT_OWNER_ID) {
  adminIds.push(process.env.BOT_OWNER_ID);
}
if (process.env.BOT_ADMIN_IDS) {
  adminIds.push(...process.env.BOT_ADMIN_IDS.split(',').map(id => id.trim()));
}

// Configuration object
export const config = {
  token: BOT_TOKEN,
  ownerId: process.env.BOT_OWNER_ID,
  adminIds,
  language: (process.env.LANGUAGE || 'en-US') as 'en-US' | 'ru-RU',
  debug: process.env.DEBUG === 'true',
  dataDir: path.join(process.cwd(), 'data'),
} as const;

// Ensure data directory exists
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}
