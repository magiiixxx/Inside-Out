import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

// The owner's home page. Ticket 05 adds the "Add a room" form and the
// list of the owner's rooms.

export default async function OwnerHome() {
  const supabase = await createClient();

  // The real login check. getUser() asks Supabase to verify the session,
  // so it cannot be faked with a fake cookie. (The proxy only refreshes
  // sessions; it is not the lock.)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Row Level Security means this query can only ever return our own row.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.full_name || user.email;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Owner home</span>
          <h1 className="text-2xl font-semibold tracking-tight">Hello, {name}</h1>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Your rooms</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You have no rooms yet. Soon you will be able to post a room here.
        </CardContent>
      </Card>

      <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
        See what students see →
      </Link>
    </main>
  );
}
