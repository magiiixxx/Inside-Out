"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UNREAD_EVENT } from "@/app/messages/[id]/chat-thread";
import { createClient } from "@/lib/supabase/client";

// The "Messages" link in the header, with a number when chats have a message
// you have not read. This is the notification: the page gives the first number,
// then it updates itself when the database pushes a change (Supabase Realtime),
// when you open a chat, when you come back to the tab, and every 30 seconds.

export function MessagesLink({ initial, className }: { initial: number; className: string }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const supabase = createClient();
    let alive = true;

    const refresh = async () => {
      const { data, error } = await supabase.rpc("unread_message_count");
      if (alive && !error && typeof data === "number") setCount(data);
    };

    const channel = supabase
      .channel("unread-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => void refresh())
      .subscribe();

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener(UNREAD_EVENT, refresh);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(refresh, 30000);

    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener(UNREAD_EVENT, refresh);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Link href="/messages" className={`${className} inline-flex items-center gap-2`}>
      Messages
      {count > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber px-1.5 text-xs font-extrabold leading-5 text-on-amber">
          {count > 9 ? "9+" : count}
          <span className="sr-only"> unread</span>
        </span>
      )}
    </Link>
  );
}
