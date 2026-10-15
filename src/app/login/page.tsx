import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserAndRole, homeFor } from "@/lib/auth";
import { errorText, noticeText } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  // The address carries only short codes; the text comes from our own list.
  const params = await searchParams;
  const error = errorText(params.error);
  const notice = noticeText(params.notice);

  // Already logged in? Skip the form.
  const supabase = await createClient();
  const { user, role } = await getUserAndRole(supabase);
  if (user) redirect(homeFor(role));

  return (
    <AuthShell
      headline="Welcome back."
      blurb="Log in to save the rooms you like near PHINMA University of Iloilo, or to manage the rooms you post."
      points={["Rooms approved by our team", "Hidden if not updated in 7 days", "Call the owner directly"]}
    >
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">Log in</h1>
      <p className="mb-7 mt-2 text-[0.9375rem] text-muted-foreground">
        New to BahayFind?{" "}
        <Link href="/signup" className="font-bold text-ink underline decoration-amber decoration-2 underline-offset-4">
          Create an account
        </Link>
      </p>
      <form action={login} className="grid gap-[1.125rem]">
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}
