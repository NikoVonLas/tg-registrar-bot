import { Bot, Context, InlineKeyboard, InputFile } from "grammy";
import { RegistrationStorage } from "./storage";
import { EventStorage } from "./eventStorage";
import { i18n } from "./i18n";
import cities from "./data/cities.json";
import { findClosestCity } from "./levenshtein";

const storage = new RegistrationStorage();
const eventStorage = new EventStorage();

// Store user states for event creation flow
const userStates = new Map<number, { action: string; data?: any }>();

function isAdmin(userId: number): boolean {
  const adminIds: string[] = [];

  // Bot Platform passes owner via BOT_OWNER_ID
  if (process.env.BOT_OWNER_ID) adminIds.push(process.env.BOT_OWNER_ID);

  // Bot Platform may pass multiple admins via BOT_ADMIN_IDS
  if (process.env.BOT_ADMIN_IDS) {
    adminIds.push(...process.env.BOT_ADMIN_IDS.split(',').map(id => id.trim()));
  }

  const isAdminUser = adminIds.includes(userId.toString());
  console.log('[DEBUG] isAdmin check:', {
    userId,
    userIdStr: userId.toString(),
    adminIds,
    BOT_OWNER_ID: process.env.BOT_OWNER_ID,
    BOT_ADMIN_IDS: process.env.BOT_ADMIN_IDS,
    result: isAdminUser
  });

  return isAdminUser;
}

const CB = {
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
};

function createAdminMenuKeyboard() {
  const keyboard = new InlineKeyboard()
    .text(i18n.t("manageEvents"), CB.MANAGE_EVENTS)
    .row()
    .text(i18n.t("totalRegistered"), CB.ADMIN_TOTAL)
    .row()
    .text(i18n.t("citiesStats"), CB.ADMIN_CITIES)
    .row()
    .text(i18n.t("exportData"), CB.ADMIN_EXPORT);
  return keyboard;
}

function createEventsListKeyboard() {
  const keyboard = new InlineKeyboard();
  const events = eventStorage.getActiveEvents();

  for (const event of events) {
    const count = storage.getStats(event.id).total;
    keyboard.text(`${event.name} (${count})`, CB.EVENT_INFO(event.id)).row();
  }

  keyboard.text(i18n.t("createEvent"), CB.CREATE_EVENT).row();
  keyboard.text("← " + i18n.t("adminMenu"), CB.ADMIN_MENU);
  return keyboard;
}

function createEventInfoKeyboard(eventId: string) {
  const keyboard = new InlineKeyboard()
    .text(i18n.t("deepLink"), CB.EVENT_DEEPLINK(eventId))
    .row();

  if (eventId !== eventStorage.getDefaultEventId()) {
    keyboard.text(i18n.t("deleteEvent"), CB.EVENT_DELETE(eventId)).row();
  }

  keyboard.text(i18n.t("backToEvents"), CB.EVENT_LIST);
  return keyboard;
}

