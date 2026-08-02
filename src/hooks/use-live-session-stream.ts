import { useEffect, useRef, useState } from "react";
import { getCookie } from "cookies-next";
import { BACKEND_URL } from "@/constants";
import { AuthActions } from "@/api-actions/auth-actions";
import { useAuthStore } from "@/store/auth-store";
import type {
  LivePriceTick,
  LiveSessionWsMessage,
  RawLiveEngineEvent,
  StrategyEvent,
} from "@/types/live-trading";

/**
 * Every live-pushed message is EngineEvent.to_dict()'s raw, unmerged shape —
 * no `id`, no `created_at` (those only exist on the DB row shape the REST
 * timeline / TIMELINE_SNAPSHOT hydration returns). Rendering one directly as
 * a StrategyEvent used to crash LiveEventTimeline's `format(new
 * Date(event.created_at), ...)` the instant a real live event arrived,
 * since `new Date(undefined)` is an Invalid Date. This reshapes it to match:
 * sequence_number becomes the id (unique per session, monotonic), timestamp
 * (the bar's own epoch-ms, always > 0 for a real event) becomes created_at,
 * and every base field lands in `payload` too — the same folding
 * EventPublisher._flush_locked() does on the persist side, so a session's
 * events look identical whether they arrived live or via REST scrollback.
 */
function normalizeLiveEvent(raw: RawLiveEngineEvent): StrategyEvent {
  const { type, payload, ...baseFields } = raw;
  return {
    id: String(raw.sequence_number),
    type,
    payload: { ...baseFields, ...payload },
    created_at: new Date(
      raw.timestamp > 0 ? raw.timestamp : Date.now()
    ).toISOString(),
  };
}

export type LiveStreamStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error"
  // Reconnect attempted with an expired access token and the refresh_token
  // cookie couldn't mint a new one either — needs a real re-login, further
  // silent retries would just loop forever hitting the same 4401.
  | "auth_expired"
  // Server closed with 4404 (session deleted, or the session belongs to a
  // different user) — also terminal, retrying can't ever succeed.
  | "not_found";

const RECONNECT_DELAY_MS = 3000;
// Holds the 1,000 warmup BAR_CLOSED events plus up to one INDICATOR_SNAPSHOT
// per warmup bar, with headroom for first live decisions/events.
const MAX_BUFFERED_EVENTS = 2500;

// live_session_ws (live_endpoints.py) closes with these on non-transient
// auth/ownership failures — see the close handler below for how each is
// handled differently from an ordinary network drop.
const WS_CLOSE_UNAUTHENTICATED = 4401;
const WS_CLOSE_NOT_FOUND = 4404;

function wsUrl(sessionId: string, token: string): string {
  const httpBase = BACKEND_URL ?? "";
  const wsBase = httpBase.replace(/^http/, "ws");
  return `${wsBase}/live-sessions/${sessionId}/ws?token=${encodeURIComponent(token)}`;
}

/**
 * Authenticated live event stream for one session (see live_endpoints.py's
 * live_session_ws). Browsers can't set headers on a WS handshake, so the
 * JWT travels as a `?token=` query param instead of the usual Bearer header.
 * On connect the server sends one TIMELINE_SNAPSHOT hydration message, then
 * every subsequent message is a single live StrategyEvent — both branches
 * fold into the same growing `events` array here.
 */
