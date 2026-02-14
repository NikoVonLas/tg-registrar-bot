import { BotLogger } from '@nikovonlas/bot-sdk';
import { sdkConfig, config } from './config';

// Create SDK logger instance
const sdkLogger = new BotLogger(sdkConfig, 'bot', config.debug);

// Helper to ensure metadata is an object
function normalizeMetadata(metadata?: any): Record<string, any> | undefined {
  if (metadata === undefined || metadata === null) return undefined;
  if (typeof metadata === 'object' && !Array.isArray(metadata)) return metadata;
  return { value: metadata };
}

// Export logger with convenient methods
export const logger = {
  info: (message: string, metadata?: any) => sdkLogger.info(message, normalizeMetadata(metadata)),
  warn: (message: string, metadata?: any) => sdkLogger.warn(message, normalizeMetadata(metadata)),
  error: (message: string, metadata?: any) => sdkLogger.error(message, normalizeMetadata(metadata)),
  debug: (message: string, metadata?: any) => sdkLogger.debug(message, normalizeMetadata(metadata)),

  // Create child logger with scope
  child: (scope: string) => sdkLogger.child(scope),

  // Cleanup
  close: () => sdkLogger.close(),
};
