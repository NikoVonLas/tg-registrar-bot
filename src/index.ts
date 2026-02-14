import { Bot, Context, InlineKeyboard, InputFile } from "grammy";
import { RegistrationStorage } from "./storage";
import { i18n } from "./i18n";
import cities from "./data/cities.json";
import { findClosestCity } from "./levenshtein";

const storage = new RegistrationStorage();

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
  CONFIRM_TYPO: (original: string, suggested: string) => `typo:yes:${original}:${suggested}`,
  KEEP_ORIGINAL: (original: string) => `typo:no:${original}`,
  ADMIN_TOTAL: 'admin_total',
  ADMIN_CITIES: 'admin_cities',
  ADMIN_EXPORT: 'admin_export',
  ADMIN_MENU: 'admin_menu',
};

function createAdminMenuKeyboard() {
  const keyboard = new InlineKeyboard()
    .text(i18n.t("totalRegistered"), CB.ADMIN_TOTAL)
    .row()
    .text(i18n.t("citiesStats"), CB.ADMIN_CITIES)
    .row()
    .text(i18n.t("exportData"), CB.ADMIN_EXPORT);
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
      time: i18n.formatDateTime(new Date(registration.registeredAt))
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
          time: i18n.formatDateTime(new Date(reg?.registeredAt || ''))
        }),
        { parse_mode: "Markdown" }
      );
      return;
    }
    await ctx.reply(i18n.t("enterCityName"));
  });

  bot.callbackQuery(/^typo:yes:(.+):(.+)$/, async (ctx) => {
    const original = ctx.match[1];
    const suggested = ctx.match[2];
    await handleCitySelection(ctx, suggested);
    await ctx.answerCallbackQuery({ text: i18n.t("citySaved", { city: suggested }) });
  });

  bot.callbackQuery(/^typo:no:(.+)$/, async (ctx) => {
    const original = ctx.match[1];
    await handleCitySelection(ctx, original);
    await ctx.answerCallbackQuery({ text: i18n.t("citySaved", { city: original }) });
  });

  bot.on("message:text", async (ctx) => {
    if (!ctx.from || ctx.message.text.startsWith("/")) return;
    if (storage.isRegistered(ctx.from.id)) return;

    const input = ctx.message.text.trim();
    if (input.length < 2) {
      await ctx.reply(i18n.t("enterMinChars"));
      return;
    }

    // Check for exact match first
    const exactMatch = cities.find(city => city.toLowerCase() === input.toLowerCase());
    if (exactMatch) {
      const registration = storage.register(ctx.from.id, exactMatch, {
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
      });
      await ctx.reply(
        i18n.t("registrationComplete", {
          city: exactMatch,
          time: i18n.formatDateTime(new Date(registration.registeredAt))
        }),
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Check for typos
    const closest = findClosestCity(input, cities);
    if (closest) {
      const keyboard = new InlineKeyboard()
        .text(i18n.t("yesImeant", { city: closest.city }), CB.CONFIRM_TYPO(input, closest.city))
        .row()
        .text(i18n.t("noKeepMine", { city: input }), CB.KEEP_ORIGINAL(input));

      await ctx.reply(
        i18n.t("didYouMean", { input, suggested: closest.city }),
        { reply_markup: keyboard }
      );
      return;
    }

    // No match found, save what user typed
    const registration = storage.register(ctx.from.id, input, {
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
    });
    await ctx.reply(
      i18n.t("registrationComplete", {
        city: input,
        time: i18n.formatDateTime(new Date(registration.registeredAt))
      }),
      { parse_mode: "Markdown" }
    );
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
