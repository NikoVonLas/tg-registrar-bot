import { Bot, InputFile } from "grammy";
import { i18n } from "@/i18n";
import { log } from "@/utils/sdk-helpers";
import { isAdmin } from "@/shared/auth";
import { CB } from "@/shared/callbacks";
import { createEventListKeyboard, createEventDetailsKeyboard } from "@/shared/keyboards";
import { RegistrationStorage, EventStorage, RegistrationAttemptStorage } from "@/storage";
import { formatCitiesStats } from "@/utils/formatters";
import { generateQRCodePDF } from "@/utils/qrcode";
import { escapeMarkdown } from "@/utils/markdown";

export function registerAdminHandlers(
  bot: Bot,
  storage: RegistrationStorage,
  eventStorage: EventStorage,
  attemptStorage: RegistrationAttemptStorage
) {
  // /admin command - shows event list
  bot.command("admin", async (ctx) => {
    if (!ctx.from) {
      log.warn('Admin command without ctx.from');
      return;
    }

    log.info('Admin command:', { userId: ctx.from.id });

    if (!isAdmin(ctx.from.id)) {
      await ctx.reply(i18n.t("noAccess"));
      return;
    }

    await ctx.reply(i18n.t("eventsList"), {
      reply_markup: createEventListKeyboard(eventStorage, storage, 0)
    });
  });

  // EVENT_LIST callback - show events list (page 0)
  bot.callbackQuery(CB.EVENT_LIST, async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: i18n.t("noAccess"), show_alert: true });
      return;
    }

    log.debug('Event list callback');
    await ctx.editMessageText(i18n.t("eventsList"), {
      reply_markup: createEventListKeyboard(eventStorage, storage, 0)
    });
    await ctx.answerCallbackQuery();
  });

  // EVENT_LIST_PAGE callback - show specific page
  bot.callbackQuery(/^event_list:(\d+)$/, async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: i18n.t("noAccess"), show_alert: true });
      return;
    }

    const page = parseInt(ctx.match[1]);
    log.debug('Event list page callback:', { page });

    await ctx.editMessageText(i18n.t("eventsList"), {
      reply_markup: createEventListKeyboard(eventStorage, storage, page)
    });
    await ctx.answerCallbackQuery();
  });

  // Ignore page_info callback (pagination display)
  bot.callbackQuery('page_info', async (ctx) => {
    await ctx.answerCallbackQuery();
  });

  // EVENT_DETAILS callback - show event details with stats
  bot.callbackQuery(/^event_details:(.+)$/, async (ctx) => {
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
    const formatted = formatCitiesStats(stats.byCities, 20);
    const attemptsCount = attemptStorage.getAttemptCount(eventId);

    const more = formatted.hasMore
      ? `\n\n${i18n.t("andMore", { count: formatted.moreCount })}`
      : '';

    const statusIcon = event.active ? '✅' : '🔴';
    const message = `${statusIcon} **${escapeMarkdown(event.name)}**\n\n` +
      `📊 **Статистика:**\n` +
      `• Завершили регистрацию: ${stats.total}\n` +
      `• ${i18n.t("startedNotCompleted")}: ${attemptsCount}\n\n` +
      `🏙 **По городам:**\n${formatted.text}${more}`;

    log.debug('Event details callback:', {
      eventId,
      registrations: stats.total,
      attempts: attemptsCount
    });

    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      reply_markup: createEventDetailsKeyboard(eventId)
    });
    await ctx.answerCallbackQuery();
  });

  // EVENT_RESEND_QR callback - resend QR code PDF
  bot.callbackQuery(/^event_qr:(.+)$/, async (ctx) => {
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

    await ctx.answerCallbackQuery({ text: "Генерирую QR-код..." });

    try {
      const botInfo = await ctx.api.getMe();
      const deepLink = `https://t.me/${botInfo.username}?start=${eventId}`;
      const displayLink = `https://t.me/${escapeMarkdown(botInfo.username || '')}?start=${eventId}`;

      log.info('Resending QR code for event:', { eventId });

      const pdfBuffer = await generateQRCodePDF(deepLink, event.name);

      await ctx.replyWithDocument(
        new InputFile(pdfBuffer, `event_${eventId}_qr.pdf`),
        {
          caption: `📋 ${escapeMarkdown(event.name)}\n\n🔗 ${displayLink}`,
          parse_mode: "Markdown"
        }
      );

      log.info('QR code resent successfully:', { eventId });
    } catch (error) {
      log.error('Failed to resend QR code:', error);
      await ctx.reply('⚠️ Не удалось сгенерировать QR-код.');
    }
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
      log.info('Event deleted:', { eventId, userId: ctx.from.id });
      await ctx.editMessageText(i18n.t("eventDeleted"));
      await ctx.answerCallbackQuery();

      // Show events list after deletion
      setTimeout(() => {
        ctx.editMessageText(i18n.t("eventsList"), {
          reply_markup: createEventListKeyboard(eventStorage, storage, 0)
        });
      }, 1000);
    } else {
      await ctx.answerCallbackQuery({ text: i18n.t("eventNotFound"), show_alert: true });
    }
  });
}
