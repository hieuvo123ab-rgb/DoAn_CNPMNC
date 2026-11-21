import { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';

/** Reflect the actual STOMP connection instead of assuming it is always online. */
export function useWebSocketStatus(): boolean {
  const [connected, setConnected] = useState(() => webSocketService.isConnected());

  useEffect(() => {
    const syncConnection = () => setConnected(webSocketService.isConnected());
    window.addEventListener('websocket-status', syncConnection);
    syncConnection();
    return () => window.removeEventListener('websocket-status', syncConnection);
  }, []);

  return connected;
}
