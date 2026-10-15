import Link from "next/link";
import { sendSupportMessage } from "@/app/support/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { errorText, noticeText } from "@/lib/messages";

export const dynamic = "force-dynamic";

const KINDS = [
  { value: "bug", label: "Something is broken", hint: "A page, button or form that does not work" },
  { value: "feedback", label: "An idea or feedback", hint: "How we could make BahayFind better" },
  { value: "question", label: "A question for the team", hint: "Help with your account or a room" },
];

export default async function ReportProblemPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; notice?: string; error?: string }>;
}) {
  const params = await searchParams;
  const notice = noticeText(params.notice);
  const error = errorText(params.error);
  const kind = KINDS.some((k) => k.value === params.kind) ? params.kind : "bug";
  await requireUser();

  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
      <header>
        <p className="eyebrow mb-2">Help & Support</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Report a problem</h1>
        <p className="mt-2 text-muted-foreground">
          Tell our team what went wrong, or what you would like. A real person reads every message. Looking for
          quick answers first? Try the <Link href="/help">Help center</Link>.
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

      <Card>
        <CardHeader>
          <CardTitle>Your message</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={sendSupportMessage} className="flex flex-col gap-5">
            <fieldset className="flex flex-col gap-2">
              <legend className="label mb-1">What is it about?</legend>
              {KINDS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 rounded-xl border border-field-line p-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-navy-soft"
                >
                  <input type="radio" name="kind" value={option.value} defaultChecked={option.value === kind} className="mt-0.5" />
                  <span>
                    <span className="block font-bold">{option.label}</span>
                    <span className="block text-muted-foreground">{option.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="message">What happened?</Label>
              <Textarea
                id="message"
                name="message"
                required
                minLength={10}
                maxLength={1000}
                placeholder="Please tell us what you did, and what you expected to happen."
              />
              <p className="hint">At least 10 characters. Please do not include your password.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="page">Which page? (optional)</Label>
              <Input id="page" name="page" maxLength={200} placeholder="e.g. The Add a room page" />
            </div>
            <Button type="submit" className="w-fit">
              Send to our team
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
