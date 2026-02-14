import { Bot } from "grammy";
import { i18n } from "../i18n";
import { logger } from "../logger";
import { EventStorage, RegistrationStorage } from "../storage";
import { UserStateManager } from "../shared/state";
import { isAdmin } from "../shared/auth";
import { createAdminMenuKeyboard } from "../shared/keyboards";

export function registerStartHandler(
  bot: Bot,
  eventStorage: EventStorage,
  storage: RegistrationStorage,
  stateManager: UserStateManager
) {
  bot.command("start", async (ctx) => {
    if (!ctx.from) {
      logger.warn('Start command without ctx.from');
      return;
    }

    // Parse event ID from deep link parameter
    const payload = ctx.match;

    // If no payload and user is admin, show admin menu
    if (!payload && isAdmin(ctx.from.id)) {
      logger.info('Admin accessed /start without payload, showing admin menu:', {
        userId: ctx.from.id
      });
      await ctx.reply(i18n.t("adminMenu"), {
        reply_markup: createAdminMenuKeyboard()
      });
      return;
    }

    const eventId = payload || eventStorage.getDefaultEventId();

    logger.info('Start command:', {
      userId: ctx.from.id,
      eventId,
      hasPayload: !!payload
    });

    // Check if event exists and is active
    const event = eventStorage.getEvent(eventId);
    if (!event || !event.active) {
      logger.warn('Event not found or inactive:', { eventId });
      await ctx.reply(i18n.t("eventNotFound"));
      return;
    }

    // Check if already registered for this event
    if (storage.isRegistered(ctx.from.id, eventId)) {
      const reg = storage.getRegistration(ctx.from.id, eventId);
      logger.debug('User already registered:', {
        userId: ctx.from.id,
        eventId,
        city: reg?.city
      });
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
    stateManager.set(ctx.from.id, 'registering', { eventId });

    await ctx.reply(i18n.t("enterCityName"));
  });
}
