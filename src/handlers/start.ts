import { Bot } from "grammy";
import { i18n } from "../i18n";
import { logger } from "../logger";
import { EventStorage, RegistrationStorage, RegistrationAttemptStorage } from "../storage";
import { UserStateManager } from "../shared/state";
import { isAdmin } from "../shared/auth";
import { createAdminMenuKeyboard } from "../shared/keyboards";

export function registerStartHandler(
  bot: Bot,
  eventStorage: EventStorage,
  storage: RegistrationStorage,
  attemptStorage: RegistrationAttemptStorage,
  stateManager: UserStateManager
) {
  bot.command("start", async (ctx) => {
    if (!ctx.from) {
      logger.warn('Start command without ctx.from');
      return;
    }

    // Parse event ID from deep link parameter
    const payload = ctx.match;

    // If no payload and user is admin, show admin menu (events list)
    if (!payload && isAdmin(ctx.from.id)) {
      logger.info('Admin accessed /start without payload, showing events list:', {
        userId: ctx.from.id
      });
      await ctx.reply(i18n.t("adminMenu"), {
        reply_markup: createAdminMenuKeyboard()
      });
      return;
    }

    // If no payload and user is not admin, require event link
    if (!payload) {
      logger.warn('User accessed /start without event link:', {
        userId: ctx.from.id
      });
      await ctx.reply(i18n.t("requireEventLink"));
      return;
    }

    const eventId = payload;

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

    // Record registration attempt
    attemptStorage.recordAttempt(ctx.from.id, eventId, {
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
    });

    await ctx.reply(i18n.t("enterCityName"));
  });
}
