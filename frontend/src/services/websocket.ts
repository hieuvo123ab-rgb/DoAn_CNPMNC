import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { NotificationItem } from '../api/notificationApi';

type NotificationListener = (notification: NotificationItem) => void;

class WebSocketService {
  private client: Client | null = null;
  private listeners: Set<NotificationListener> = new Set();
  private seenNotificationIds: Set<number> = new Set();
  private isConnecting: boolean = false;
  private currentUsername: string | null = null;

  public connect(username?: string, role?: string): void {
    const token = localStorage.getItem('edms_token');
    if (!token) {
      console.warn('[WebSocket] No JWT token found in localStorage, skipping connection.');
      return;
    }

    if (this.client && this.client.active) {
      if (this.currentUsername === username) {
        return; // Already connected for this user
      }
      this.disconnect();
    }

    if (this.isConnecting) return;
    this.isConnecting = true;
    this.currentUsername = username || null;

    // Use SockJS transport fallback (WebSocket -> xhr-streaming -> xhr-polling)
    const socketFactory = () => {
      // In browser, SockJS connects via relative path '/ws-edms' or origin + '/ws-edms'
      return new SockJS('/ws-edms');
    };

    this.client = new Client({
      webSocketFactory: socketFactory,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => {
        if ((import.meta as any).env?.DEV) {
          console.debug('[STOMP]', str);
        }
      },
      onConnect: () => {
        this.isConnecting = false;

        // 1. Subscribe to User Private Notification Queue
        this.client?.subscribe('/user/queue/notifications', (message: IMessage) => {
          this.handleIncomingMessage(message);
        });

        // 2. Subscribe to Admin Topic if user possesses ROLE_ADMIN
        if (role === 'ROLE_ADMIN') {
          this.client?.subscribe('/topic/admin/notifications', (message: IMessage) => {
            this.handleIncomingMessage(message);
          });
        }

        // Notify app that real-time push channel is connected
        window.dispatchEvent(new CustomEvent('websocket-status', { detail: { connected: true } }));
      },
      onStompError: (frame) => {
        this.isConnecting = false;
        console.error('[WebSocket] STOMP Protocol error:', frame.headers['message'], frame.body);
        window.dispatchEvent(new CustomEvent('websocket-status', { detail: { connected: false, error: frame.headers['message'] } }));
      },
      onWebSocketClose: (event) => {
        this.isConnecting = false;
        console.warn('[WebSocket] Transport closed:', event);
        window.dispatchEvent(new CustomEvent('websocket-status', { detail: { connected: false } }));
      },
    });

    try {
      this.client.activate();
    } catch (err) {
      this.isConnecting = false;
      console.error('[WebSocket] Failed to activate STOMP client:', err);
    }
  }

  private handleIncomingMessage(message: IMessage): void {
    try {
      const notification: NotificationItem = JSON.parse(message.body);

      // Deduplication check: prevent multiple toast/state updates if received via multiple subscriptions
      if (notification.id && this.seenNotificationIds.has(notification.id)) {
        console.debug(`[WebSocket] Ignored duplicate notification #${notification.id}`);
        return;
      }

      if (notification.id) {
        this.seenNotificationIds.add(notification.id);
        // Keep memory bounded to last 500 IDs
        if (this.seenNotificationIds.size > 500) {
          const first = this.seenNotificationIds.values().next().value;
          if (first !== undefined) {
            this.seenNotificationIds.delete(first);
          }
        }
      }


      // Dispatch browser custom event for reactive UI components
      window.dispatchEvent(new CustomEvent('notification-received', { detail: notification }));
      window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { notification, source: 'websocket' } }));

      // Notify registered local listeners
      this.listeners.forEach((listener) => {
        try {
          listener(notification);
        } catch (listenerErr) {
          console.error('[WebSocket] Error in notification listener:', listenerErr);
        }
      });
    } catch (err) {
      console.error('[WebSocket] Error parsing notification payload:', err, message.body);
    }
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public disconnect(): void {
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (err) {
        console.warn('[WebSocket] Error during STOMP client deactivation:', err);
      }
      this.client = null;
    }
    this.isConnecting = false;
    this.currentUsername = null;
    // Do not reuse de-duplication state after switching accounts.
    this.seenNotificationIds.clear();
    window.dispatchEvent(new CustomEvent('websocket-status', { detail: { connected: false } }));
  }

  public isConnected(): boolean {
    return !!(this.client && this.client.connected);
  }
}

export const webSocketService = new WebSocketService();
