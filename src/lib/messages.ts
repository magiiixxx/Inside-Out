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
  bad_address: "Please enter the room's address (5 to 200 characters).",
  need_address_ok: "Please confirm that you understand the address will be public.",
  bad_photo: "The photo must be a JPG, PNG or WebP picture, up to 2 MB.",
  photo_failed: "We could not upload the photo. Please try again.",
  edit_failed: "We could not save your changes. Please check the form and try again.",
  post_failed: "We could not save your room. Please check the form and try again.",
  plan_limit:
    "The Free plan allows one room. See the plans, then ask our team about Premium Owner to post more.",

  // Plan requests
  bad_plan: "Please choose Premium Owner or Property Manager.",
  plan_already: "You already have that plan.",
  bad_pay_method: "Please choose GCash, Maya or bank transfer.",
  bad_contact_phone: "Please enter a phone number our team can reach you on.",
  plan_request_exists: "You already have a request waiting. Our team will contact you.",
  plan_request_failed: "We could not send your request. Please try again.",

  // Owner home and team review
  invalid_request: "That request was not valid.",
  update_failed: "We could not update that room. Please try again.",
  plan_action_failed: "We could not update that plan request. It may already have been handled.",
  plan_not_upgrade:
    "That owner already has this plan or a higher one. Press Dismiss to clear the request.",
  review_failed: "We could not review that room. It may already have been reviewed.",
  delete_failed: "We could not delete that room. It may already be gone.",

  // Reports, ratings and rejection reasons
  need_reason: "Please say why you are rejecting this room (5 to 300 characters).",
  report_failed: "We could not send your report. Please try again.",
  already_reported: "You already reported this room. Our team will look at it.",
  students_only_report: "Only student accounts can report a room.",
  students_only_rate: "Only student accounts can rate a room.",
  room_gone: "That room is no longer available.",
  rate_failed: "We could not save your rating. Please try again.",
  report_action_failed: "We could not update that report. It may already be closed.",

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
  edited_live: "Changes saved. The new price is live.",
  edited_review:
    "Changes saved. Because you changed details students rely on, our team will check the room again before students see it.",
  plan_requested:
    "Request sent. Our team will contact you to arrange payment. Premium Owner is switched on after we receive it.",
  plan_activated: "Plan activated. The owner can now post more rooms.",
  plan_dismissed: "Request dismissed.",
  report_sent: "Thank you. Your report was sent to our team.",
  rated: "Thanks for rating this room.",
  report_resolved: "Report marked as resolved.",
  report_hidden: "Room hidden until it has been checked, and its reports closed.",
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
