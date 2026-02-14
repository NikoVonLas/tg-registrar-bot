import { getSDK } from './sdk';

// Helper to ensure metadata is an object
function normalizeMetadata(metadata?: any): Record<string, any> | undefined {
  if (metadata === undefined || metadata === null) return undefined;
  if (typeof metadata === 'object' && !Array.isArray(metadata)) return metadata;
  return { value: metadata };
}

// Get SDK logger
async function getLogger() {
  const sdk = await getSDK();
  return sdk.logger;
}

// Export logger with convenient methods (async-safe)
export const logger = {
  info: (message: string, metadata?: any) => {
    getLogger().then(log => log.info(message, normalizeMetadata(metadata)));
  },
  warn: (message: string, metadata?: any) => {
    getLogger().then(log => log.warn(message, normalizeMetadata(metadata)));
  },
  error: (message: string, metadata?: any) => {
    getLogger().then(log => log.error(message, normalizeMetadata(metadata)));
  },
  debug: (message: string, metadata?: any) => {
    getLogger().then(log => log.debug(message, normalizeMetadata(metadata)));
  },

  // Cleanup
  close: async () => {
    const log = await getLogger();
    await log.close();
  },
};
