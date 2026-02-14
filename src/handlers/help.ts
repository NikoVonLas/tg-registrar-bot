import { Bot } from "grammy";
import { i18n } from "../i18n";
import { logger } from "../logger";

export function registerHelpHandler(bot: Bot) {
  bot.command("help", async (ctx) => {
    logger.info('Help command:', { userId: ctx.from?.id });
    await ctx.reply(i18n.t("help"));
  });
}
