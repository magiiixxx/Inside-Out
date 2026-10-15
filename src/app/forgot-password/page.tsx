import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorText, noticeText } from "@/lib/messages";

// Step 1 of getting back into an account: ask for an email with a link.

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  // The address carries only short codes; the text comes from our own list.
  const params = await searchParams;
  const error = errorText(params.error);
  const notice = noticeText(params.notice);

  return (
    <AuthShell
      headline="Forgot your password?"
      blurb="Enter the email you signed up with and we will send you a link to choose a new one."
      points={["The link works only once", "We never email your password", "Your account stays as it is until you use the link"]}
    >
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">Reset your password</h1>
      <p className="mb-7 mt-2 text-[0.9375rem] text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-bold text-ink underline decoration-amber decoration-2 underline-offset-4">
          Log in
        </Link>
      </p>
      <form action={requestPasswordReset} className="grid gap-[1.125rem]">
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@email.com" required />
        </div>
        <Button type="submit" className="w-full">
          Send me a link
        </Button>
      </form>
    </AuthShell>
  );
}
