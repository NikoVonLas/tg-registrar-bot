import { Bot, Context, InputFile } from "grammy";
import { i18n } from "../i18n";
import { logger } from "../logger";
import { CB } from "../shared/callbacks";
import { createTypoCorrectionKeyboard } from "../shared/keyboards";
import { RegistrationStorage, EventStorage } from "../storage";
import { UserStateManager } from "../shared/state";
import { findClosestCity } from "../utils/levenshtein";
import cities from "../data/cities.json";
import { isAdmin } from "../shared/auth";
import { handleEventCreationText } from "./events";
import { generateQRCodePDF } from "../utils/qrcode";

async function handleCitySelection(
  ctx: Context,
  eventId: string,
  city: string,
  storage: RegistrationStorage,
  stateManager: UserStateManager
) {
  if (!ctx.from) return;

  const registration = storage.register(ctx.from.id, eventId, city, {
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
  });

  logger.info('Registration completed:', {
    userId: ctx.from.id,
    eventId,
    city
  });

  await ctx.editMessageText(
    i18n.t("registrationComplete", {
      city,
      time: i18n.formatDateTime(new Date(registration.registeredAt))
    }),
    { parse_mode: "Markdown" }
  );

  stateManager.delete(ctx.from.id);
}

function getUserEventId(
  ctx: Context,
  stateManager: UserStateManager,
  eventStorage: EventStorage
): string {
  // Get eventId from user state or default
  const state = stateManager.get(ctx.from?.id || 0);
  return state?.data?.eventId || eventStorage.getDefaultEventId();
}

export function registerRegistrationHandlers(
  bot: Bot,
  storage: RegistrationStorage,
  eventStorage: EventStorage,
  stateManager: UserStateManager
) {
  // CONFIRM_TYPO callback - user confirms suggested city
  bot.callbackQuery(/^typo:yes:(.+):(.+)$/, async (ctx) => {
    const original = ctx.match[1];
    const suggested = ctx.match[2];
    const eventId = getUserEventId(ctx, stateManager, eventStorage);

    logger.debug('Typo confirmation:', {
      userId: ctx.from?.id,
      original,
      suggested,
      eventId
    });

    await handleCitySelection(ctx, eventId, suggested, storage, stateManager);
    await ctx.answerCallbackQuery({ text: i18n.t("citySaved", { city: suggested }) });
  });

  // KEEP_ORIGINAL callback - user keeps their original input
  bot.callbackQuery(/^typo:no:(.+)$/, async (ctx) => {
    const original = ctx.match[1];
    const eventId = getUserEventId(ctx, stateManager, eventStorage);

    logger.debug('Keep original city:', {
      userId: ctx.from?.id,
      original,
      eventId
    });

    await handleCitySelection(ctx, eventId, original, storage, stateManager);
    await ctx.answerCallbackQuery({ text: i18n.t("citySaved", { city: original }) });
  });

  // TEXT message handler - processes city input and event creation
  bot.on("message:text", async (ctx) => {
    if (!ctx.from || ctx.message.text.startsWith("/")) return;

    const userState = stateManager.get(ctx.from.id);
    const input = ctx.message.text.trim();

    // Handle event creation flow (admin only)
    if (userState?.action === 'creating_event' && isAdmin(ctx.from.id)) {
      const result = handleEventCreationText(
        ctx.from.id,
        input,
        eventStorage,
        stateManager
      );

      if (!result.success) {
        await ctx.reply(i18n.t('enterMinChars'));
        return;
      }

      const botInfo = await ctx.api.getMe();
      const deepLink = `https://t.me/${botInfo.username}?start=${result.event.id}`;

      // Generate and send QR code PDF with full event info
      try {
        logger.info('Generating QR code PDF for event:', {
          eventId: result.event.id,
          deepLink
        });

        const pdfBuffer = await generateQRCodePDF(deepLink, result.event.name);

        // Send single message with PDF and all info
        await ctx.replyWithDocument(
          new InputFile(pdfBuffer, `event_${result.event.id}_qr.pdf`),
          {
            caption: `✅ Мероприятие создано!\n\n📋 Название: ${result.event.name}\n\n🔗 Deep link:\n${deepLink}`,
            parse_mode: "Markdown"
          }
        );

        logger.info('QR code PDF sent successfully:', { eventId: result.event.id });
      } catch (error) {
        logger.error('Failed to generate/send QR code PDF:', error);
        // Fallback: send text message if PDF generation fails
        await ctx.reply(
          i18n.t("eventCreated", {
            name: result.event.name,
            id: result.event.id,
            botUsername: botInfo.username || ''
          }),
          { parse_mode: "Markdown" }
        );
      }

      return;
    }

    // Handle city registration flow
    const eventId = userState?.data?.eventId;
    if (!eventId || storage.isRegistered(ctx.from.id, eventId)) {
      logger.debug('Ignoring text - not in registration flow or already registered');
      return;
    }

    if (input.length < 2) {
      await ctx.reply(i18n.t("enterMinChars"));
      return;
    }

    logger.debug('Processing city input:', {
      userId: ctx.from.id,
      eventId,
      input
    });

    // Check for exact match first
    const exactMatch = cities.find(city => city.toLowerCase() === input.toLowerCase());
    if (exactMatch) {
      const registration = storage.register(ctx.from.id, eventId, exactMatch, {
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
      });

      logger.info('Registration with exact match:', {
        userId: ctx.from.id,
        eventId,
        city: exactMatch
      });

      await ctx.reply(
        i18n.t("registrationComplete", {
          city: exactMatch,
          time: i18n.formatDateTime(new Date(registration.registeredAt))
        }),
        { parse_mode: "Markdown" }
      );
      stateManager.delete(ctx.from.id);
      return;
    }

    // Check for typos
    const closest = findClosestCity(input, cities);
    if (closest) {
      logger.debug('Found possible typo:', {
        userId: ctx.from.id,
        input,
        suggested: closest.city,
        distance: closest.distance
      });

      const keyboard = createTypoCorrectionKeyboard(input, closest.city);

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

    logger.info('Registration with custom city:', {
      userId: ctx.from.id,
      eventId,
      city: input
    });

    await ctx.reply(
      i18n.t("registrationComplete", {
        city: input,
        time: i18n.formatDateTime(new Date(registration.registeredAt))
      }),
      { parse_mode: "Markdown" }
    );
    stateManager.delete(ctx.from.id);
  });
}
