import { Bot, Context, InlineKeyboard, InputFile } from "grammy";
import { RegistrationStorage } from "./storage";
import { i18n } from "./i18n";
import cities from "./data/cities.json";

const storage = new RegistrationStorage();
const TOP_CITIES = cities.slice(0, 15);

function isAdmin(userId: number): boolean {
  const adminIds: string[] = [];

  // Bot Platform passes owner via BOT_OWNER_ID
  if (process.env.BOT_OWNER_ID) adminIds.push(process.env.BOT_OWNER_ID);

  // Bot Platform may pass multiple admins via BOT_ADMIN_IDS
  if (process.env.BOT_ADMIN_IDS) {
    adminIds.push(...process.env.BOT_ADMIN_IDS.split(',').map(id => id.trim()));
  }

  return adminIds.includes(userId.toString());
}

const CB = {
  CITY: (city: string) => `city:${city}`,
  SEARCH: 'search_city',
  BACK_TO_CITIES: 'back_to_cities',
  ADMIN_TOTAL: 'admin_total',
  ADMIN_CITIES: 'admin_cities',
  ADMIN_EXPORT: 'admin_export',
  ADMIN_MENU: 'admin_menu',
};

function createTopCitiesKeyboard() {
  const keyboard = new InlineKeyboard();
  for (let i = 0; i < TOP_CITIES.length; i += 2) {
    keyboard.text(TOP_CITIES[i], CB.CITY(TOP_CITIES[i]));
    if (i + 1 < TOP_CITIES.length) {
      keyboard.text(TOP_CITIES[i + 1], CB.CITY(TOP_CITIES[i + 1]));
    }
    keyboard.row();
  }
  keyboard.text(i18n.t("findAnotherCity"), CB.SEARCH);
  return keyboard;
}

function createAdminMenuKeyboard() {
  const keyboard = new InlineKeyboard()
    .text(i18n.t("totalRegistered"), CB.ADMIN_TOTAL)
    .row()
    .text(i18n.t("citiesStats"), CB.ADMIN_CITIES)
    .row()
    .text(i18n.t("exportData"), CB.ADMIN_EXPORT);
  return keyboard;
}

function createSearchResultsKeyboard(query: string) {
  const keyboard = new InlineKeyboard();
  const filtered = cities.filter(city =>
    city.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 20);
  if (filtered.length === 0) return null;
  for (let i = 0; i < filtered.length; i += 2) {
    keyboard.text(filtered[i], CB.CITY(filtered[i]));
    if (i + 1 < filtered.length) {
      keyboard.text(filtered[i + 1], CB.CITY(filtered[i + 1]));
    }
    keyboard.row();
  }
  keyboard.text(i18n.t("backToCities"), CB.BACK_TO_CITIES);
  return keyboard;
}

async function handleCitySelection(ctx: Context, city: string) {
  if (!ctx.from) return;
  const registration = storage.register(ctx.from.id, city, {
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
  });
  await ctx.editMessageText(
    i18n.t("registrationComplete", {
      city,
      time: new Date(registration.registeredAt).toLocaleString()
    }),
    { parse_mode: "Markdown" }
  );
}

