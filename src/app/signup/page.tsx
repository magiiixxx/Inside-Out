import Link from "next/link";
import { redirect } from "next/navigation";
import { signup } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // Already logged in? Skip the form.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/owner");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
        ← Back to rooms
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Create an owner account</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={signup} className="flex flex-col gap-4">
            {error && (
              <p role="alert" className="rounded-[var(--radius)] border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full_name">Your name</Label>
              <Input id="full_name" name="full_name" autoComplete="name" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password (at least 6 characters)</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required />
            </div>
            <Button type="submit">Create account</Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
