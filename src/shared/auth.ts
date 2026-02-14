import { getSDK } from '@/sdk';
import { log } from '@/utils/sdk-helpers';

let adminIdsCache: string[] = [];

// Initialize admin IDs from SDK
getSDK().then(sdk => {
  adminIdsCache = sdk.config.adminIds;
  log.debug('Admin IDs loaded from SDK', { count: adminIdsCache.length });
}).catch(err => {
  log.error('Failed to load admin IDs from SDK', err);
});

export function isAdmin(userId: number): boolean {
  const isAdminUser = adminIdsCache.includes(userId.toString());

  log.debug('isAdmin check:', {
    userId,
    result: isAdminUser
  });

  return isAdminUser;
}
