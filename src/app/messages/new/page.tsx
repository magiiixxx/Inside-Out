import Link from "next/link";
import { redirect } from "next/navigation";
import { startChat } from "@/app/messages/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { CHAT_MAX } from "@/lib/chat";
import { hideCutoff } from "@/lib/listings";
import { errorText } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/validation";

// A student writes the first message to a room's owner. Opened from the
// "Message owner" button on a room (/messages/new?room=<id>). If the student
// already has a chat about this room, they go straight to it instead.

export const dynamic = "force-dynamic";
export const metadata = { title: "Message the owner — BahayFind" };

export default async function NewChat({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { role } = await requireUser();
  const error = errorText(params.error);

  if (role !== "student") {
    return (
      <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-10">
        <p className="alert-info">Only student accounts can start a chat. Owners can reply to the chats students start.</p>
        <Link href="/messages" className={buttonVariants({ variant: "outline" }) + " self-start"}>
          Go to my messages
        </Link>
      </main>
    );
  }

  const roomId = params.room ?? "";
  if (!UUID.test(roomId)) redirect("/");

  const supabase = await createClient();

  // Already chatting about this room? Go there.
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", roomId)
    .maybeSingle();
  if (existing?.id) redirect(`/messages/${existing.id}`);

  const { data: room } = await supabase
    .from("listings")
    .select("id, description, address, price_per_month")
    .eq("id", roomId)
    .eq("approval_status", "approved")
    .gt("last_updated_at", hideCutoff())
    .maybeSingle();

  if (!room) {
    return (
      <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-10">
        <p className="alert-error">That room is not available to message any more.</p>
        <Link href="/" className={buttonVariants({ variant: "outline" }) + " self-start"}>
          Find another room
        </Link>
      </main>
    );
  }

  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-8 sm:py-12">
      <div>
        <p className="eyebrow mb-2">Message the owner</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Ask about this room</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-1 pt-6 text-sm">
          <p className="line-clamp-3 break-words font-semibold">{room.description}</p>
          {room.address && <p className="break-words text-muted-foreground">{room.address}</p>}
          <p className="font-bold">₱{Number(room.price_per_month).toLocaleString()} / month</p>
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}

      <form action={startChat} className="flex flex-col gap-3">
        <input type="hidden" name="listing_id" value={room.id} />
        <label htmlFor="body" className="label">
          Your message
        </label>
        <Textarea
          id="body"
          name="body"
          required
          maxLength={CHAT_MAX}
          rows={4}
          placeholder="Hello! Is this room still available? Can I visit this weekend?"
        />
        <p className="text-sm text-muted-foreground">
          The owner gets a notification and can reply here. Please do not share passwords or payment details in chat.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="accent">
            Send message
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
