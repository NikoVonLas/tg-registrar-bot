import { InlineKeyboard } from "grammy";
import { i18n } from "@/utils/sdk-helpers";
import { CB } from "@/shared/callbacks";
import { EventStorage, RegistrationStorage, RegistrationAttemptStorage } from "@/storage";
import { Event } from "@/storage";

export function createTypoCorrectionKeyboard(input: string, suggested: string) {
  return new InlineKeyboard()
    .text(i18n.t("yesImeant", { city: suggested }), CB.CONFIRM_TYPO(input, suggested))
    .row()
    .text(i18n.t("noKeepMine", { city: input }), CB.KEEP_ORIGINAL(input));
}

// New admin menu - paginated event list
const EVENTS_PER_PAGE = 8;

export function createEventListKeyboard(
  eventStorage: EventStorage,
  registrationStorage: RegistrationStorage,
  page: number = 0
) {
  const keyboard = new InlineKeyboard();
  const allEvents = eventStorage.getAllEvents(); // Already sorted by date desc
  const totalPages = Math.ceil(allEvents.length / EVENTS_PER_PAGE);
  const startIdx = page * EVENTS_PER_PAGE;
  const endIdx = Math.min(startIdx + EVENTS_PER_PAGE, allEvents.length);
  const pageEvents = allEvents.slice(startIdx, endIdx);

  // Add event buttons
  for (const event of pageEvents) {
    const count = registrationStorage.getStats(event.id).total;
    const statusIcon = event.active ? '✅' : '🔴';
    keyboard
      .text(`${statusIcon} ${event.name} (${count})`, CB.EVENT_DETAILS(event.id))
      .row();
  }

  // Add "Create Event" button
  keyboard.text(`➕ ${i18n.t("createEvent")}`, CB.CREATE_EVENT).row();

  // Add pagination if needed
  if (totalPages > 1) {
    const buttons = [];
    if (page > 0) {
      buttons.push({ text: '← Назад', callback_data: CB.EVENT_LIST_PAGE(page - 1) });
    }
    buttons.push({ text: `${page + 1} / ${totalPages}`, callback_data: 'page_info' });
    if (page < totalPages - 1) {
      buttons.push({ text: 'Вперёд →', callback_data: CB.EVENT_LIST_PAGE(page + 1) });
    }
    keyboard.row(...buttons as any);
  }

  return keyboard;
}

export function createEventDetailsKeyboard(eventId: string) {
  return new InlineKeyboard()
    .text(`📄 ${i18n.t("resendQR")}`, CB.EVENT_RESEND_QR(eventId))
    .row()
    .text(`🗑 ${i18n.t("deleteEvent")}`, CB.EVENT_DELETE(eventId))
    .row()
    .text(`← ${i18n.t("backToEvents")}`, CB.EVENT_LIST);
}