async function handleCitySelection(ctx: Context, eventId: string, city: string) {
  if (!ctx.from) return;
  const registration = storage.register(ctx.from.id, eventId, city, {
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

function getUserEventId(ctx: Context): string {
  // Get eventId from user state or default
  const state = userStates.get(ctx.from?.id || 0);
  return state?.data?.eventId || eventStorage.getDefaultEventId();
}

export default function setup(bot: Bot) {
  bot.command("start", async (ctx) => {
    if (!ctx.from) return;

    // Parse event ID from deep link parameter
    const payload = ctx.match;
    const eventId = payload || eventStorage.getDefaultEventId();

    // Check if event exists and is active
    const event = eventStorage.getEvent(eventId);
    if (!event || !event.active) {
      await ctx.reply(i18n.t("eventNotFound"));
      return;
    }

    // Check if already registered for this event
    if (storage.isRegistered(ctx.from.id, eventId)) {
      const reg = storage.getRegistration(ctx.from.id, eventId);
      await ctx.reply(
        i18n.t("alreadyRegistered", {
          city: reg?.city || "",
          time: i18n.formatDateTime(new Date(reg?.registeredAt || ''))
        }),
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Store eventId in user state for registration
    userStates.set(ctx.from.id, { action: 'registering', data: { eventId } });

    await ctx.reply(i18n.t("enterCityName"));
  });

  bot.callbackQuery(/^typo:yes:(.+):(.+)$/, async (ctx) => {
    const original = ctx.match[1];
    const suggested = ctx.match[2];
    const eventId = getUserEventId(ctx);
    await handleCitySelection(ctx, eventId, suggested);
    await ctx.answerCallbackQuery({ text: i18n.t("citySaved", { city: suggested }) });
    userStates.delete(ctx.from?.id || 0);
  });

  bot.callbackQuery(/^typo:no:(.+)$/, async (ctx) => {
    const original = ctx.match[1];
    const eventId = getUserEventId(ctx);
    await handleCitySelection(ctx, eventId, original);
    await ctx.answerCallbackQuery({ text: i18n.t("citySaved", { city: original }) });
    userStates.delete(ctx.from?.id || 0);
  });

  bot.on("message:text", async (ctx) => {
    if (!ctx.from || ctx.message.text.startsWith("/")) return;

    const userState = userStates.get(ctx.from.id);
    const input = ctx.message.text.trim();

    // Handle event creation flow
    if (userState?.action === 'creating_event' && isAdmin(ctx.from.id)) {
      if (input.length < 2) {
        await ctx.reply(i18n.t("enterMinChars"));
        return;
      }

      const event = eventStorage.createEvent(input, ctx.from.id);
      const botInfo = await ctx.api.getMe();

      await ctx.reply(
        i18n.t("eventCreated", {
          name: event.name,
          id: event.id,
          botUsername: botInfo.username || ''
        }),
        { parse_mode: "Markdown" }
      );

      userStates.delete(ctx.from.id);
      return;
    }

    // Handle city registration flow
    const eventId = userState?.data?.eventId;
    if (!eventId || storage.isRegistered(ctx.from.id, eventId)) return;

    if (input.length < 2) {
      await ctx.reply(i18n.t("enterMinChars"));
      return;
    }

    // Check for exact match first
    const exactMatch = cities.find(city => city.toLowerCase() === input.toLowerCase());
    if (exactMatch) {
      const registration = storage.register(ctx.from.id, eventId, exactMatch, {
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
      userStates.delete(ctx.from.id);
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
    const registration = storage.register(ctx.from.id, eventId, input, {
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
    userStates.delete(ctx.from.id);
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

  bot.callbackQuery(CB.MANAGE_EVENTS, async (ctx) => {
    await ctx.editMessageText(i18n.t("eventsList"), { reply_markup: createEventsListKeyboard() });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(CB.EVENT_LIST, async (ctx) => {
    await ctx.editMessageText(i18n.t("eventsList"), { reply_markup: createEventsListKeyboard() });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(CB.CREATE_EVENT, async (ctx) => {
    if (!ctx.from) return;
    userStates.set(ctx.from.id, { action: 'creating_event' });
    await ctx.editMessageText(i18n.t("enterEventName"));
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^event_info:(.+)$/, async (ctx) => {
    const eventId = ctx.match[1];
    const event = eventStorage.getEvent(eventId);
    if (!event) {
      await ctx.answerCallbackQuery({ text: i18n.t("eventNotFound"), show_alert: true });
      return;
    }

    const stats = storage.getStats(eventId);
    await ctx.editMessageText(
      i18n.t("eventInfo", {
        name: event.name,
        id: event.id,
        date: i18n.formatDateTime(new Date(event.createdAt)),
        count: stats.total
      }),
      { parse_mode: "Markdown", reply_markup: createEventInfoKeyboard(eventId) }
    );
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^event_deeplink:(.+)$/, async (ctx) => {
    const eventId = ctx.match[1];
    const event = eventStorage.getEvent(eventId);
    if (!event) {
      await ctx.answerCallbackQuery({ text: i18n.t("eventNotFound"), show_alert: true });
      return;
    }

    const botInfo = await ctx.api.getMe();
    const deepLink = `https://t.me/${botInfo.username}?start=${eventId}`;
    await ctx.answerCallbackQuery({ text: deepLink, show_alert: true });
  });

  bot.callbackQuery(/^event_delete:(.+)$/, async (ctx) => {
    const eventId = ctx.match[1];
    if (eventId === eventStorage.getDefaultEventId()) {
      await ctx.answerCallbackQuery({ text: i18n.t("cannotDeleteDefault"), show_alert: true });
      return;
    }

    const deleted = eventStorage.deleteEvent(eventId);
    if (deleted) {
      await ctx.editMessageText(i18n.t("eventDeleted"));
      await ctx.answerCallbackQuery();
      // Show events list after deletion
      setTimeout(() => {
        ctx.editMessageText(i18n.t("eventsList"), { reply_markup: createEventsListKeyboard() });
      }, 1000);
    } else {
      await ctx.answerCallbackQuery({ text: i18n.t("eventNotFound"), show_alert: true });
    }
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
    let csv = "UserID,EventID,Username,FirstName,LastName,City,RegisteredAt\n";
    for (const reg of registrations) {
      csv += `${reg.userId},"${reg.eventId}","${reg.username || ''}","${reg.firstName || ''}","${reg.lastName || ''}","${reg.city}","${reg.registeredAt}"\n`;
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
    let csv = "UserID,EventID,Username,FirstName,LastName,City,RegisteredAt\n";
    for (const reg of registrations) {
      csv += `${reg.userId},"${reg.eventId}","${reg.username || ''}","${reg.firstName || ''}","${reg.lastName || ''}","${reg.city}","${reg.registeredAt}"\n`;
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
