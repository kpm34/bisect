/**
 * Webhook Store
 *
 * In-memory store for webhook configurations and pub/sub.
 * In production, this would use Redis or a database.
 */

// Webhook configuration store
interface WebhookConfig {
  secret?: string;
  bindings: string[];
  lastReceived?: number;
}

const webhookStore = new Map<string, WebhookConfig>();

// Pub/sub for broadcasting to connected clients
type WebhookCallback = (data: any) => void;
const subscribers = new Map<string, Set<WebhookCallback>>();

/**
 * Register a webhook (called when creating bindings)
 */
export function registerWebhook(webhookId: string, secret?: string) {
  webhookStore.set(webhookId, {
    secret,
    bindings: [],
  });
}

/**
 * Unregister a webhook
 */
export function unregisterWebhook(webhookId: string) {
  webhookStore.delete(webhookId);
  subscribers.delete(webhookId);
}

/**
 * Get webhook configuration
 */
export function getWebhookConfig(webhookId: string): WebhookConfig | undefined {
  return webhookStore.get(webhookId);
}

/**
 * Update webhook last received timestamp
 */
export function updateWebhookTimestamp(webhookId: string) {
  const config = webhookStore.get(webhookId);
  if (config) {
    config.lastReceived = Date.now();
  }
}

/**
 * Register a subscriber for webhook events
 */
export function subscribeToWebhook(webhookId: string, callback: WebhookCallback): () => void {
  if (!subscribers.has(webhookId)) {
    subscribers.set(webhookId, new Set());
  }
  subscribers.get(webhookId)!.add(callback);

  // Return unsubscribe function
  return () => {
    subscribers.get(webhookId)?.delete(callback);
  };
}

/**
 * Broadcast data to all subscribers of a webhook
 */
export function broadcastToSubscribers(webhookId: string, data: any): number {
  const subs = subscribers.get(webhookId);
  if (!subs || subs.size === 0) return 0;

  subs.forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error('Error in webhook subscriber:', error);
    }
  });

  return subs.size;
}

/**
 * Get subscriber count for a webhook
 */
export function getSubscriberCount(webhookId: string): number {
  return subscribers.get(webhookId)?.size ?? 0;
}
