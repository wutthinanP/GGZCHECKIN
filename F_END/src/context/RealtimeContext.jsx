import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const [lastEvent, setLastEvent] = useState(null);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    let eventSource = null;
    let reconnectTimeout = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          // Connected
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
          // Reconnect after 3s
          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectSSE, 3000);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ lastEvent, eventCount }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
