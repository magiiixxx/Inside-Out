import Link from "next/link";
import { requestPlan } from "@/app/pricing/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { CheckIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserAndRole } from "@/lib/auth";
import { errorText, noticeText } from "@/lib/messages";
import { PAY_METHODS, payMethodLabel } from "@/lib/payment";
import { PLAN_NAMES, PLAN_PRICES, requestablePlans } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

// Plans for boarding house owners. Students are never charged.
//
// Be honest on this page: every feature is marked "Available now" or
// "Coming soon". Today only the room limit differs between plans, so only
// that is marked available. The rest is the roadmap in docs/LATER.md.
//
// The app takes no payments. An owner on Free sends a request here, pays the
// team directly by GCash, Maya or bank transfer, and a team member then
// activates the plan (supabase/sql/013-plan-requests.sql).
//
// An owner chooses Premium Owner or Property Manager in the form below. The
// Property Manager features are still "Coming soon", and the form says so.

export const dynamic = "force-dynamic";

type Feature = { text: string; live: boolean };

type PlanCard = {
  key?: "premium" | "manager"; // free has no key: it cannot be requested
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
    key: "premium",
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
    key: "manager",
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

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string; plan?: string }>;
}) {
  // The address carries only short codes; the text comes from our own list.
  const params = await searchParams;
  const notice = noticeText(params.notice);
  const error = errorText(params.error);
  // A "Choose this plan" button on a card links here with ?plan=manager.
  const preselected = params.plan === "manager" ? "manager" : "premium";

  const supabase = await createClient();
  const { user, role, plan } = await getUserAndRole(supabase);

  // Has this owner already asked? (Row Level Security: only their own.)
  let pending: { plan: "premium" | "manager"; pay_method: string } | null = null;
  if (role === "owner") {
    const { data } = await supabase
      .from("plan_requests")
      .select("plan, pay_method")
      .eq("status", "pending")
      .maybeSingle();
    pending = data ?? null;
  }

  const choices = requestablePlans(plan);

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

      {notice && (
        <p role="status" className="alert-success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}

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

            {plan.key && choices.includes(plan.key) && !pending && (
              <Link
                href={`/pricing?plan=${plan.key}#upgrade`}
                className={buttonVariants({ variant: plan.recommended ? "accent" : "outline" }) + " mt-auto"}
              >
                Choose {plan.name}
              </Link>
            )}
          </section>
        ))}
      </div>

      <section id="upgrade" className="card flex scroll-mt-20 flex-col gap-4 p-6">
        <h2 className="text-xl font-semibold">Upgrade your plan</h2>
        {!user ? (
          <>
            <p className="text-sm text-muted-foreground">
              Log in as an owner to choose a plan. Students never pay.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                Log in
              </Link>
              <Link href="/signup" className={buttonVariants()}>
                Sign up as an owner
              </Link>
            </div>
          </>
        ) : role !== "owner" ? (
          <p className="text-sm text-muted-foreground">
            Plans are for boarding house owners. Students use BahayFind for free.
          </p>
        ) : choices.length === 0 ? (
          <p className="alert-success">You already have the top plan. Thank you!</p>
        ) : pending ? (
          <p className="alert-info">
            Your request for {PLAN_NAMES[pending.plan]} is waiting. Our team will
            contact you to arrange payment by {payMethodLabel(pending.pay_method)}.
            The plan is switched on after we receive it.
          </p>
        ) : (
          <form action={requestPlan} className="flex max-w-xl flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Choose a plan and how you will pay, and give us a number to reach
              you on. Nothing is charged here: our team contacts you with the
              account details, and the plan is switched on once we have
              received your payment.
            </p>
            <fieldset className="flex flex-col gap-2">
              <legend className="label mb-1">Which plan?</legend>
              {choices.map((choice) => (
                <label
                  key={choice}
                  className="flex items-start gap-3 rounded-xl border border-field-line p-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-navy-soft"
                >
                  <input
                    type="radio"
                    name="plan"
                    value={choice}
                    defaultChecked={choices.includes(preselected) ? choice === preselected : choice === choices[0]}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-bold">{PLAN_NAMES[choice]}</span> — ₱{PLAN_PRICES[choice]} a month
                    {choice === "manager" && (
                      <span className="mt-0.5 block text-muted-foreground">
                        Includes everything in Premium Owner. Its extra features (inventory,
                        reports, staff accounts) are still coming soon.
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="label mb-1">How will you pay?</legend>
              <div className="flex flex-wrap gap-3">
                {PAY_METHODS.map((method, n) => (
                  <label key={method.value} className="flex items-center gap-2 text-sm font-semibold">
                    <input type="radio" name="pay_method" value={method.value} defaultChecked={n === 0} />
                    {method.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact_phone">Your phone number</Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. 0917 123 4567"
                required
              />
            </div>
            <Button type="submit" variant="accent" className="w-fit">
              Request this plan
            </Button>
          </form>
        )}
      </section>

      <section className="alert-info flex-col">
        <p>BahayFind does not take payments on this website. You pay the team directly by GCash, Maya or bank transfer.</p>
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
