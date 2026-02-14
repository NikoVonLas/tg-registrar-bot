import { getSDK } from '@/sdk';
import { BotLogger, createI18n, I18n } from '@nikovonlas/bot-sdk';
import { translations, TranslationKey } from '@/translations';

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

/**
 * i18n instance cache
 */
let i18nInstance: I18n<TranslationKey> | null = null;

// Initialize i18n from SDK config
getSDK().then(sdk => {
  const defaultLang = sdk.config.language || 'ru-RU';
  i18nInstance = createI18n(translations, defaultLang);
}).catch(err => {
  console.error('Failed to initialize i18n:', err);
  // Fallback to default
  i18nInstance = createI18n(translations, 'ru-RU');
});

/**
 * i18n wrapper with type-safe keys
 */
export const i18n = {
  t: (key: TranslationKey, params?: Record<string, any>): string => {
    if (!i18nInstance) {
      console.warn('i18n not initialized yet, returning key');
      return key;
    }
    return i18nInstance.t(key, params);
  },

  formatDateTime: (date: Date): string => {
    if (!i18nInstance) {
      return date.toISOString();
    }
    return i18nInstance.formatDateTime(date, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  get language(): string {
    return i18nInstance?.language || 'ru-RU';
  }
};
