import Link from "next/link";
import { redirect } from "next/navigation";
import { updatePassword } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth";
import { errorText } from "@/lib/messages";

// Step 2: choose a new password. Only reachable from the one-time link in the
// email, which logs the person in (see src/app/auth/callback/route.ts). Anyone
// else is sent to ask for a link.

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = errorText((await searchParams).error);

  const { user } = await getCurrentUser();
  if (!user) redirect("/forgot-password?error=reset_link_invalid");

  return (
    <AuthShell
      headline="Choose a new password."
      blurb="Pick something you do not use anywhere else. After you save it, your other devices are logged out."
      points={["At least 8 characters", "With a letter and a number", "Not used on another website"]}
    >
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">New password</h1>
      <p className="mb-7 mt-2 text-[0.9375rem] text-muted-foreground">
        Changed your mind?{" "}
        <Link href="/" className="font-bold text-ink underline decoration-amber decoration-2 underline-offset-4">
          Back to rooms
        </Link>
      </p>
      <form action={updatePassword} className="grid gap-[1.125rem]">
        {error && (
          <p role="alert" className="alert-error">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />
          <p className="hint">At least 8 characters, with a letter and a number.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Type it again</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
        </div>
        <Button type="submit" className="w-full">
          Save new password
        </Button>
      </form>
    </AuthShell>
  );
}
