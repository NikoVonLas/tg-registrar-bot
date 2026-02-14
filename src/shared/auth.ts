import { config } from '../config';
import { logger } from '../logger';

export function isAdmin(userId: number): boolean {
  const isAdminUser = config.adminIds.includes(userId.toString());

  logger.debug('isAdmin check:', {
    userId,
    userIdStr: userId.toString(),
    adminIds: config.adminIds,
    result: isAdminUser
  });

  return isAdminUser;
}
