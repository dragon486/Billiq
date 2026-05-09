"use client";

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * A robust hook for subscribing to Server-Sent Events (SSE).
 * Features automatic reconnection with exponential backoff and event type handling.
 */
export function useSSE({ url, onMessage, enabled = true }) {
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);
  const attemptsRef = useRef(0);

  // Use a ref for the message handler to avoid triggering reconnections on every render
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!enabled) return;
    
    if (esRef.current) {
      esRef.current.close();
    }

    try {
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
        attemptsRef.current = 0;
      };

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onMessageRef.current('message', data);
        } catch (err) {}
      };

      const eventTypes = ['connected', 'order:update', 'heartbeat', 'initial_state'];
      eventTypes.forEach(name => {
        es.addEventListener(name, (e) => {
          if (name === 'heartbeat') return;
          try {
            const data = JSON.parse(e.data);
            onMessageRef.current(name, data);
          } catch (err) {}
        });
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        const delay = Math.min(1000 * Math.pow(2, attemptsRef.current), 30000);
        attemptsRef.current++;
        setTimeout(connect, delay);
      };
    } catch (err) {}
  }, [url, enabled]);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) {
        esRef.current.close();
      }
    };
  }, [connect]);

  return { connected };
}
