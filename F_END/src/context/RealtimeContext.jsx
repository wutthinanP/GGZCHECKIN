import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const { user } = useAuth();
  const [lastEvent, setLastEvent] = useState(null);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    // Only connect to SSE if authenticated user is present
    if (!user) {
      setLastEvent(null);
      return;
    }

    let eventSource = null;
    let reconnectTimeout = null;

    const connectSSE = () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        // Securely pass token to protected SSE stream
        eventSource = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

        eventSource.onopen = () => {
          // Connected successfully
        };

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastEvent(data);
            setEventCount((c) => c + 1);
          } catch (err) {
            // ping or raw message
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          // Only attempt reconnect if user is still logged in
          if (localStorage.getItem('accessToken')) {
            reconnectTimeout = setTimeout(connectSSE, 3000);
          }
        };
      } catch (err) {
        if (localStorage.getItem('accessToken')) {
          reconnectTimeout = setTimeout(connectSSE, 3000);
        }
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [user]);

  return (
    <RealtimeContext.Provider value={{ lastEvent, eventCount }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
