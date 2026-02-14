import { Bot } from "grammy";
import { logger } from "../logger";
import { isAdmin } from "../shared/auth";
import { CB } from "../shared/callbacks";
import { EventStorage } from "../storage";
import { UserStateManager } from "../shared/state";

export function registerEventsHandlers(
  bot: Bot,
  eventStorage: EventStorage,
  stateManager: UserStateManager
) {
  // CREATE_EVENT callback - start event creation flow
  bot.callbackQuery(CB.CREATE_EVENT, async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.answerCallbackQuery({ text: "Access denied", show_alert: true });
      return;
    }

    logger.debug('Create event callback:', { userId: ctx.from.id });
    stateManager.set(ctx.from.id, 'creating_event');
    await ctx.editMessageText("Введите название мероприятия:");
    await ctx.answerCallbackQuery();
  });
}

// Helper function to handle event creation text input
export function handleEventCreationText(
  userId: number,
  text: string,
  eventStorage: EventStorage,
  stateManager: UserStateManager
): { success: boolean; event?: any } {
  if (text.length < 2) {
    return { success: false };
  }

  const event = eventStorage.createEvent(text, userId);
  stateManager.delete(userId);

  logger.info('Event created via text:', { eventId: event.id, name: event.name, userId });

  return { success: true, event };
}
