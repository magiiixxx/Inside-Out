import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/validation";
import { ChatThread, type ChatMessage } from "./chat-thread";

// One chat. The page loads the messages once; the ChatThread (in the browser)
// then shows new ones as they arrive. Row Level Security means a chat id that
// is not yours simply finds nothing, and the page says "not found".

export const dynamic = "force-dynamic";
export const metadata = { title: "Chat — BahayFind" };

export default async function Chat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, role } = await requireUser();
  if (role === "admin") redirect("/admin");
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: header } = await supabase.rpc("conversation_header", { p_conversation_id: id });
  const info = (header as { room_description: string; room_address: string | null; other_name: string }[] | null)?.[0];
  if (!info) notFound();

  const { data: rows } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(500);

  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6 sm:py-10">
      <Link href="/messages" className="text-sm font-semibold text-link underline underline-offset-4">
        ← All messages
      </Link>
      <header className="card flex flex-col gap-0.5 p-4">
        <h1 className="text-xl font-extrabold tracking-tight">{info.other_name}</h1>
        <p className="line-clamp-2 break-words text-sm text-muted-foreground">
          About: {info.room_address ? `${info.room_address} — ` : ""}
          {info.room_description}
        </p>
      </header>
      <ChatThread conversationId={id} myId={user.id} initial={(rows ?? []) as ChatMessage[]} />
    </main>
  );
}
