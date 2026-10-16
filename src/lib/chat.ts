// Small helpers shared by the chat pages.

// The longest message. The database enforces the same limit.
export const CHAT_MAX = 1000;

// Turn a database error into one of our message codes (see src/lib/messages.ts),
// so people never see system text.
export function chatErrorCode(message: string): string {
  if (message.includes("Only students")) return "chat_students_only";
  if (message.includes("not available")) return "chat_room_unavailable";
  if (message.includes("1000 characters")) return "chat_bad_message";
  if (message.includes("too fast")) return "chat_too_fast";
  if (message.includes("too many chats")) return "chat_too_many";
  if (message.includes("not found")) return "chat_not_found";
  return "chat_failed";
}

// "5 min ago", "Yesterday", "12 Mar" for the chat list; the time for messages today.
export function chatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-PH", { day: "numeric", month: "short" });
}
