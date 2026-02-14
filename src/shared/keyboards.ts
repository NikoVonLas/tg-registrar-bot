import { InlineKeyboard } from "grammy";
import { i18n } from "../i18n";
import { CB } from "./callbacks";
import { EventStorage, RegistrationStorage } from "../storage";

export function createAdminMenuKeyboard() {
  return new InlineKeyboard()
    .text(i18n.t("manageEvents"), CB.MANAGE_EVENTS)
    .row()
    .text(i18n.t("totalRegistered"), CB.ADMIN_TOTAL)
    .row()
    .text(i18n.t("citiesStats"), CB.ADMIN_CITIES)
    .row()
    .text(i18n.t("exportData"), CB.ADMIN_EXPORT);
}

export function createEventsListKeyboard(
  eventStorage: EventStorage,
  storage: RegistrationStorage
) {
  const keyboard = new InlineKeyboard();
  const events = eventStorage.getActiveEvents();

  for (const event of events) {
    const count = storage.getStats(event.id).total;
    keyboard.text(`${event.name} (${count})`, CB.EVENT_INFO(event.id)).row();
  }

  keyboard.text(i18n.t("createEvent"), CB.CREATE_EVENT).row();
  keyboard.text("← " + i18n.t("adminMenu"), CB.ADMIN_MENU);
  return keyboard;
}

export function createEventInfoKeyboard(eventId: string) {
  const keyboard = new InlineKeyboard()
    .text(i18n.t("deepLink"), CB.EVENT_DEEPLINK(eventId))
    .row()
    .text(i18n.t("deleteEvent"), CB.EVENT_DELETE(eventId))
    .row()
    .text(i18n.t("backToEvents"), CB.EVENT_LIST);
  return keyboard;
}

export function createTypoCorrectionKeyboard(input: string, suggested: string) {
  return new InlineKeyboard()
    .text(i18n.t("yesImeant", { city: suggested }), CB.CONFIRM_TYPO(input, suggested))
    .row()
    .text(i18n.t("noKeepMine", { city: input }), CB.KEEP_ORIGINAL(input));
}
