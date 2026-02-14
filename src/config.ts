import * as fs from 'fs';
import * as path from 'path';
import { getSDK } from './sdk';

// Get SDK config (async)
export async function getConfig() {
  const sdk = await getSDK();
  return {
    // SDK provided
    token: sdk.config.token,
    ownerId: sdk.config.ownerId,
    adminIds: sdk.config.adminIds,
    botId: sdk.config.botId,
    port: sdk.config.port,
    webhookUrl: sdk.config.webhookUrl,
    managerUrl: sdk.config.managerUrl,

    // Custom config from configKeys
    language: (sdk.config.language || 'ru-RU') as 'en-US' | 'ru-RU',
    debug: sdk.config.debug === 'true' || sdk.config.debug === true,
    dataDir: path.join(process.cwd(), 'data'),
  };
}

// Synchronous config for immediate use (with defaults)
export const config = {
  dataDir: path.join(process.cwd(), 'data'),
  language: 'ru-RU' as 'en-US' | 'ru-RU',
  debug: false,
};

// Ensure data directory exists
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

// Initialize config when SDK is ready
getSDK().then(sdk => {
  config.language = (sdk.config.language || 'ru-RU') as 'en-US' | 'ru-RU';
  config.debug = sdk.config.debug === 'true' || sdk.config.debug === true;
}).catch(err => {
  console.error('Failed to load config from SDK:', err);
});
