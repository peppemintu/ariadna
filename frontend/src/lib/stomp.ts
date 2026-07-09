// STOMP over raw WebSocket (backend uses a plain /ws endpoint, no SockJS).
// One shared connection. Subscriptions are registered in a local registry and
// (re)bound on every (re)connect, so they survive drops and can be created
// before the socket is up. Connection status is exposed for a "live" indicator.

import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { getToken } from "@/lib/auth";
import type { BoardMessage, UUID } from "@/api/types";

function wsUrl(): string {
  const base = import.meta.env.VITE_WS_URL as string | undefined;
  if (base) return base;
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}/ws`; // Vite proxies /ws -> :8080 in dev
}

interface Entry {
  topic: string;
  onFrame: (frame: IMessage) => void;
  sub: StompSubscription | null;
}

const entries = new Set<Entry>();
let connected = false;
const statusListeners = new Set<(connected: boolean) => void>();

function emitStatus() {
  statusListeners.forEach((l) => l(connected));
}

function bind(entry: Entry) {
  if (client?.connected) entry.sub = client.subscribe(entry.topic, entry.onFrame);
}

let client: Client | null = null;

function getClient(): Client {
  if (client) return client;
  client = new Client({
    brokerURL: wsUrl(),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    // Auth travels in the STOMP CONNECT frame (browsers can't set headers on the
    // WebSocket handshake). Refreshed here so reconnects use the current token.
    // NOTE: the backend must permit the /ws handshake and read this header at the
    // STOMP layer — see the interceptor in the chat notes.
    beforeConnect: () => {
      const token = getToken();
      client!.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    },
    onConnect: () => {
      connected = true;
      emitStatus();
      entries.forEach(bind); // (re)bind all subscriptions
    },
    onWebSocketClose: () => {
      connected = false;
      emitStatus();
      entries.forEach((e) => (e.sub = null)); // old subs are dead; rebind on reconnect
    },
  });
  client.activate();
  return client;
}

/**
 * Subscribe to a board's live feed. Returns an unsubscribe fn. Safe to call
 * before the socket connects — it binds on connect and rebinds after drops.
 */
export function subscribeBoard(
  boardId: UUID,
  onMessage: (msg: BoardMessage) => void,
): () => void {
  getClient();
  const entry: Entry = {
    topic: `/topic/board/${boardId}`,
    onFrame: (frame) => {
      try {
        onMessage(JSON.parse(frame.body) as BoardMessage);
      } catch {
        /* ignore malformed frames */
      }
    },
    sub: null,
  };
  entries.add(entry);
  bind(entry); // bind immediately if already connected

  return () => {
    entry.sub?.unsubscribe();
    entries.delete(entry);
  };
}

/** Observe connection status. Fires immediately with the current value. */
export function subscribeConnection(cb: (connected: boolean) => void): () => void {
  statusListeners.add(cb);
  cb(connected);
  return () => {
    statusListeners.delete(cb);
  };
}
