import { Bot } from "grammy";
import { i18n } from "@/i18n";
import { log } from "@/utils/sdk-helpers";

export function registerErrorHandler(bot: Bot) {
  bot.catch((err) => {
    log.error('Bot error:', err);

    const ctx = err.ctx;
    if (ctx) {
      ctx.reply(i18n.t('errorOccurred')).catch((replyErr) => {
        log.error('Failed to send error message:', replyErr);
      });
    }
  });
}
