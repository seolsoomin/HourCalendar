import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi } from '../api/client';
import { connectRoomTopic } from '../utils/stomp';

export const POLL_MS = 5000;
const RETRY_MIN_MS = 2000;
const RETRY_MAX_MS = 30000;
const EVENT_TYPES = new Set(['SYSTEM', 'INVITE']);

function merge(prev, incoming) {
  if (incoming.length === 0) return prev;
  const byId = new Map(prev.map((m) => [m.id, m]));
  incoming.forEach((m) => byId.set(m.id, m));
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

export default function useRoomChat(roomId, { onRoomEvent, onError, connect = connectRoomTopic } = {}) {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [live, setLive] = useState(false);

  const messagesRef = useRef([]);
  const fetchingRef = useRef(false);
  const fetchAgainRef = useRef(false);
  const errorShownRef = useRef(false);
  const callbacksRef = useRef({ onRoomEvent, onError });

  useEffect(() => {
    callbacksRef.current = { onRoomEvent, onError };
  });

  const apply = useCallback((incoming) => {
    const next = merge(messagesRef.current, incoming);
    messagesRef.current = next;
    setMessages(next);
  }, []);

  const fetchNewer = useCallback(async () => {
    if (fetchingRef.current) {
      fetchAgainRef.current = true;
      return;
    }
    fetchingRef.current = true;
    try {
      do {
        fetchAgainRef.current = false;
        const list = messagesRef.current;
        if (list.length === 0) {
          const page = await chatApi.list(roomId);
          apply(page.messages);
          setHasMore(page.hasMore);
          setLoaded(true);
        } else {
          let more = true;
          while (more) {
            const lastId = messagesRef.current[messagesRef.current.length - 1].id;
            const page = await chatApi.list(roomId, { after: lastId });
            apply(page.messages);
            more = page.hasMore && page.messages.length > 0;
            if (page.messages.some((m) => EVENT_TYPES.has(m.type))) {
              callbacksRef.current.onRoomEvent?.();
            }
          }
        }
      } while (fetchAgainRef.current);
      errorShownRef.current = false;
    } catch (err) {
      const firstFailure = messagesRef.current.length === 0 && !errorShownRef.current;
      if (err.status === 401 || firstFailure) {
        errorShownRef.current = true;
        callbacksRef.current.onError?.(err);
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [roomId, apply]);

  useEffect(() => {
    messagesRef.current = [];
    setMessages([]);
    setHasMore(false);
    setLoaded(false);
    fetchNewer();
  }, [fetchNewer]);

  useEffect(() => {
    let disconnect = () => {};
    let retryTimer = null;
    let retryMs = RETRY_MIN_MS;
    let stopped = false;

    const open = () => {
      const close = connect(roomId, {
        onConnected: () => {
          retryMs = RETRY_MIN_MS;
          setLive(true);
          fetchNewer();
        },
        onMessage: () => fetchNewer(),
        onClosed: () => {
          setLive(false);
          if (stopped) return;
          retryTimer = setTimeout(open, retryMs);
          retryMs = Math.min(retryMs * 2, RETRY_MAX_MS);
        },
      });
      disconnect = typeof close === 'function' ? close : () => {};
    };

    open();
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      disconnect();
      setLive(false);
    };
  }, [roomId, connect, fetchNewer]);

  useEffect(() => {
    if (live) return undefined;
    const timer = setInterval(fetchNewer, POLL_MS);
    return () => clearInterval(timer);
  }, [live, fetchNewer]);

  const loadOlder = useCallback(async () => {
    const first = messagesRef.current[0];
    if (!first || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await chatApi.list(roomId, { before: first.id });
      apply(page.messages);
      setHasMore(page.hasMore);
    } catch (err) {
      callbacksRef.current.onError?.(err);
    } finally {
      setLoadingOlder(false);
    }
  }, [roomId, apply, loadingOlder]);

  const send = useCallback(
    async (content) => {
      const saved = await chatApi.send(roomId, content);
      apply([saved]);
      return saved;
    },
    [roomId, apply]
  );

  return { messages, hasMore, loaded, loadingOlder, live, loadOlder, send };
}
