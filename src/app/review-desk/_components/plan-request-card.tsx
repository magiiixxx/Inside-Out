import { activatePlan, dismissPlanRequest } from "@/app/review-desk/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { payMethodLabel } from "@/lib/payment";
import { PLAN_NAMES, type Plan } from "@/lib/plans";
import { telHref } from "@/lib/utils";
import type { OwnerNames, PlanRequest } from "./types";

// An owner asking for a paid plan. Activate only after the payment (GCash,
// Maya or bank) has arrived.

export function PlanRequestCard({ request, ownerName }: { request: PlanRequest; ownerName: OwnerNames }) {
  return (
    <Card className="max-w-3xl">
      <CardContent className="flex flex-col gap-4 pt-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Owner</dt>
          <dd className="font-semibold">{ownerName.get(request.owner_id) || "(no name)"}</dd>
          <dt className="text-muted-foreground">Wants</dt>
          <dd>{PLAN_NAMES[request.plan as Plan] ?? request.plan}</dd>
          <dt className="text-muted-foreground">Will pay by</dt>
          <dd>{payMethodLabel(request.pay_method)}</dd>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>
            <a href={telHref(request.contact_phone)}>{request.contact_phone}</a>
          </dd>
          <dt className="text-muted-foreground">Asked on</dt>
          <dd>{new Date(request.created_at).toLocaleDateString("en-PH")}</dd>
        </dl>
        <div className="flex flex-wrap gap-3">
          <form action={activatePlan}>
            <input type="hidden" name="request_id" value={request.id} />
            <Button type="submit" variant="accent">
              Activate plan
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
