import { getSDK } from '@/sdk';

// i18n translations
const translations = {
  'en-US': {
    enterCityName: "Welcome to the event!\n\nPlease enter your city name:",
    alreadyRegistered: "You're already registered!\n\nYour city: *{city}*\nRegistration time: {time}",
    registrationComplete: "Great! You're registered.\n\nYour city: *{city}*\nRegistration time: {time}\n\nWelcome to the event!",
    enterMinChars: "Enter at least 2 characters.",
    didYouMean: "You entered: *{input}*\n\nDid you mean *{suggested}*?",
    yesImeant: "Yes, I meant {city}",
    noKeepMine: "No, keep \"{city}\"",
    citySaved: "City saved: {city}",
    stats: "Registration Statistics\n\nTotal registered: *{total}*\n\nBy cities:\n{cities}",
    export: "Data export: {count} records",
    noAccess: "You don't have access to this command.",
    help: "Bot Commands:\n\n/start - Register for event\n/help - This help\n\nFor administrators:\n/admin - Admin panel\n/stats - Registration statistics\n/export - Export data to CSV",
    adminMenu: "Admin Panel",
    totalRegistered: "Total Registered",
    citiesStats: "Cities Statistics",
    exportData: "Export CSV",
    totalCount: "Total registered: *{count}*",
    andMore: "...and {count} more cities",
    manageEvents: "Manage Events",
    eventsList: "Events List",
    createEvent: "Create Event",
    deleteEvent: "Delete Event",
    eventCreated: "Event created!\n\nName: *{name}*\nID: `{id}`\n\nDeep link:\n`https://t.me/{botUsername}?start={id}`",
    enterEventName: "Enter event name:",
    eventNotFound: "Event not found or inactive",
    noEventsYet: "No events created yet",
    eventInfo: "Event: *{name}*\nID: `{id}`\nCreated: {date}\n\nRegistrations: {count}",
    eventDeleted: "Event deleted",
    cannotDeleteDefault: "Cannot delete default event",
    backToEvents: "← Back to Events",
    deepLink: "Deep Link",
    errorOccurred: "An error occurred. Please try again later.",
    registration: "Registration",
    requireEventLink: "Please use an event registration link to register.",
    resendQR: "Resend QR Code",
    eventDetails: "Event Details",
    startedNotCompleted: "Started but not completed",
  },
  'ru-RU': {
    enterCityName: "Добро пожаловать на мероприятие!\n\nНапишите название вашего города:",
    alreadyRegistered: "Вы уже зарегистрированы!\n\nВаш город: *{city}*\nВремя регистрации: {time}",
    registrationComplete: "Отлично! Вы зарегистрированы.\n\nВаш город: *{city}*\nВремя регистрации: {time}\n\nДобро пожаловать на мероприятие!",
    enterMinChars: "Введите минимум 2 символа.",
    didYouMean: "Вы написали: *{input}*\n\nВозможно, вы имели в виду *{suggested}*?",
    yesImeant: "Да, я имел в виду {city}",
    noKeepMine: "Нет, оставить \"{city}\"",
    citySaved: "Город сохранён: {city}",
    stats: "Статистика регистраций\n\nВсего зарегистрировано: *{total}*\n\nПо городам:\n{cities}",
    export: "Экспорт данных: {count} записей",
    noAccess: "У вас нет доступа к этой команде.",
    help: "Команды бота:\n\n/start - Регистрация на мероприятие\n/help - Эта справка\n\nДля администраторов:\n/admin - Панель администратора\n/stats - Статистика регистраций\n/export - Экспорт данных в CSV",
    adminMenu: "Панель администратора",
    totalRegistered: "Всего зарегистрировано",
    citiesStats: "Статистика по городам",
    exportData: "Экспорт CSV",
    totalCount: "Всего зарегистрировано: *{count}*",
    andMore: "...и ещё {count} городов",
    manageEvents: "Управление мероприятиями",
    eventsList: "Список мероприятий",
    createEvent: "Создать мероприятие",
    deleteEvent: "Удалить мероприятие",
    eventCreated: "Мероприятие создано!\n\nНазвание: *{name}*\nID: `{id}`\n\nDeep link:\n`https://t.me/{botUsername}?start={id}`",
    enterEventName: "Введите название мероприятия:",
    eventNotFound: "Мероприятие не найдено или неактивно",
    noEventsYet: "Мероприятий пока нет",
    eventInfo: "Мероприятие: *{name}*\nID: `{id}`\nСоздано: {date}\n\nРегистраций: {count}",
    eventDeleted: "Мероприятие удалено",
    cannotDeleteDefault: "Нельзя удалить стандартное мероприятие",
    backToEvents: "← К списку мероприятий",
    deepLink: "Deep Link",
    errorOccurred: "Произошла ошибка. Пожалуйста, попробуйте позже.",
    registration: "Регистрация",
    requireEventLink: "Пожалуйста, используйте ссылку для регистрации на мероприятие.",
    resendQR: "Отправить QR-код повторно",
    eventDetails: "Информация о мероприятии",
    startedNotCompleted: "Начали, но не завершили",
  },
};

type Language = 'en-US' | 'ru-RU';
type TranslationKey = keyof typeof translations['en-US'];

class I18n {
  private lang: Language = 'ru-RU'; // Default, will be updated from SDK

  setLanguage(language: string) {
    const envLang = language.toLowerCase();
    // Accept various formats: ru-RU, ru-ru, ruRU, ru
    const normalized = envLang.replace(/[_-]?ru/i, 'ru-RU').replace(/[_-]?en/i, 'en-US');
    this.lang = (normalized.includes('ru') ? 'ru-RU' : 'en-US') as Language;
  }

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    let text = translations[this.lang][key];

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, String(value));
      });
    }

    return text;
  }

  formatDateTime(date: Date): string {
    return date.toLocaleString(this.lang, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get language(): Language {
    return this.lang;
  }
}

export const i18n = new I18n();
