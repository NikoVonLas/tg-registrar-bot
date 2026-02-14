import * as fs from 'fs';
import * as path from 'path';
import { BotConfig, loadConfig as loadSDKConfig } from '@nikovonlas/bot-sdk';

// Load config from SDK
const sdkConfig = loadSDKConfig();

// Validate required environment variables
if (!sdkConfig.token) {
  throw new Error("BOT_TOKEN environment variable is required");
}

// Configuration object with SDK config + custom fields
export const config = {
  // SDK provided
  token: sdkConfig.token,
  ownerId: sdkConfig.ownerId,
  adminIds: sdkConfig.adminIds,
  botId: sdkConfig.botId,
  port: sdkConfig.port,
  webhookUrl: sdkConfig.webhookUrl,
  managerUrl: sdkConfig.managerUrl,

  // Custom config from env
  language: (sdkConfig.env.LANGUAGE || 'ru-RU') as 'en-US' | 'ru-RU',
  debug: sdkConfig.env.DEBUG === 'true',
  dataDir: path.join(process.cwd(), 'data'),
} as const;

// Ensure data directory exists
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

// Export SDK config for other modules
export { sdkConfig };
