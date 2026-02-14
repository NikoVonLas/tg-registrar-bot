// i18n translations
const translations = {
  'en-US': {
    welcome: "Welcome to the event!\n\nPlease select your city to register:",
    alreadyRegistered: "You're already registered!\n\nYour city: *{city}*\nRegistration time: {time}",
    registrationComplete: "Great! You're registered.\n\nYour city: *{city}*\nRegistration time: {time}\n\nWelcome to the event!",
    selectCity: "Select your city from the most popular:\n\nOr use search if your city is not in the list.",
    searchCity: "City Search\n\nType your city name (or part of it).\nFor example: \"Mosco\" will find \"Moscow\"",
    searchResults: "Search results for \"{query}\":",
    noResults: "No cities found for \"{query}\"\n\nTry another query or choose from the top-15.",
    enterMinChars: "Enter at least 2 characters to search.",
    stats: "Registration Statistics\n\nTotal registered: *{total}*\n\nBy cities:\n{cities}",
    export: "Data export: {count} records",
    noAccess: "You don't have access to this command.",
    help: "Bot Commands:\n\n/start - Register for event\n/help - This help\n\nFor administrators:\n/admin - Admin panel\n/stats - Registration statistics\n/export - Export data to CSV",
    adminMenu: "Admin Panel",
    totalRegistered: "Total Registered",
    citiesStats: "Cities Statistics",
    exportData: "Export CSV",
    totalCount: "Total registered: *{count}*",
    findAnotherCity: "Find another city",
    backToCities: "← Back to top-15",
    citySelected: "City selected: {city}",
    invalidCity: "Invalid city",
    andMore: "...and {count} more cities",
  },
  'ru-RU': {
    welcome: "Добро пожаловать на мероприятие!\n\nДля регистрации выберите ваш город:",
    alreadyRegistered: "Вы уже зарегистрированы!\n\nВаш город: *{city}*\nВремя регистрации: {time}",
    registrationComplete: "Отлично! Вы зарегистрированы.\n\nВаш город: *{city}*\nВремя регистрации: {time}\n\nДобро пожаловать на мероприятие!",
    selectCity: "Выберите ваш город из списка самых популярных:\n\nИли используйте поиск, если вашего города нет в списке.",
    searchCity: "Поиск города\n\nНапишите название вашего города (можно часть названия).\nНапример: \"Новосиб\" найдёт \"Новосибирск\"",
    searchResults: "Результаты поиска по \"{query}\":",
    noResults: "Не найдено городов по запросу \"{query}\"\n\nПопробуйте другой вариант или выберите из топ-15.",
    enterMinChars: "Введите минимум 2 символа для поиска.",
    stats: "Статистика регистраций\n\nВсего зарегистрировано: *{total}*\n\nПо городам:\n{cities}",
    export: "Экспорт данных: {count} записей",
    noAccess: "У вас нет доступа к этой команде.",
    help: "Команды бота:\n\n/start - Регистрация на мероприятие\n/help - Эта справка\n\nДля администраторов:\n/admin - Панель администратора\n/stats - Статистика регистраций\n/export - Экспорт данных в CSV",
    adminMenu: "Панель администратора",
    totalRegistered: "Всего зарегистрировано",
    citiesStats: "Статистика по городам",
    exportData: "Экспорт CSV",
    totalCount: "Всего зарегистрировано: *{count}*",
    findAnotherCity: "Найти другой город",
    backToCities: "← Назад к топ-15",
    citySelected: "Город выбран: {city}",
    invalidCity: "Некорректный город",
    andMore: "...и ещё {count} городов",
  },
};

type Language = 'en-US' | 'ru-RU';
type TranslationKey = keyof typeof translations['en-US'];

class I18n {
  private lang: Language;

  constructor() {
    const envLang = (process.env.LANGUAGE || 'en-US').toLowerCase();
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

  get language(): Language {
    return this.lang;
  }
}

export const i18n = new I18n();
