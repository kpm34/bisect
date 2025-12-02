/**
 * useVariableBindings Hook
 *
 * Manages data bindings between scene variables and external sources:
 * - API polling (GET requests at intervals)
 * - Webhooks (incoming POST requests)
 * - WebSocket connections (real-time updates)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { SceneVariable } from '../r3f/SceneSelectionContext';
import { coerceValue } from '../utils/variable-runtime';

// ============== DATA BINDING TYPES ==============

export type BindingSource = 'api' | 'webhook' | 'websocket';

export interface DataBinding {
  id: string;
  variableId: string;
  source: BindingSource;
  enabled: boolean;

  // API polling configuration
  apiConfig?: {
    url: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: string;  // JSON string for POST
    jsonPath: string;  // e.g., "data.temperature" or "result[0].value"
    refreshInterval: number;  // ms, 0 = manual only
  };

  // Webhook configuration
  webhookConfig?: {
    webhookId: string;
    jsonPath: string;
    transform?: string;  // JavaScript expression for transformation
  };

  // WebSocket configuration
  websocketConfig?: {
    url: string;
    jsonPath: string;
    reconnectInterval: number;  // ms
  };

  // Metadata
  lastUpdated?: number;
  lastValue?: any;
  error?: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret?: string;
  createdAt: number;
  bindings: string[];  // Binding IDs that use this webhook
}

// ============== HOOK OPTIONS ==============

interface UseVariableBindingsOptions {
  variables: SceneVariable[];
  bindings: DataBinding[];
  onVariableUpdate: (variableId: string, value: boolean | number | string) => void;
  onBindingUpdate?: (bindingId: string, updates: Partial<DataBinding>) => void;
}

// ============== UTILITY FUNCTIONS ==============

/**
 * Extract value from JSON using a path string
 * Supports: "data.value", "result[0].name", "items[0].nested.prop"
 */
function extractJsonPath(data: any, path: string): any {
  if (!path || !data) return data;

  const parts = path.split(/\.|\[|\]/).filter(Boolean);
  let current = data;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;

    // Handle array indices
    const index = parseInt(part, 10);
    if (!isNaN(index)) {
      current = Array.isArray(current) ? current[index] : undefined;
    } else {
      current = current[part];
    }
  }

  return current;
}

/**
 * Generate a unique webhook URL
 */
function generateWebhookUrl(webhookId: string): string {
  // In production, this would use the actual API URL
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000';
  return `${baseUrl}/api/webhooks/scene/${webhookId}`;
}

/**
 * Generate a secure webhook secret
 */
function generateWebhookSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============== MAIN HOOK ==============

