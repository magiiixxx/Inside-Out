import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { chatTime } from "@/lib/chat";
import { createClient } from "@/lib/supabase/server";

// The inbox: every chat the logged-in student or owner is in, newest first.
// A chat with a message you have not read has a dot and bold text.
// The team (admins) has no chats and goes to its own page.

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages — BahayFind" };

type Row = {
  id: string;
  room_description: string;
  room_address: string | null;
  other_name: string;
  last_body: string | null;
  last_message_at: string;
  last_sender_is_me: boolean;
  unread: boolean;
};

export default async function Messages() {
  const { role } = await requireUser();
  if (role === "admin") redirect("/admin");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_conversations");
  if (error) console.error("Messages: could not load chats:", error.message);
  const chats = (data ?? []) as Row[];

  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-8 sm:py-12">
      <div>
        <p className="eyebrow mb-2">{role === "owner" ? "Students asking about your rooms" : "Owners you wrote to"}</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Messages</h1>
      </div>

      {error && (
        <p role="alert" className="alert-error">
          We could not load your messages. Please refresh and try again.
        </p>
      )}

      {chats.length === 0 && !error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {role === "owner"
              ? "No messages yet. When a student writes to you about a room, it shows up here and you get a notification."
              : "No messages yet. Open a room and press Message owner to ask a question."}
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {chats.map((chat) => (
            <li key={chat.id}>
              <Link
                href={`/messages/${chat.id}`}
                className="card lift flex items-start gap-3 p-4 hover:border-link"
              >
                <span
                  aria-hidden="true"
                  className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${chat.unread ? "bg-amber" : "bg-transparent"}`}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={`truncate ${chat.unread ? "font-extrabold" : "font-bold"}`}>
                      {chat.other_name}
                      {chat.unread && <span className="sr-only"> (new message)</span>}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{chatTime(chat.last_message_at)}</span>
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    About: {chat.room_address || chat.room_description}
                  </span>
                  <span className={`line-clamp-2 break-words text-sm ${chat.unread ? "font-semibold" : "text-muted-foreground"}`}>
                    {chat.last_sender_is_me ? "You: " : ""}
                    {chat.last_body}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
