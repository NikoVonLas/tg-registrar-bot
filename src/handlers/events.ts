import { Bot } from "grammy";
import { i18n } from "../i18n";
import { logger } from "../logger";
import { isAdmin } from "../shared/auth";
import { CB } from "../shared/callbacks";
import { createEventsListKeyboard, createEventInfoKeyboard } from "../shared/keyboards";
import { RegistrationStorage, EventStorage } from "../storage";
import { UserStateManager } from "../shared/state";

export function registerEventsHandlers(
  bot: Bot,
  storage: RegistrationStorage,
  eventStorage: EventStorage,
  stateManager: UserStateManager
) {
  // MANAGE_EVENTS callback - show events list
  bot.callbackQuery(CB.MANAGE_EVENTS, async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: i18n.t("noAccess"), show_alert: true });
      return;
    }

    logger.debug('Manage events callback');
    await ctx.editMessageText(i18n.t("eventsList"), {
      reply_markup: createEventsListKeyboard(eventStorage, storage)
    });
    await ctx.answerCallbackQuery();
  });

  // EVENT_LIST callback - show events list
  bot.callbackQuery(CB.EVENT_LIST, async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: i18n.t("noAccess"), show_alert: true });
      return;
    }

    logger.debug('Event list callback');
    await ctx.editMessageText(i18n.t("eventsList"), {
      reply_markup: createEventsListKeyboard(eventStorage, storage)
    });
    await ctx.answerCallbackQuery();
  });

  // CREATE_EVENT callback - start event creation flow
  bot.callbackQuery(CB.CREATE_EVENT, async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: i18n.t("noAccess"), show_alert: true });
      return;
    }

    logger.debug('Create event callback:', { userId: ctx.from.id });
    stateManager.set(ctx.from.id, 'creating_event');
    await ctx.editMessageText(i18n.t("enterEventName"));
    await ctx.answerCallbackQuery();
  });

  // EVENT_INFO callback - show event details
  bot.callbackQuery(/^event_info:(.+)$/, async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: i18n.t("noAccess"), show_alert: true });
      return;
    }

    const eventId = ctx.match[1];
    const event = eventStorage.getEvent(eventId);

    if (!event) {
      await ctx.answerCallbackQuery({ text: i18n.t("eventNotFound"), show_alert: true });
      return;
    }

    const stats = storage.getStats(eventId);

    logger.debug('Event info callback:', { eventId, count: stats.total });

    await ctx.editMessageText(
      i18n.t("eventInfo", {
        name: event.name,
        id: event.id,
        date: i18n.formatDateTime(new Date(event.createdAt)),
        count: stats.total
      }),
      {
        parse_mode: "Markdown",
        reply_markup: createEventInfoKeyboard(eventId)
      }
    );
    await ctx.answerCallbackQuery();
  });

  // EVENT_DEEPLINK callback - show deep link for event
  bot.callbackQuery(/^event_deeplink:(.+)$/, async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: i18n.t("noAccess"), show_alert: true });
      return;
    }

    const eventId = ctx.match[1];
    const event = eventStorage.getEvent(eventId);

    if (!event) {
      await ctx.answerCallbackQuery({ text: i18n.t("eventNotFound"), show_alert: true });
      return;
    }

    const botInfo = await ctx.api.getMe();
    const deepLink = `https://t.me/${botInfo.username}?start=${eventId}`;

    logger.debug('Event deeplink callback:', { eventId });

    await ctx.answerCallbackQuery({ text: deepLink, show_alert: true });
  });

  // EVENT_DELETE callback - delete event
  bot.callbackQuery(/^event_delete:(.+)$/, async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: i18n.t("noAccess"), show_alert: true });
      return;
    }

    const eventId = ctx.match[1];
    const deleted = eventStorage.deleteEvent(eventId);

    if (deleted) {
      logger.info('Event deleted:', { eventId, userId: ctx.from.id });
      await ctx.editMessageText(i18n.t("eventDeleted"));
      await ctx.answerCallbackQuery();

      // Show events list after deletion
      setTimeout(() => {
        ctx.editMessageText(i18n.t("eventsList"), {
          reply_markup: createEventsListKeyboard(eventStorage, storage)
        });
      }, 1000);
    } else {
      await ctx.answerCallbackQuery({ text: i18n.t("eventNotFound"), show_alert: true });
    }
  });
}

// Helper function to handle event creation text input
export function handleEventCreationText(
  userId: number,
  text: string,
  eventStorage: EventStorage,
  stateManager: UserStateManager
): { success: boolean; event?: any } {
  if (text.length < 2) {
    return { success: false };
  }

  const event = eventStorage.createEvent(text, userId);
  stateManager.delete(userId);

  logger.info('Event created via text:', { eventId: event.id, name: event.name, userId });

  return { success: true, event };
}
