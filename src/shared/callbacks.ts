// Callback query constants
export const CB = {
  CITY: (city: string) => `city:${city}`,
  CONFIRM_TYPO: (original: string, suggested: string) => `typo:yes:${original}:${suggested}`,
  KEEP_ORIGINAL: (original: string) => `typo:no:${original}`,

  // Event list navigation
  EVENT_LIST: 'event_list',
  EVENT_LIST_PAGE: (page: number) => `event_list:${page}`,
  CREATE_EVENT: 'create_event',

  // Event details
  EVENT_DETAILS: (eventId: string) => `event_details:${eventId}`,
  EVENT_RESEND_QR: (eventId: string) => `event_qr:${eventId}`,
  EVENT_DELETE: (eventId: string) => `event_delete:${eventId}`,

  // Deprecated (will be removed)
  ADMIN_TOTAL: 'admin_total',
  ADMIN_CITIES: 'admin_cities',
  ADMIN_EXPORT: 'admin_export',
  ADMIN_MENU: 'admin_menu',
  MANAGE_EVENTS: 'manage_events',
  EVENT_INFO: (eventId: string) => `event_info:${eventId}`,
  EVENT_DEEPLINK: (eventId: string) => `event_deeplink:${eventId}`,
} as const;
