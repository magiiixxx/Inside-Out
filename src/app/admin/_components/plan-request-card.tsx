import { activatePlan, dismissPlanRequest } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { payMethodLabel } from "@/lib/payment";
import { PLAN_NAMES, PLAN_PRICES, type Plan } from "@/lib/plans";
import { telHref } from "@/lib/utils";
import type { OwnerNames, PlanRequest } from "./types";

// An owner asking for a paid plan. The owner pays outside the app (a QR code on
// the Plans page), then types the payment reference number. The team finds that
// number in their own GCash, Maya or bank records, and only then presses Activate.
// Activate stays switched off until a reference number has been sent (the database
// refuses too).

export function PlanRequestCard({ request, ownerName }: { request: PlanRequest; ownerName: OwnerNames }) {
  const amount = PLAN_PRICES[request.plan as Exclude<Plan, "free">];
  const hasReference = request.payment_reference !== null;
  return (
    <Card className="max-w-3xl">
      <CardContent className="flex flex-col gap-4 pt-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Owner</dt>
          <dd className="font-semibold">{ownerName.get(request.owner_id) || "(no name)"}</dd>
          <dt className="text-muted-foreground">Wants</dt>
          <dd>{PLAN_NAMES[request.plan as Plan] ?? request.plan}</dd>
          <dt className="text-muted-foreground">Amount to find</dt>
          <dd className="font-bold">{amount ? `\u20B1${amount}` : "\u2014"}</dd>
          <dt className="text-muted-foreground">Paid by</dt>
          <dd>{payMethodLabel(request.pay_method)}</dd>
          <dt className="text-muted-foreground">Payment reference</dt>
          <dd>
            {hasReference ? (
              <span className="break-all rounded bg-surface px-2 py-1 font-extrabold tracking-wide">{request.payment_reference}</span>
            ) : (
              <span className="chip chip-amber">Not sent yet</span>
            )}
          </dd>
          {request.reference_sent_at && (
            <>
              <dt className="text-muted-foreground">Reference sent</dt>
              <dd>{new Date(request.reference_sent_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Phone</dt>
          <dd>
            <a href={telHref(request.contact_phone)}>{request.contact_phone}</a>
          </dd>
          <dt className="text-muted-foreground">Asked on</dt>
          <dd>{new Date(request.created_at).toLocaleDateString("en-PH")}</dd>
        </dl>

        {hasReference ? (
          <p className="text-sm text-muted-foreground">
            Open your {payMethodLabel(request.pay_method)} records, find this reference number, and check that the amount
            is {"\u20B1"}
            {amount} and the sender matches. Only then press Activate.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            The owner has not sent a reference number yet, so there is nothing to confirm. Activate switches on when they do.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <form action={activatePlan}>
            <input type="hidden" name="request_id" value={request.id} />
            <input type="hidden" name="reference" value={request.payment_reference ?? ""} />
            <Button type="submit" variant="accent" disabled={!hasReference}>
              Payment confirmed: activate plan
            </Button>
          </form>
          <form action={dismissPlanRequest}>
            <input type="hidden" name="request_id" value={request.id} />
            <Button type="submit" variant="outline">
              Dismiss
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
