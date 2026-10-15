import Link from "next/link";
import { redirect } from "next/navigation";
import { postRoom } from "@/app/owner/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getUserAndRole } from "@/lib/auth";
import { errorText } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

export default async function NewRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // The address carries only a short code; the text comes from our own list.
  const error = errorText((await searchParams).error);

  const supabase = await createClient();
  const { user, role } = await getUserAndRole(supabase);
  if (!user) redirect("/login");
  // Students cannot post rooms (the database refuses too).
  if (role === "student") redirect("/saved");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
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
              <p role="alert" className="rounded-[var(--radius)] border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Describe the room</Label>
              <Textarea
                id="description"
                name="description"
                required
                minLength={10}
                maxLength={500}
                placeholder="e.g. Bed space in a room for 4, includes water, 5 minutes walk from the gate"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price_per_month">Price per month (₱)</Label>
                <Input id="price_per_month" name="price_per_month" type="number" inputMode="numeric" min="1" step="1" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="distance_km">Distance from PHINMA UI (km)</Label>
                <Input id="distance_km" name="distance_km" type="number" inputMode="decimal" min="0" step="0.1" placeholder="e.g. 0.8" required />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact_phone">Contact phone (shown to students)</Label>
              <Input id="contact_phone" name="contact_phone" type="tel" autoComplete="tel" placeholder="e.g. 0917 123 4567" required />
            </div>

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
                  className="flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-sm"
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
