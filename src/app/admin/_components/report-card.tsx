import { resolveReport } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { reportReasonLabel } from "@/lib/reports";
import { telHref } from "@/lib/utils";
import type { OpenReport, OwnerNames } from "./types";

// One open report from a student. The team can hide the room until it has
// been checked (which also closes every open report about it), or just close
// this report.

export function ReportCard({ report, ownerName }: { report: OpenReport; ownerName: OwnerNames }) {
  return (
    <Card className="max-w-3xl">
      <CardContent className="flex flex-col gap-4 pt-6">
        <p className="font-bold leading-snug">{report.listings.description}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Problem</dt>
          <dd className="font-semibold">{reportReasonLabel(report.reason)}</dd>
          {report.note && (
            <>
              <dt className="text-muted-foreground">Detail</dt>
              <dd className="break-words">{report.note}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Reported by</dt>
          <dd>{ownerName.get(report.reporter_id) || "(no name)"}</dd>
          <dt className="text-muted-foreground">Owner phone</dt>
          <dd>
            <a href={telHref(report.listings.contact_phone)}>{report.listings.contact_phone}</a>
          </dd>
        </dl>
        <div className="flex flex-wrap gap-3">
          <form action={resolveReport}>
            <input type="hidden" name="report_id" value={report.id} />
            <input type="hidden" name="hide" value="1" />
            <Button type="submit" variant="accent">
              Hide room until checked
            </Button>
          </form>
          <form action={resolveReport}>
            <input type="hidden" name="report_id" value={report.id} />
            <Button type="submit" variant="outline">
              Mark resolved
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
