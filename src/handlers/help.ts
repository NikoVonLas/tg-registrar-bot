import { Bot } from "grammy";
import { i18n, log } from "@/utils/sdk-helpers";
import { CB } from "@/shared/callbacks";

export function registerHelpHandler(bot: Bot) {
  // Handle inline button "Помощь"
  bot.callbackQuery(CB.HELP, async (ctx) => {
    log.info('Help button pressed:', { userId: ctx.from?.id });
    await ctx.answerCallbackQuery();
    await ctx.reply(i18n.t("help"));
  });

  bot.command("help", async (ctx) => {
    log.info('Help command:', { userId: ctx.from?.id });
    await ctx.reply(i18n.t("help"));
  });
}
