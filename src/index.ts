import { Bot } from "grammy";
import { getSDK } from "@/sdk";
import { log } from "@/utils/sdk-helpers";
import { i18n } from "@/i18n";
import { RegistrationStorage, EventStorage, RegistrationAttemptStorage } from "@/storage";
import { UserStateManager } from "@/shared/state";
import { registerHelpHandler } from "@/handlers/help";
import { registerErrorHandler } from "@/handlers/errors";
import { registerAdminHandlers } from "@/handlers/admin";
import { registerEventsHandlers } from "@/handlers/events";
import { registerStartHandler } from "@/handlers/start";
import { registerRegistrationHandlers } from "@/handlers/registration";

// Initialize storage and state
const storage = new RegistrationStorage();
const eventStorage = new EventStorage();
const attemptStorage = new RegistrationAttemptStorage();
const stateManager = new UserStateManager();

export default function setup(bot: Bot) {
  // Initialize i18n language from SDK
  getSDK().then(sdk => {
    i18n.setLanguage(sdk.config.language || 'ru-RU');
  });

  log.info('Setting up bot handlers...');

  // Register all handlers
  registerStartHandler(bot, eventStorage, storage, attemptStorage, stateManager);
  registerRegistrationHandlers(bot, storage, eventStorage, attemptStorage, stateManager);
  registerAdminHandlers(bot, storage, eventStorage, attemptStorage);
  registerEventsHandlers(bot, eventStorage, stateManager);
  registerHelpHandler(bot);
  registerErrorHandler(bot);

  log.info('Bot handlers registered successfully');

  // Cleanup on exit
  const cleanup = async () => {
    log.info('Cleaning up...');
    stateManager.cleanup();
    const sdk = await getSDK();
    await sdk.close();
  };

  process.on('SIGINT', async () => {
    log.info('Received SIGINT');
    await cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    log.info('Received SIGTERM');
    await cleanup();
    process.exit(0);
  });
}
