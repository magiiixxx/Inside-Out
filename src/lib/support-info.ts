import type { PayMethod } from "@/lib/payment";

// The team's contact details and payment accounts. They are set as settings in
// Vercel (Project, Settings, Environment Variables), NOT written in the code,
// so personal phone numbers and bank details never sit in the repository. See
// .env.example for the exact format. Whatever is left empty is simply not
// shown, so the site never displays a blank or a made-up detail.
//
// None of these are secrets from the owners who need them (that is the point of
// showing them), but they are only shown where they are needed: the contact
// details on the Help and Privacy pages, and the payment account only to an
// owner who has asked for a plan.

function setting(name: string): string {
  return (process.env[name] ?? "").trim();
}

export type Contact = { phone?: string; email?: string; facebook?: string };

// How the team can be reached. Each value is checked, so a typing mistake in
// the setting can never put odd text or a harmful link on the page.
export function getContact(): Contact {
  const phone = setting("CONTACT_PHONE");
  const email = setting("CONTACT_EMAIL");
  const facebook = setting("CONTACT_FACEBOOK");
  return {
    phone: /^[0-9+()\-\s]{7,20}$/.test(phone) ? phone : undefined,
    email: /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email) ? email : undefined,
    facebook: /^https:\/\/[^\s<>"]+$/.test(facebook) ? facebook : undefined,
  };
}

export type PaymentAccount = { heading: string; rows: { label: string; value: string }[] };

// Where an owner sends the payment for the way they chose to pay. null when
// the team has not set it up yet.
//   PAYMENT_GCASH = Account name | Mobile number
//   PAYMENT_MAYA  = Account name | Mobile number
//   PAYMENT_BANK  = Bank name | Account name | Account number
export function getPaymentAccount(method: PayMethod): PaymentAccount | null {
  const parts = (name: string, count: number) => {
    const values = setting(name).split("|").map((part) => part.trim());
    return values.length === count && values.every((value) => value.length > 0 && value.length <= 80) ? values : null;
  };

  if (method === "gcash" || method === "maya") {
    const values = parts(method === "gcash" ? "PAYMENT_GCASH" : "PAYMENT_MAYA", 2);
    if (!values) return null;
    return {
      heading: method === "gcash" ? "GCash" : "Maya",
      rows: [
        { label: "Account name", value: values[0] },
        { label: "Mobile number", value: values[1] },
      ],
    };
  }

  const values = parts("PAYMENT_BANK", 3);
  if (!values) return null;
  return {
    heading: "Bank transfer",
    rows: [
      { label: "Bank", value: values[0] },
      { label: "Account name", value: values[1] },
      { label: "Account number", value: values[2] },
    ],
  };
}
