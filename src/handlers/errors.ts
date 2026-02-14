import { Bot } from "grammy";
import { i18n } from "../i18n";
import { logger } from "../logger";

export function registerErrorHandler(bot: Bot) {
  bot.catch((err) => {
    logger.error('Bot error:', err);

    const ctx = err.ctx;
    if (ctx) {
      ctx.reply(i18n.t('errorOccurred')).catch((replyErr) => {
        logger.error('Failed to send error message:', replyErr);
      });
    }
  });
}