export default function setup(bot: Bot) {
  bot.command("start", async (ctx) => {
    if (!ctx.from) return;
    if (storage.isRegistered(ctx.from.id)) {
      const reg = storage.getRegistration(ctx.from.id);
      await ctx.reply(
        i18n.t("alreadyRegistered", {
          city: reg?.city || "",
          time: new Date(reg?.registeredAt || '').toLocaleString()
        }),
        { parse_mode: "Markdown" }
      );
      return;
    }
    await ctx.reply(i18n.t("welcome"), { reply_markup: createTopCitiesKeyboard() });
  });

  bot.callbackQuery(/^city:(.+)$/, async (ctx) => {
    const city = ctx.match[1];
    if (!cities.includes(city)) {
      await ctx.answerCallbackQuery({ text: i18n.t("invalidCity") });
      return;
    }
    await handleCitySelection(ctx, city);
    await ctx.answerCallbackQuery({ text: i18n.t("citySelected", { city }) });
  });

  bot.callbackQuery(CB.SEARCH, async (ctx) => {
    await ctx.editMessageText(i18n.t("searchCity"));
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(CB.BACK_TO_CITIES, async (ctx) => {
    await ctx.editMessageText(i18n.t("selectCity"), {
      reply_markup: createTopCitiesKeyboard()
    });
    await ctx.answerCallbackQuery();
  });

  bot.on("message:text", async (ctx) => {
    if (!ctx.from || ctx.message.text.startsWith("/")) return;
    if (storage.isRegistered(ctx.from.id)) return;
    const query = ctx.message.text.trim();
    if (query.length < 2) {
      await ctx.reply(i18n.t("enterMinChars"));
      return;
    }
    const keyboard = createSearchResultsKeyboard(query);
    if (!keyboard) {
      await ctx.reply(
        i18n.t("noResults", { query }),
        { reply_markup: new InlineKeyboard().text(i18n.t("backToCities"), CB.BACK_TO_CITIES) }
      );
      return;
    }
    await ctx.reply(i18n.t("searchResults", { query }), { reply_markup: keyboard });
  });

  bot.command("admin", async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply(i18n.t("noAccess"));
      return;
    }
    await ctx.reply(i18n.t("adminMenu"), { reply_markup: createAdminMenuKeyboard() });
  });

  bot.callbackQuery(CB.ADMIN_MENU, async (ctx) => {
    await ctx.editMessageText(i18n.t("adminMenu"), { reply_markup: createAdminMenuKeyboard() });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(CB.ADMIN_TOTAL, async (ctx) => {
    const stats = storage.getStats();
    await ctx.answerCallbackQuery({ text: i18n.t("totalCount", { count: stats.total }), show_alert: true });
  });

  bot.callbackQuery(CB.ADMIN_CITIES, async (ctx) => {
    const stats = storage.getStats();
    const citiesList = Object.entries(stats.byCities).slice(0, 20)
      .map(([city, count]) => `• ${city}: ${count}`)
      .join('\n');
    const more = Object.keys(stats.byCities).length > 20
      ? `\n\n${i18n.t("andMore", { count: Object.keys(stats.byCities).length - 20 })}`
      : '';
    const keyboard = new InlineKeyboard().text("← " + i18n.t("adminMenu"), CB.ADMIN_MENU);
    await ctx.editMessageText(
      i18n.t("stats", { total: stats.total, cities: citiesList + more }),
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(CB.ADMIN_EXPORT, async (ctx) => {
    const registrations = storage.getAllRegistrations();
    let csv = "UserID,Username,FirstName,LastName,City,RegisteredAt\n";
    for (const reg of registrations) {
      csv += `${reg.userId},"${reg.username || ''}","${reg.firstName || ''}","${reg.lastName || ''}","${reg.city}","${reg.registeredAt}"\n`;
    }
    await ctx.replyWithDocument(
      new InputFile(Buffer.from(csv, 'utf-8'), `registrations_${Date.now()}.csv`),
      { caption: i18n.t("export", { count: registrations.length }) }
    );
    await ctx.answerCallbackQuery();
  });

  bot.command("stats", async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply(i18n.t("noAccess"));
      return;
    }
    const stats = storage.getStats();
    const citiesList = Object.entries(stats.byCities).slice(0, 20)
      .map(([city, count]) => `• ${city}: ${count}`)
      .join('\n');
    const more = Object.keys(stats.byCities).length > 20
      ? `\n\n${i18n.t("andMore", { count: Object.keys(stats.byCities).length - 20 })}`
      : '';
    await ctx.reply(
      i18n.t("stats", { total: stats.total, cities: citiesList + more }),
      { parse_mode: "Markdown" }
    );
  });

  bot.command("export", async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply(i18n.t("noAccess"));
      return;
    }
    const registrations = storage.getAllRegistrations();
    let csv = "UserID,Username,FirstName,LastName,City,RegisteredAt\n";
    for (const reg of registrations) {
      csv += `${reg.userId},"${reg.username || ''}","${reg.firstName || ''}","${reg.lastName || ''}","${reg.city}","${reg.registeredAt}"\n`;
    }
    await ctx.replyWithDocument(
      new InputFile(Buffer.from(csv, 'utf-8'), `registrations_${Date.now()}.csv`),
      { caption: i18n.t("export", { count: registrations.length }) }
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(i18n.t("help"));
  });
}
