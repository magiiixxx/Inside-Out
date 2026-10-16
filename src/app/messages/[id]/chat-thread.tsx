"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CHAT_MAX, chatErrorCode, chatTime } from "@/lib/chat";
import { errorText } from "@/lib/messages";
import { createClient } from "@/lib/supabase/client";

// The messages of one chat, with a box to reply.
//
// New messages from the other person arrive through Supabase Realtime (the
// database pushes them; Row Level Security decides who receives what), and a
// check every 15 seconds covers the case where the push connection drops.
// Our own message is added the moment the database accepts it.
//
// Message text is always shown as plain text, never as HTML.

export type ChatMessage = { id: string; sender_id: string; body: string; created_at: string };

// Tells the bell in the header to ask for the unread number again.
export const UNREAD_EVENT = "bf-unread-refresh";

export function ChatThread({
  conversationId,
  myId,
  initial,
}: {
  conversationId: string;
  myId: string;
  initial: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const add = useCallback((incoming: ChatMessage[]) => {
    setMessages((current) => {
      const known = new Set(current.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      if (fresh.length === 0) return current;
      return [...current, ...fresh].sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  }, []);

  const markRead = useCallback(async () => {
    await createClient().rpc("mark_conversation_read", { p_conversation_id: conversationId });
    window.dispatchEvent(new Event(UNREAD_EVENT));
  }, [conversationId]);

  useEffect(() => {
    const supabase = createClient();
    void markRead();

    const pull = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (data) {
        add(data as ChatMessage[]);
        if ((data as ChatMessage[]).some((m) => m.sender_id !== myId)) void markRead();
      }
    };

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const message = payload.new as ChatMessage;
          add([message]);
          if (message.sender_id !== myId) void markRead();
        },
      )
      .subscribe();

    const timer = window.setInterval(pull, 15000);
    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [conversationId, myId, add, markRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const { data, error: failure } = await createClient().rpc("send_message", {
      p_conversation_id: conversationId,
      p_body: body,
    });
    setSending(false);
    if (failure || !data) {
      setError(errorText(chatErrorCode(failure?.message ?? "")) ?? "We could not send your message.");
      return;
    }
    add([data as ChatMessage]);
    setText("");
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ol
        aria-live="polite"
        aria-label="Messages"
        className="card flex min-h-[18rem] flex-1 flex-col gap-3 p-4"
      >
        {messages.length === 0 && <li className="m-auto text-sm text-muted-foreground">No messages yet.</li>}
        {messages.map((message) => {
          const mine = message.sender_id === myId;
          return (
            <li key={message.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <p
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-relaxed ${
                  mine ? "bg-navy text-white" : "bg-surface"
                }`}
              >
                {message.body}
              </p>
              <span className="mt-1 text-xs text-muted-foreground">{chatTime(message.created_at)}</span>
            </li>
          );
        })}
        <div ref={endRef} />
      </ol>

      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}

      <form onSubmit={send} className="flex flex-col gap-2">
        <label htmlFor="reply" className="sr-only">
          Your reply
        </label>
        <Textarea
          id="reply"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          maxLength={CHAT_MAX}
          rows={2}
          placeholder="Write a reply. Enter sends, Shift+Enter adds a new line."
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {text.length}/{CHAT_MAX}
          </span>
          <Button type="submit" variant="accent" disabled={sending || text.trim().length === 0}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
