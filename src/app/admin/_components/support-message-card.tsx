import { closeSupportMessage } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { OwnerNames, SupportMessage } from "./types";

// A message a user sent from Report a Problem. The team reads it, replies
// outside the app if needed, then marks it handled.

const KIND_LABELS = {
  bug: { label: "Something is broken", chip: "chip chip-alert" },
  feedback: { label: "Idea or feedback", chip: "chip chip-navy" },
  question: { label: "Question", chip: "chip chip-amber" },
} as const;

export function SupportMessageCard({ message, people }: { message: SupportMessage; people: OwnerNames }) {
  const kind = KIND_LABELS[message.kind];
  return (
    <Card className="max-w-3xl">
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={kind.chip}>{kind.label}</span>
          <span className="text-sm text-muted-foreground">
            {people.get(message.user_id) || "(no name)"} · {new Date(message.created_at).toLocaleDateString("en-PH")}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words text-[0.9375rem]">{message.message}</p>
        {message.page && (
          <p className="text-sm text-muted-foreground">
            About: <span className="font-semibold text-foreground">{message.page}</span>
          </p>
        )}
        <form action={closeSupportMessage}>
          <input type="hidden" name="message_id" value={message.id} />
          <Button type="submit" variant="outline">
            Mark as handled
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
