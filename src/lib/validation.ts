// Small checks used by every server action, kept in one place.

// What a room id, report id or request id looks like. The browser can send
// anything, so each action checks this before asking the database.
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One text field from a submitted form, trimmed. Missing becomes "".
export function formText(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

// The password rule for new passwords (sign up and reset): at least 8
// characters, with a letter and a number, and at most 72 (longer passwords
// are cut off by the way Supabase stores them). Returns true when the
// password is NOT good enough. Supabase also has its own minimum length
// setting (Authentication, Sign In / Providers, Email); keep it at 8 or more.
export function isWeakPassword(password: string): boolean {
  return password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password);
}

// The payment reference number an owner types after paying (GCash, Maya or bank):
// 6 to 40 letters, numbers, spaces and dashes, with at least 6 real letters or
// numbers among them (so "------" or spaces alone do not count). The database
// checks the same rule.
export function isValidPaymentReference(reference: string): boolean {
  return /^(?=(?:[^A-Za-z0-9]*[A-Za-z0-9]){6})[A-Za-z0-9 -]{6,40}$/.test(reference);
}
