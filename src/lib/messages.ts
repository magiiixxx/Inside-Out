// Every message shown on a page after a form is submitted.
//
// Why a fixed list? The pages learn what happened from a short CODE in the
// web address (for example /login?error=invalid_credentials) and look the
// text up here. If a page printed whatever text was in the address, anyone
// could send a link like /login?error=Call 0917… and it would appear
// inside OUR red error box looking official. With a list, an unknown code
// simply shows nothing.
//
// It also keeps database and system messages away from users.

const ERRORS: Record<string, string> = {
  // Log in and sign up
  missing_login: "Please enter your email and password.",
  invalid_credentials: "That email and password did not match. Please try again.",
  missing_signup: "Please fill in your name and email.",
  weak_password: "Your password needs at least 6 characters.",
  email_taken: "An account with that email already exists. Try logging in.",
  too_many_attempts: "Too many attempts. Please wait a minute and try again.",
  signup_failed: "We could not create your account. Please try again.",

  // Add a room
  bad_description: "Please describe the room in 10 to 500 characters.",
  bad_price: "Please enter a monthly price above 0.",
  bad_distance: "Please enter the distance from PHINMA UI in km, for example 0.8.",
  bad_phone: "Please enter a phone number students can call.",
  bad_permit: "Please enter your business permit number.",
  bad_role: "Please say whether you are the owner or a caretaker.",
  bad_beds: "Please enter how many beds are open right now.",
  need_call_ok: "Please agree that our team may call you to confirm the room.",
  need_phone_ok: "Please confirm that you understand your phone number will be public.",
  post_failed: "We could not save your room. Please check the form and try again.",

  // Owner home and team review
  invalid_request: "That request was not valid.",
  update_failed: "We could not update that room. Please try again.",
  review_failed: "We could not review that room. It may already have been reviewed.",
  delete_failed: "We could not delete that room. It may already be gone.",

  // Saved rooms
  students_only: "Only student accounts can save rooms.",
  too_many_saved: "You can save up to 50 rooms. Remove one to save another.",
  room_unavailable: "That room is not available to save any more.",
  favorite_failed: "We could not update your saved rooms. Please try again.",
};

const NOTICES: Record<string, string> = {
  confirm_email: "Account created. Check your email to confirm it, then log in.",
  posted: "Room submitted. Our team will check it before students can see it.",
  available: "Room marked available.",
  occupied: "Room marked occupied.",
  renewed: "Room renewed. Students can see it again.",
  approved: "Room approved. Students can now see it.",
  rejected: "Room rejected.",
  deleted: "Room deleted.",
  saved: "Room saved.",
  unsaved: "Room removed from your saved rooms.",
};

function lookup(list: Record<string, string>, code: string | undefined) {
  // hasOwnProperty so that a code like "constructor" is not found.
  return code && Object.prototype.hasOwnProperty.call(list, code)
    ? list[code]
    : null;
}

export function errorText(code: string | undefined): string | null {
  return lookup(ERRORS, code);
}

export function noticeText(code: string | undefined): string | null {
  return lookup(NOTICES, code);
}
