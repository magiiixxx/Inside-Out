import Link from "next/link";
import { redirect } from "next/navigation";
import { adminLogin } from "@/app/admin/actions";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth";
import { errorText, noticeText } from "@/lib/messages";

// The team's own sign-in page. Same Supabase login as the rest of the site, but
// only a team account gets past it (see adminLogin in ../actions.ts). It offers
// no Google button and no sign-up link: team accounts are made by hand in the
// Supabase dashboard.

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  // The address carries only short codes; the text comes from our own list.
  const params = await searchParams;
  const error = errorText(params.error);
  const notice = noticeText(params.notice);

  // A team member who is already signed in goes straight to the team page.
  const { role } = await getCurrentUser();
  if (role === "admin") redirect("/admin");

  return (
    <AuthShell
      headline="Team sign in."
      blurb="This entrance is for BahayFind team members. It is where rooms are approved and reports are handled."
      points={["Team accounts only", "Protected by your password, and a code if two-step is on", "Students and owners use the main Log in page"]}
    >
      <p className="mb-2 inline-block rounded-md bg-amber px-[7px] py-[3px] text-[0.6875rem] font-bold tracking-wide text-on-amber">ADMIN</p>
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">Sign in to the team area</h1>
      <p className="mb-7 mt-2 text-[0.9375rem] text-muted-foreground">
        Not a team member?{" "}
        <Link href="/login" className="font-bold text-ink underline decoration-amber decoration-2 underline-offset-4">
          Go to the main Log in page
        </Link>
      </p>
      <form action={adminLogin} className="grid gap-[1.125rem]">
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
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-[0.8125rem] font-bold text-ink underline decoration-amber decoration-2 underline-offset-4">
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />
        </div>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
