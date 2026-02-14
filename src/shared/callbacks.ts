// Callback query constants
export const CB = {
  CITY: (city: string) => `city:${city}`,
  CONFIRM_TYPO: (original: string, suggested: string) => `typo:yes:${original}:${suggested}`,
  KEEP_ORIGINAL: (original: string) => `typo:no:${original}`,
  ADMIN_TOTAL: 'admin_total',
  ADMIN_CITIES: 'admin_cities',
  ADMIN_EXPORT: 'admin_export',
  ADMIN_MENU: 'admin_menu',
  MANAGE_EVENTS: 'manage_events',
  CREATE_EVENT: 'create_event',
  EVENT_LIST: 'event_list',
  EVENT_INFO: (eventId: string) => `event_info:${eventId}`,
  EVENT_DELETE: (eventId: string) => `event_delete:${eventId}`,
  EVENT_DEEPLINK: (eventId: string) => `event_deeplink:${eventId}`,
} as const;