export function useVariableBindings({
  variables,
  bindings,
  onVariableUpdate,
  onBindingUpdate,
}: UseVariableBindingsOptions) {
  // Track polling intervals
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Track WebSocket connections
  const websocketsRef = useRef<Map<string, WebSocket>>(new Map());

  // Webhook endpoints
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);

  /**
   * Fetch data from an API endpoint
   */
  const fetchApiData = useCallback(async (binding: DataBinding) => {
    if (!binding.apiConfig || !binding.enabled) return;

    const { url, method, headers, body, jsonPath } = binding.apiConfig;
    const variable = variables.find(v => v.id === binding.variableId);

    if (!variable) return;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: method === 'POST' ? body : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const extractedValue = extractJsonPath(data, jsonPath);

      if (extractedValue !== undefined) {
        const coercedValue = coerceValue(extractedValue, variable.type);
        onVariableUpdate(binding.variableId, coercedValue);

        onBindingUpdate?.(binding.id, {
          lastUpdated: Date.now(),
          lastValue: extractedValue,
          error: undefined,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`API binding error for ${variable.name}:`, errorMessage);

      onBindingUpdate?.(binding.id, {
        error: errorMessage,
      });
    }
  }, [variables, onVariableUpdate, onBindingUpdate]);

  /**
   * Start polling for an API binding
   */
  const startPolling = useCallback((binding: DataBinding) => {
    if (!binding.apiConfig?.refreshInterval || binding.apiConfig.refreshInterval <= 0) return;

    // Clear existing interval if any
    const existingInterval = pollingIntervalsRef.current.get(binding.id);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Fetch immediately
    fetchApiData(binding);

    // Set up interval
    const intervalId = setInterval(() => {
      fetchApiData(binding);
    }, binding.apiConfig.refreshInterval);

    pollingIntervalsRef.current.set(binding.id, intervalId);
  }, [fetchApiData]);

  /**
   * Stop polling for a binding
   */
  const stopPolling = useCallback((bindingId: string) => {
    const intervalId = pollingIntervalsRef.current.get(bindingId);
    if (intervalId) {
      clearInterval(intervalId);
      pollingIntervalsRef.current.delete(bindingId);
    }
  }, []);

  /**
   * Connect to a WebSocket
   */
  const connectWebSocket = useCallback((binding: DataBinding) => {
    if (!binding.websocketConfig || !binding.enabled) return;

    const { url, jsonPath, reconnectInterval } = binding.websocketConfig;
    const variable = variables.find(v => v.id === binding.variableId);

    if (!variable) return;

    // Close existing connection if any
    const existingWs = websocketsRef.current.get(binding.id);
    if (existingWs) {
      existingWs.close();
    }

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(`WebSocket connected for ${variable.name}`);
        onBindingUpdate?.(binding.id, { error: undefined });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const extractedValue = extractJsonPath(data, jsonPath);

          if (extractedValue !== undefined) {
            const coercedValue = coerceValue(extractedValue, variable.type);
            onVariableUpdate(binding.variableId, coercedValue);

            onBindingUpdate?.(binding.id, {
              lastUpdated: Date.now(),
              lastValue: extractedValue,
            });
          }
        } catch {
          // Ignore parse errors for non-JSON messages
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${variable.name}:`, error);
        onBindingUpdate?.(binding.id, { error: 'WebSocket error' });
      };

      ws.onclose = () => {
        // Attempt reconnection after interval
        if (binding.enabled && reconnectInterval > 0) {
          setTimeout(() => {
            connectWebSocket(binding);
          }, reconnectInterval);
        }
      };

      websocketsRef.current.set(binding.id, ws);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      onBindingUpdate?.(binding.id, { error: errorMessage });
    }
  }, [variables, onVariableUpdate, onBindingUpdate]);

  /**
   * Disconnect a WebSocket
   */
  const disconnectWebSocket = useCallback((bindingId: string) => {
    const ws = websocketsRef.current.get(bindingId);
    if (ws) {
      ws.close();
      websocketsRef.current.delete(bindingId);
    }
  }, []);

  /**
   * Create a new webhook endpoint
   */
  const createWebhook = useCallback((name: string): WebhookEndpoint => {
    const id = crypto.randomUUID();
    const webhook: WebhookEndpoint = {
      id,
      name,
      url: generateWebhookUrl(id),
      secret: generateWebhookSecret(),
      createdAt: Date.now(),
      bindings: [],
    };

    setWebhooks(prev => [...prev, webhook]);
    return webhook;
  }, []);

  /**
   * Delete a webhook endpoint
   */
  const deleteWebhook = useCallback((webhookId: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== webhookId));
  }, []);

  /**
   * Process incoming webhook data
   * This would be called from the API route handler
   */
  const processWebhookData = useCallback((webhookId: string, data: any) => {
    const relevantBindings = bindings.filter(
      b => b.source === 'webhook' &&
           b.webhookConfig?.webhookId === webhookId &&
           b.enabled
    );

    for (const binding of relevantBindings) {
      const variable = variables.find(v => v.id === binding.variableId);
      if (!variable || !binding.webhookConfig) continue;

      const extractedValue = extractJsonPath(data, binding.webhookConfig.jsonPath);

      if (extractedValue !== undefined) {
        const coercedValue = coerceValue(extractedValue, variable.type);
        onVariableUpdate(binding.variableId, coercedValue);

        onBindingUpdate?.(binding.id, {
          lastUpdated: Date.now(),
          lastValue: extractedValue,
        });
      }
    }
  }, [bindings, variables, onVariableUpdate, onBindingUpdate]);

  /**
   * Manual refresh for a binding
   */
  const refreshBinding = useCallback((bindingId: string) => {
    const binding = bindings.find(b => b.id === bindingId);
    if (!binding) return;

    if (binding.source === 'api') {
      fetchApiData(binding);
    }
    // WebSocket bindings auto-refresh on messages
  }, [bindings, fetchApiData]);

  // Manage bindings lifecycle
  useEffect(() => {
    // Start/stop polling and WebSocket connections based on binding state
    for (const binding of bindings) {
      if (binding.enabled) {
        if (binding.source === 'api' && binding.apiConfig?.refreshInterval) {
          startPolling(binding);
        } else if (binding.source === 'websocket') {
          connectWebSocket(binding);
        }
      } else {
        if (binding.source === 'api') {
          stopPolling(binding.id);
        } else if (binding.source === 'websocket') {
          disconnectWebSocket(binding.id);
        }
      }
    }

    // Cleanup on unmount
    return () => {
      pollingIntervalsRef.current.forEach((intervalId) => clearInterval(intervalId));
      pollingIntervalsRef.current.clear();
      websocketsRef.current.forEach((ws) => ws.close());
      websocketsRef.current.clear();
    };
  }, [bindings, startPolling, stopPolling, connectWebSocket, disconnectWebSocket]);

  return {
    // Webhook management
    webhooks,
    createWebhook,
    deleteWebhook,
    processWebhookData,

    // Binding operations
    refreshBinding,
    fetchApiData,

    // Manual controls
    startPolling,
    stopPolling,
    connectWebSocket,
    disconnectWebSocket,
  };
}

// ============== DEFAULT EXPORT ==============

export default useVariableBindings;