export function useLiveSessionStream(sessionId: string | null) {
  const [status, setStatus] = useState<LiveStreamStatus>("idle");
  const [events, setEvents] = useState<StrategyEvent[]>([]);
  // True once the server's initial TIMELINE_SNAPSHOT hydration has landed.
  // A PRICE_TICK can arrive before it, and consumers that build a display
  // candle straight from `livePrice` must not do so against a still-empty
  // `events` array — that's what produced a flash of "just one candle"
  // before real history replaced it.
  const [hasSnapshot, setHasSnapshot] = useState(false);
  // Broadcast-only, never-persisted forming-bar price (see PRICE_TICK on
  // the backend) — kept OUT of `events` deliberately, since that array
  // feeds BAR_CLOSED-derived candles/trades/trees and a partial bar folded
  // in there would render as a fake extra candle. Consumers that just want
  // a live-updating "current price" (e.g. ReplaySymbolPanel) read this
  // instead, independent of whether the strategy's timeframe has actually
  // closed a new bar yet.
  const [livePrice, setLivePrice] = useState<LivePriceTick | null>(null);
  const pendingLivePriceRef = useRef<LivePriceTick | null>(null);
  const livePriceFrameRef = useRef<number | null>(null);
  const lastLivePriceSourceTimestampRef = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByClientRef = useRef(false);

  // Reset the buffered events during render (not in the effect below) when
  // sessionId changes — the officially recommended way to adjust state in
  // response to a changed prop without an extra effect-driven render.
  const [eventsForSessionId, setEventsForSessionId] = useState(sessionId);
  if (sessionId !== eventsForSessionId) {
    setEventsForSessionId(sessionId);
    setEvents([]);
    setLivePrice(null);
    setHasSnapshot(false);
  }

  useEffect(() => {
    if (!sessionId) return;

    closedByClientRef.current = false;
    pendingLivePriceRef.current = null;
    lastLivePriceSourceTimestampRef.current = 0;

    const queueLivePrice = (priceTick: LivePriceTick) => {
      const sourceTimestamp = priceTick.source_timestamp ?? priceTick.timestamp;
      if (sourceTimestamp < lastLivePriceSourceTimestampRef.current) return;

      lastLivePriceSourceTimestampRef.current = sourceTimestamp;
      pendingLivePriceRef.current = priceTick;
      if (livePriceFrameRef.current != null) return;

      // Rendering every exchange trade can starve the browser. One frame keeps
      // the latest tick and drops only obsolete display states; closed bars and
      // strategy events continue through the lossless event path below.
      livePriceFrameRef.current = requestAnimationFrame(() => {
        livePriceFrameRef.current = null;
        const latest = pendingLivePriceRef.current;
        pendingLivePriceRef.current = null;
        if (latest) setLivePrice(latest);
      });
    };

    const connect = () => {
      const token = getCookie("token") as string | undefined;
      if (!token) {
        setStatus("error");
        return;
      }
      setStatus("connecting");
      const socket = new WebSocket(wsUrl(sessionId, token));
      socketRef.current = socket;

      socket.onopen = () => setStatus("open");

      socket.onmessage = (event) => {
        let message: LiveSessionWsMessage;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        if ("data" in message && message.type === "TIMELINE_SNAPSHOT") {
          setEvents(message.data.events.slice(-MAX_BUFFERED_EVENTS));
          setHasSnapshot(true);
        } else if (message.type === "PRICE_TICK") {
          queueLivePrice(message as LivePriceTick);
        } else {
          const normalized = normalizeLiveEvent(message as RawLiveEngineEvent);
          setEvents((prev) => [...prev, normalized].slice(-MAX_BUFFERED_EVENTS));
        }
      };

      socket.onclose = (closeEvent) => {
        setStatus("closed");
        if (closedByClientRef.current) return;

        if (closeEvent.code === WS_CLOSE_NOT_FOUND) {
          setStatus("not_found");
          return;
        }

        if (closeEvent.code === WS_CLOSE_UNAUTHENTICATED) {
          // Same silent-refresh flow the axios interceptor uses on a REST
          // 401: POST /auth/refresh off the refresh_token cookie, then
          // rewrite the readable `token` cookie so the next connect() picks
          // up the new access token instead of replaying the expired one.
          reconnectTimerRef.current = setTimeout(async () => {
            try {
              const refreshed = await AuthActions.RefreshTokenAction();
              useAuthStore.getState().setLogin(refreshed);
              if (!closedByClientRef.current) connect();
            } catch {
              if (!closedByClientRef.current) setStatus("auth_expired");
            }
          }, 0);
          return;
        }

        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      socket.onerror = () => setStatus("error");
    };

    connect();

    return () => {
      closedByClientRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (livePriceFrameRef.current != null) {
        cancelAnimationFrame(livePriceFrameRef.current);
        livePriceFrameRef.current = null;
      }
      pendingLivePriceRef.current = null;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [sessionId]);

  return { status: sessionId ? status : "idle", events, livePrice, hasSnapshot };
}
