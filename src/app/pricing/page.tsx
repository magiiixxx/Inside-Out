import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CheckIcon } from "@/components/icons";

// Plans for boarding house owners. Students are never charged.
//
// Be honest on this page: every feature is marked "Available now" or
// "Coming soon". Today only the room limit differs between plans, so only
// that is marked available. The rest is the roadmap in docs/LATER.md.
//
// The app takes no payments. To upgrade, an owner arranges payment with
// the team, and a team member changes the plan by hand.

// Where owners should go to upgrade. Edit this sentence when the team has
// a contact (a Messenger page, a phone number, a desk at the school).
const HOW_TO_UPGRADE =
  "To upgrade, contact the BahayFind team. You arrange payment with the team directly. BahayFind does not take payments on this website.";

type Feature = { text: string; live: boolean };

type PlanCard = {
  name: string;
  price: string;
  forWho: string;
  recommended?: boolean;
  comingSoon?: boolean;
  features: Feature[];
};

const PLANS: PlanCard[] = [
  {
    name: "Free",
    price: "₱0",
    forWho: "For new landlords",
    features: [
      { text: "One room listing", live: true },
      { text: "Standard search visibility", live: true },
      { text: "Basic availability updates", live: true },
      { text: "Direct contact from renters", live: true },
    ],
  },
  {
    name: "Premium Owner",
    price: "₱149",
    forWho: "For small boarding houses",
    recommended: true,
    features: [
      { text: "Multiple active room listings", live: true },
      { text: "Listing analytics", live: false },
      { text: "Inquiry and waiting-list management", live: false },
      { text: "Availability reminders", live: false },
      { text: "Additional photos and property details", live: false },
    ],
  },
  {
    name: "Property Manager",
    price: "₱299",
    forWho: "For larger boarding houses",
    comingSoon: true,
    features: [
      { text: "Everything in Premium Owner", live: false },
      { text: "Multiple room and bed inventory", live: false },
      { text: "Occupancy and vacancy reports", live: false },
      { text: "Rental income summaries", live: false },
      { text: "Multiple authorized staff accounts", live: false },
    ],
  },
];

export default function PricingPage() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-3">
        <span className="chip chip-amber w-fit">For boarding house owners</span>
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Plans for owners
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          Students always use BahayFind for free. Owners start free with one
          room, and can upgrade to post more.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <section
            key={plan.name}
            className={`card flex flex-col gap-4 p-5 ${plan.recommended ? "border-2 border-navy" : ""}`}
          >
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                {plan.recommended && <span className="chip chip-navy">Recommended</span>}
                {plan.comingSoon && <span className="chip chip-amber">Coming soon</span>}
              </div>
              <p className="text-sm text-muted-foreground">{plan.forWho}</p>
            </div>

            <p className="font-display text-3xl font-extrabold tracking-tight">
              {plan.price}
              <span className="text-base font-medium text-muted-foreground">
                {plan.price === "₱0" ? "" : " / month"}
              </span>
            </p>

            <ul className="flex flex-col gap-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature.text} className="flex items-start gap-2">
                  <CheckIcon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${feature.live ? "text-ok" : "text-muted-foreground"}`}
                  />
                  <span>
                    {feature.text}{" "}
                    <span className={feature.live ? "chip chip-ok" : "chip"}>
                      {feature.live ? "Available now" : "Coming soon"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="alert-info flex-col">
        <p>{HOW_TO_UPGRADE}</p>
        <p className="font-normal">
          The prices are drafts that we are testing with our first owners.
          Features marked &ldquo;Coming soon&rdquo; are not built yet.
        </p>
      </section>

      <Link href="/" className={buttonVariants({ variant: "ghost" }) + " w-fit"}>
        ← Back to rooms
      </Link>
    </main>
  );
}
