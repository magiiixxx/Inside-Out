import Link from "next/link";
import { redirect } from "next/navigation";
import { postRoom } from "@/app/owner/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoomDetailsFields } from "@/components/room-details-fields";
import { getUserAndRole } from "@/lib/auth";
import { errorText } from "@/lib/messages";
import { isAtRoomLimit } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export default async function NewRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // The address carries only a short code; the text comes from our own list.
  const error = errorText((await searchParams).error);

  const supabase = await createClient();
  const { user, role, plan } = await getUserAndRole(supabase);
  if (!user) redirect("/login");
  // Students cannot post rooms (the database refuses too).
  if (role === "student") redirect("/saved");

  // A Free owner who already has a room is sent back with an explanation.
  // (The database enforces the limit too.)
  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);
  if (isAtRoomLimit(role, plan, count ?? 0)) redirect("/owner?error=plan_limit");

  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <Link href="/owner" className="text-sm text-muted-foreground underline underline-offset-4">
        ← Back to owner home
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Add a room</CardTitle>
          <p className="text-sm text-muted-foreground">
            Our team checks every room before students can see it.
          </p>
        </CardHeader>
        <CardContent>
          <form action={postRoom} className="flex flex-col gap-5">
            {error && (
              <p role="alert" className="alert-error">
                {error}
              </p>
            )}

            <RoomDetailsFields />

            <fieldset className="flex flex-col gap-4 rounded-[var(--radius)] border border-border p-4">
              <legend className="px-1 text-sm font-medium">
                For our team only. Students never see this.
              </legend>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="permit_number">Business permit number</Label>
                <Input id="permit_number" name="permit_number" maxLength={60} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="owner_or_caretaker">Are you the owner or a caretaker?</Label>
                <select
                  id="owner_or_caretaker"
                  name="owner_or_caretaker"
                  required
                  defaultValue=""
                  className="field mt-0"
                >
                  <option value="" disabled>
                    Choose one
                  </option>
                  <option value="owner">Owner</option>
                  <option value="caretaker">Caretaker</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="open_beds">How many beds are open right now?</Label>
                <Input id="open_beds" name="open_beds" type="number" inputMode="numeric" min="0" step="1" required />
              </div>

              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="can_call" required className="mt-0.5 h-4 w-4" />
                <span>Our team may call this number to confirm the room.</span>
              </label>
            </fieldset>

            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="phone_public" required className="mt-0.5 h-4 w-4" />
              <span>I understand my phone number will be public.</span>
            </label>

            <Button type="submit" size="lg">
              Submit for approval
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
