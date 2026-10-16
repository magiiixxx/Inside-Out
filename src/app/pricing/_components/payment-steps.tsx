import { submitPaymentReference } from "@/app/pricing/actions";
import { ContactLines } from "@/components/contact-lines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentAccount } from "@/lib/support-info";

// What an owner sees after pressing Request plan: pay (QR code or account
// details), then type the reference number from the payment, then wait for the
// team to confirm. BahayFind takes no money: the owner pays outside the app, and
// this only collects the reference number so the team can check it.

export function PaymentSteps({
  planName,
  amount,
  methodLabel,
  qrUrl,
  account,
  reference,
}: {
  planName: string;
  amount: number;
  methodLabel: string;
  qrUrl: string | null;
  account: PaymentAccount | null;
  reference: string | null;
}) {
  return (
    <div className="flex max-w-xl flex-col gap-5">
      <p className="alert-info">
        Your request for {planName} is in. Follow the two steps below. Your plan is switched on after our team
        confirms your payment.
      </p>

      <section aria-labelledby="pay-step" className="rounded-2xl border border-line p-5">
        <h3 id="pay-step" className="text-lg font-extrabold">
          <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber text-sm text-on-amber">1</span>
          Pay {"\u20B1"}
          {amount} by {methodLabel}
        </h3>

        {qrUrl ? (
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="rounded-xl bg-white p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element -- a private QR code from Supabase Storage, shown through a short-lived link */}
              <img src={qrUrl} alt={`${methodLabel} QR code for ${"\u20B1"}${amount}`} className="mx-auto w-full max-w-[16rem] rounded-lg" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Scan it with {methodLabel} or any InstaPay-ready app. The amount is already filled in. Check that it
              says {"\u20B1"}
              {amount}.00 before you pay. If the code does not show, refresh this page.
            </p>
          </div>
        ) : account ? (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-sm">
            {account.rows.map((row) => (
              <div key={row.label} className="contents">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-bold">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-3 text-sm text-muted-foreground">
            <p>Our team will contact you with the {methodLabel} details for your payment.</p>
            <ContactLines className="mt-2" />
          </div>
        )}
      </section>

      <section aria-labelledby="ref-step" className="rounded-2xl border border-line p-5">
        <h3 id="ref-step" className="text-lg font-extrabold">
          <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber text-sm text-on-amber">2</span>
          Enter your payment reference number
        </h3>

        {reference ? (
          <p role="status" className="alert-success mt-3">
            Reference received: <strong className="break-all">{reference}</strong>. Our team will check it against our
            records and switch your plan on.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            After you pay, {methodLabel} shows a receipt with a reference number. Type it here so our team can find
            your payment.
          </p>
        )}

        <form action={submitPaymentReference} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reference">Payment reference number</Label>
            <Input
              id="reference"
              name="reference"
              defaultValue={reference ?? ""}
              minLength={6}
              maxLength={40}
              autoComplete="off"
              inputMode="text"
              placeholder="e.g. 1234567890123"
              required
            />
            <p className="hint">6 to 40 letters and numbers, from your payment receipt. Each reference can be used once.</p>
          </div>
          <Button type="submit" variant={reference ? "outline" : "accent"} className="w-fit">
            {reference ? "Update reference number" : "Send reference number"}
          </Button>
        </form>
      </section>
    </div>
  );
}
