import { useCallback, useEffect, useId, useState } from "react";
import { StreamChat } from "stream-chat";
import {
  Channel,
  Chat,
  MessageComposer,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";

const STORAGE_KEY = "dba_stream_chat_uid";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return `anon_${Date.now()}`;
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = `site_${crypto.randomUUID?.() ?? String(Date.now())}`;
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `site_${Date.now()}`;
  }
}

export function StreamChatWidget() {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<StreamChat | null>(null);
  const [ready, setReady] = useState(false);

  const connect = useCallback(async () => {
    setError(null);
    const userId = getOrCreateVisitorId();
    const res = await fetch("/api/stream-chat-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        userName: "Website visitor",
      }),
    });
    const data = (await res.json()) as {
      token?: string;
      apiKey?: string;
      userId?: string;
      inboxUserId?: string;
      error?: string;
    };
    if (!res.ok || !data.token || !data.apiKey || !data.userId || !data.inboxUserId) {
      setError(data.error ?? "Chat is unavailable.");
      return;
    }

    const chatClient = StreamChat.getInstance(data.apiKey);
    await chatClient.connectUser({ id: data.userId }, data.token);

    const channel = chatClient.channel("messaging", {
      members: [data.userId, data.inboxUserId].sort(),
    });
    await channel.watch();

    setClient(chatClient);
    setReady(true);
  }, []);

  useEffect(() => {
    return () => {
      void client?.disconnectUser().catch(() => undefined);
    };
  }, [client]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !ready && !error) void connect();
  };

  return (
    <div className="stream-chat-widget" data-stream-chat-widget>
      {open && (
        <div
          className="stream-chat-widget__panel"
          id={panelId}
          role="dialog"
          aria-label="Live chat"
        >
          {!ready && !error && (
            <p className="stream-chat-widget__status">Connecting…</p>
          )}
          {error && <p className="stream-chat-widget__error">{error}</p>}
          {ready && client && (
            <Chat client={client} theme="str-chat__theme-dark">
              <Channel>
                <Window>
                  <MessageList />
                  <MessageComposer focus />
                </Window>
                <Thread />
              </Channel>
            </Chat>
          )}
        </div>
      )}
      <button
        type="button"
        className="stream-chat-widget__toggle"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
      >
        {open ? "Close chat" : "Chat"}
      </button>
    </div>
  );
}
