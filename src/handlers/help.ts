import { Bot } from "grammy";
import { i18n, log } from "@/utils/sdk-helpers";

export function registerHelpHandler(bot: Bot) {
  // Handle reply keyboard button "Помощь"
  bot.hears("❓ Помощь", async (ctx) => {
    log.info('Help button pressed:', { userId: ctx.from?.id });
    await ctx.reply(i18n.t("help"));
  });

  bot.command("help", async (ctx) => {
    log.info('Help command:', { userId: ctx.from?.id });
    await ctx.reply(i18n.t("help"));
  });
}
