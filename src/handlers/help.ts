import { Bot } from "grammy";
import { i18n } from "@/i18n";
import { log } from "@/utils/sdk-helpers";

export function registerHelpHandler(bot: Bot) {
  bot.command("help", async (ctx) => {
    log.info('Help command:', { userId: ctx.from?.id });
    await ctx.reply(i18n.t("help"));
  });
}
