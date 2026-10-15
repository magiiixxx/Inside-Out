// FICTIONAL sample reviews, used only to show how reviews will look. They are
// not stored anywhere, not counted in any average, and never mixed with real
// student ratings. Every place that shows one also shows a DEMO label.
//
// The texts are generic on purpose: they do not describe any real room, owner or
// person, so they cannot be mistaken for facts about a listing.

export type DemoStars = 1 | 2 | 3 | 4 | 5;

export type DemoReview = { reviewer: string; date: string; text: string };

export const DEMO_LABEL = "DEMO DATA \u2014 NOT A REAL USER REVIEW";

export const DEMO_REVIEWS: Record<DemoStars, DemoReview> = {
  1: {
    reviewer: "Sample Reviewer A.",
    date: "January 8, 2026",
    text: "The room was not as described and nobody answered the phone when I arrived. I would not stay here.",
  },
  2: {
    reviewer: "Sample Reviewer B.",
    date: "February 2, 2026",
    text: "The location is fine, but the room was noisy at night and the bed space was smaller than I expected.",
  },
  3: {
    reviewer: "Sample Reviewer C.",
    date: "February 20, 2026",
    text: "An okay place for the price. Clean enough and not far from campus, but the water pressure was weak.",
  },
  4: {
    reviewer: "Sample Reviewer D.",
    date: "March 5, 2026",
    text: "Quiet and tidy, and the owner replied quickly when I called. A short walk to school. A few small repairs were still needed.",
  },
  5: {
    reviewer: "Sample Reviewer E.",
    date: "March 12, 2026",
    text: "Very clean and comfortable, and the owner was easy to reach. Close to campus and good value. I would stay again.",
  },
};

export function isDemoStars(n: number): n is DemoStars {
  return Number.isInteger(n) && n >= 1 && n <= 5;
}
