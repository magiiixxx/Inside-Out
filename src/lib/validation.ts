// Small checks used by every server action, kept in one place.

// What a room id, report id or request id looks like. The browser can send
// anything, so each action checks this before asking the database.
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One text field from a submitted form, trimmed. Missing becomes "".
export function formText(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}
