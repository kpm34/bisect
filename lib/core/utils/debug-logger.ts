/**
 * Debug Logger - Simple Console Wrapper
 *
 * Centralized logging utility for the Spline AI Extension.
 * Provides consistent log formatting and level-based filtering.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  prefix?: string;
  enabled?: boolean;
}

/**
 * Simple logger that wraps console methods with prefixing
 */
class DebugLogger {
  private prefix: string;
  private enabled: boolean;

  constructor(config: LoggerConfig = {}) {
    this.prefix = config.prefix || '[Spline AI]';
    this.enabled = config.enabled !== false;
  }

  /**
   * Format message with prefix and timestamp
   */
  private format(level: LogLevel, ...args: any[]): any[] {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    return [`${this.prefix} [${level.toUpperCase()}] [${timestamp}]`, ...args];
  }

  /**
   * Debug level logging (lowest priority)
   */
  debug(...args: any[]): void {
    if (!this.enabled) return;
    console.debug(...this.format('debug', ...args));
  }

  /**
   * Info level logging
   */
  info(...args: any[]): void {
    if (!this.enabled) return;
    console.info(...this.format('info', ...args));
  }

  /**
   * Warning level logging
   */
  warn(...args: any[]): void {
    if (!this.enabled) return;
    console.warn(...this.format('warn', ...args));
  }

  /**
   * Error level logging (highest priority)
   */
  error(...args: any[]): void {
    if (!this.enabled) return;
    console.error(...this.format('error', ...args));
  }

  /**
   * Create a child logger with additional prefix
   */
  child(subPrefix: string): DebugLogger {
    return new DebugLogger({
      prefix: `${this.prefix}:${subPrefix}`,
      enabled: this.enabled,
    });
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Export singleton instance for global use
export const logger = new DebugLogger();

// Export class for creating custom loggers
export { DebugLogger };

// Convenience exports for backward compatibility
export const debug = (...args: any[]) => logger.debug(...args);
export const info = (...args: any[]) => logger.info(...args);
export const warn = (...args: any[]) => logger.warn(...args);
export const error = (...args: any[]) => logger.error(...args);

/**
 * Log a debug event with context
 * Used throughout the extension for structured logging
 *
 * @param context - The component or area (e.g., 'background', 'content-script')
 * @param message - The event message
 * @param data - Optional event data
 * @param level - Log level (default: 'debug')
 */
export function logDebugEvent(
  context: string,
  message: string,
  data?: any,
  level: LogLevel = 'debug'
): void {
  const contextLogger = logger.child(context);
  const logFn = contextLogger[level].bind(contextLogger);

  if (data) {
    logFn(message, data);
  } else {
    logFn(message);
  }

  // Persist log to chrome.storage for debug panel
  persistLog({
    timestamp: Date.now(),
    level,
    context,
    message,
    data
  }).catch(err => {
    console.error('Failed to persist log:', err);
  });
}

// ============================================================================
// Chrome Storage Persistent Logging
// ============================================================================

export interface DebugLogEntry {
  timestamp: number;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
}

const MAX_LOG_ENTRIES = 1000; // Keep last 1000 logs

/**
 * Get all debug logs from chrome.storage
 */
export async function getDebugLogs(): Promise<DebugLogEntry[]> {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return [];
  }

  const result = await chrome.storage.local.get(['debugLogs']);
  return result['debugLogs'] || [];
}

/**
 * Clear all debug logs from chrome.storage
 */
export async function clearDebugLogs(): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return;
  }

  await chrome.storage.local.set({ debugLogs: [] });
}

/**
 * Get log summary statistics
 */
export async function getLogSummary() {
  const logs = await getDebugLogs();

  const summary = {
    total: logs.length,
    byLevel: {
      debug: logs.filter(l => l.level === 'debug').length,
      info: logs.filter(l => l.level === 'info').length,
      warn: logs.filter(l => l.level === 'warn').length,
      error: logs.filter(l => l.level === 'error').length,
    },
    byContext: {} as Record<string, number>,
    oldest: logs.length > 0 ? logs[0].timestamp : null,
    newest: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
  };

  // Count by context
  logs.forEach(log => {
    summary.byContext[log.context] = (summary.byContext[log.context] || 0) + 1;
  });

  return summary;
}

/**
 * Add a log entry to persistent storage
 * (Internal use by logDebugEvent when storage is available)
 */
async function persistLog(entry: DebugLogEntry): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    return;
  }

  try {
    const logs = await getDebugLogs();
    logs.push(entry);

    // Keep only last MAX_LOG_ENTRIES
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.splice(0, logs.length - MAX_LOG_ENTRIES);
    }

    await chrome.storage.local.set({ debugLogs: logs });
  } catch (error) {
    console.error('Failed to persist log:', error);
  }
}
