// The shapes of the rows the team page reads from the database. They live
// here so the page and the cards agree on them.

export type OwnerNames = Map<string, string>;

export type PendingCheck = {
  permit_number: string;
  owner_or_caretaker: string;
  open_beds: number;
  listings: {
    id: string;
    owner_id: string;
    description: string;
    price_per_month: number;
    distance_km: number;
    contact_phone: string;
    address: string | null;
    photo_path: string | null;
    created_at: string;
  };
};

export type PlanRequest = {
  id: string;
  owner_id: string;
  plan: string;
  pay_method: string;
  contact_phone: string;
  created_at: string;
  payment_reference: string | null;
  reference_sent_at: string | null;
};

export type OpenReport = {
  id: string;
  reason: string;
  note: string | null;
  created_at: string;
  reporter_id: string;
  listings: { id: string; description: string; contact_phone: string };
};

export type OtherRoom = {
  id: string;
  owner_id: string | null;
  description: string;
  price_per_month: number;
  contact_phone: string;
  approval_status: "approved" | "rejected";
  rating_count: number;
};

export type SupportMessage = {
  id: string;
  user_id: string;
  kind: "bug" | "feedback" | "question";
  message: string;
  page: string | null;
  created_at: string;
};
