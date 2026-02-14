import { getSDK } from '../sdk';
import { logger } from '../logger';

let adminIdsCache: string[] = [];

// Initialize admin IDs from SDK
getSDK().then(sdk => {
  adminIdsCache = sdk.config.adminIds;
  logger.debug('Admin IDs loaded from SDK', { count: adminIdsCache.length });
}).catch(err => {
  logger.error('Failed to load admin IDs from SDK', err);
});

export function isAdmin(userId: number): boolean {
  const isAdminUser = adminIdsCache.includes(userId.toString());

  logger.debug('isAdmin check:', {
    userId,
    result: isAdminUser
  });

  return isAdminUser;
}
