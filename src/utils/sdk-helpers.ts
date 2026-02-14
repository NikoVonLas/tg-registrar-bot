import { getSDK } from '@/sdk';
import { BotLogger } from '@nikovonlas/bot-sdk';

/**
 * Get logger from SDK
 */
export async function getLogger(): Promise<BotLogger> {
  const sdk = await getSDK();
  return sdk.logger;
}

/**
 * Normalize metadata to object format
 */
export function normalizeMetadata(metadata?: any): Record<string, any> | undefined {
  if (metadata === undefined || metadata === null) return undefined;
  if (typeof metadata === 'object' && !Array.isArray(metadata)) return metadata;
  return { value: metadata };
}

/**
 * Helper to log with normalized metadata
 */
export const log = {
  info: (message: string, metadata?: any) => {
    getLogger().then(logger => logger.info(message, normalizeMetadata(metadata)));
  },
  warn: (message: string, metadata?: any) => {
    getLogger().then(logger => logger.warn(message, normalizeMetadata(metadata)));
  },
  error: (message: string, metadata?: any) => {
    getLogger().then(logger => logger.error(message, normalizeMetadata(metadata)));
  },
  debug: (message: string, metadata?: any) => {
    getLogger().then(logger => logger.debug(message, normalizeMetadata(metadata)));
  },
};
