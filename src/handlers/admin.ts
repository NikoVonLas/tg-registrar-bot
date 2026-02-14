import { Bot, InlineKeyboard, InputFile } from "grammy";
import { i18n } from "../i18n";
import { logger } from "../logger";
import { isAdmin } from "../shared/auth";
import { CB } from "../shared/callbacks";
import { createAdminMenuKeyboard } from "../shared/keyboards";
import { RegistrationStorage } from "../storage";
import { formatCitiesStats } from "../utils/formatters";

export function registerAdminHandlers(
  bot: Bot,
  storage: RegistrationStorage
) {
  // /admin command - shows admin menu
  bot.command("admin", async (ctx) => {
    if (!ctx.from) {
      logger.warn('Admin command without ctx.from');
      return;
    }

    logger.info('Admin command:', { userId: ctx.from.id });

    if (!isAdmin(ctx.from.id)) {
      await ctx.reply(i18n.t("noAccess"));
      return;
    }

    await ctx.reply(i18n.t("adminMenu"), {
      reply_markup: createAdminMenuKeyboard()
    });
  });

  // ADMIN_MENU callback - return to main admin menu
  bot.callbackQuery(CB.ADMIN_MENU, async (ctx) => {
    logger.debug('Admin menu callback');
    await ctx.editMessageText(i18n.t("adminMenu"), {
      reply_markup: createAdminMenuKeyboard()
    });
    await ctx.answerCallbackQuery();
  });

  // ADMIN_TOTAL callback - show total count
  bot.callbackQuery(CB.ADMIN_TOTAL, async (ctx) => {
    const stats = storage.getStats();
    logger.debug('Admin total callback:', { total: stats.total });
    await ctx.answerCallbackQuery({
      text: i18n.t("totalCount", { count: stats.total }),
      show_alert: true
    });
  });

  // ADMIN_CITIES callback - show cities statistics
  bot.callbackQuery(CB.ADMIN_CITIES, async (ctx) => {
    const stats = storage.getStats();
    const formatted = formatCitiesStats(stats.byCities, 20);

    const more = formatted.hasMore
      ? `\n\n${i18n.t("andMore", { count: formatted.moreCount })}`
      : '';

    const keyboard = new InlineKeyboard().text(
      "← " + i18n.t("adminMenu"),
      CB.ADMIN_MENU
    );

    logger.debug('Admin cities callback:', {
      total: stats.total,
      citiesCount: Object.keys(stats.byCities).length
    });

    await ctx.editMessageText(
      i18n.t("stats", { total: stats.total, cities: formatted.text + more }),
      { parse_mode: "Markdown", reply_markup: keyboard }
    );
    await ctx.answerCallbackQuery();
  });

  // ADMIN_EXPORT callback - export CSV file
  bot.callbackQuery(CB.ADMIN_EXPORT, async (ctx) => {
    const registrations = storage.getAllRegistrations();

    logger.info('Admin export callback:', { count: registrations.length });

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

  // /stats command - show statistics (admin only)
  bot.command("stats", async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply(i18n.t("noAccess"));
      return;
    }

    const stats = storage.getStats();
    const formatted = formatCitiesStats(stats.byCities, 20);

    const more = formatted.hasMore
      ? `\n\n${i18n.t("andMore", { count: formatted.moreCount })}`
      : '';

    logger.info('Stats command:', {
      userId: ctx.from.id,
      total: stats.total
    });

    await ctx.reply(
      i18n.t("stats", { total: stats.total, cities: formatted.text + more }),
      { parse_mode: "Markdown" }
    );
  });

  // /export command - export data to CSV (admin only)
  bot.command("export", async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply(i18n.t("noAccess"));
      return;
    }

    const registrations = storage.getAllRegistrations();

    logger.info('Export command:', {
      userId: ctx.from.id,
      count: registrations.length
    });

    let csv = "UserID,EventID,Username,FirstName,LastName,City,RegisteredAt\n";
    for (const reg of registrations) {
      csv += `${reg.userId},"${reg.eventId}","${reg.username || ''}","${reg.firstName || ''}","${reg.lastName || ''}","${reg.city}","${reg.registeredAt}"\n`;
    }

    await ctx.replyWithDocument(
      new InputFile(Buffer.from(csv, 'utf-8'), `registrations_${Date.now()}.csv`),
      { caption: i18n.t("export", { count: registrations.length }) }
    );
  });
}
