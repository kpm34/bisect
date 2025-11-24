/**
 * Performance Monitor
 *
 * Lightweight real-time performance tracking for selection detection system.
 * Tracks latency, throughput, cache hit rates, and resource usage.
 *
 * Features:
 * - Circular buffer for metrics (prevents memory leaks)
 * - Rolling window statistics (min, max, avg, p95, p99)
 * - Event-based monitoring (no polling overhead)
 * - Zero-impact when disabled
 */

export interface PerformanceMetric {
    timestamp: number;
    eventType: string;
    latencyMs: number;
    source?: string;
    cacheHit?: boolean;
    metadata?: Record<string, any>;
}

export interface PerformanceStats {
    // Time window
    windowStart: number;
    windowEnd: number;
    durationMs: number;

    // Event counts
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySource: Record<string, number>;

    // Latency stats (ms)
    latency: {
        min: number;
        max: number;
        avg: number;
        median: number;
        p95: number;
        p99: number;
    };

    // Cache stats
    cache: {
        hitRate: number;
        hits: number;
        misses: number;
    };

    // Throughput
    throughput: {
        eventsPerSecond: number;
        eventsPerMinute: number;
    };

    // Performance indicators
    health: {
        status: 'excellent' | 'good' | 'fair' | 'poor';
        avgLatency: number;
        p95Latency: number;
        cacheHitRate: number;
        warnings: string[];
    };
}

export interface PerformanceMonitorConfig {
    enabled: boolean;           // Default: true
    bufferSize: number;         // Default: 1000 (max metrics to store)
    statsWindowMs: number;      // Default: 60000 (1 minute rolling window)
    warningThresholds: {
        avgLatencyMs: number;   // Default: 50ms
        p95LatencyMs: number;   // Default: 100ms
        cacheHitRate: number;   // Default: 0.7 (70%)
    };
}

/**
 * PerformanceMonitor - Tracks selection detection performance
 */
export class PerformanceMonitor {
    private config: Required<PerformanceMonitorConfig>;
    private metrics: PerformanceMetric[] = [];
    private maxBufferSize: number;
    private callbacks: Array<(stats: PerformanceStats) => void> = [];

    // Real-time counters
    private eventCounts: Record<string, number> = {};
    private sourceCounts: Record<string, number> = {};
    private cacheHits: number = 0;
    private cacheMisses: number = 0;

    constructor(config: Partial<PerformanceMonitorConfig> = {}) {
        this.config = {
            enabled: config.enabled ?? true,
            bufferSize: config.bufferSize ?? 1000,
            statsWindowMs: config.statsWindowMs ?? 60000,
            warningThresholds: {
                avgLatencyMs: config.warningThresholds?.avgLatencyMs ?? 50,
                p95LatencyMs: config.warningThresholds?.p95LatencyMs ?? 100,
                cacheHitRate: config.warningThresholds?.cacheHitRate ?? 0.7,
            },
        };

        this.maxBufferSize = this.config.bufferSize;
    }

    /**
     * Record a performance metric
     */
    record(metric: Omit<PerformanceMetric, 'timestamp'>): void {
        if (!this.config.enabled) return;

        const fullMetric: PerformanceMetric = {
            ...metric,
            timestamp: Date.now(),
        };

        // Add to circular buffer
        this.metrics.push(fullMetric);
        if (this.metrics.length > this.maxBufferSize) {
            this.metrics.shift(); // Remove oldest
        }

        // Update counters
        this.eventCounts[metric.eventType] = (this.eventCounts[metric.eventType] || 0) + 1;
        if (metric.source) {
            this.sourceCounts[metric.source] = (this.sourceCounts[metric.source] || 0) + 1;
        }
        if (metric.cacheHit !== undefined) {
            if (metric.cacheHit) {
                this.cacheHits++;
            } else {
                this.cacheMisses++;
            }
        }
    }

    /**
     * Start timing an operation
     * Returns a function to call when operation completes
     */
    startTiming(eventType: string, source?: string): (metadata?: Record<string, any>) => void {
        if (!this.config.enabled) {
            return () => {}; // No-op
        }

        const startTime = performance.now();

        return (metadata?: Record<string, any>) => {
            const latencyMs = performance.now() - startTime;
            this.record({
                eventType,
                latencyMs,
                source,
                metadata,
            });
        };
    }

    /**
     * Record a cache hit or miss
     */
    recordCacheAccess(hit: boolean, eventType: string = 'cache-access'): void {
        this.record({
            eventType,
            latencyMs: 0,
            cacheHit: hit,
        });
    }

    /**
     * Get current performance statistics
     */
    getStats(windowMs?: number): PerformanceStats {
        const window = windowMs || this.config.statsWindowMs;
        const now = Date.now();
        const windowStart = now - window;

        // Filter metrics to time window
        const windowMetrics = this.metrics.filter(m => m.timestamp >= windowStart);

        if (windowMetrics.length === 0) {
            return this.getEmptyStats(now, windowStart);
        }

        // Calculate latency stats
        const latencies = windowMetrics.map(m => m.latencyMs).sort((a, b) => a - b);
        const latencyStats = {
            min: latencies[0],
            max: latencies[latencies.length - 1],
            avg: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
            median: this.getPercentile(latencies, 0.5),
            p95: this.getPercentile(latencies, 0.95),
            p99: this.getPercentile(latencies, 0.99),
        };

        // Calculate cache stats
        const cacheMetrics = windowMetrics.filter(m => m.cacheHit !== undefined);
        const cacheHitsInWindow = cacheMetrics.filter(m => m.cacheHit).length;
        const cacheMissesInWindow = cacheMetrics.filter(m => !m.cacheHit).length;
        const cacheTotal = cacheHitsInWindow + cacheMissesInWindow;
        const cacheHitRate = cacheTotal > 0 ? cacheHitsInWindow / cacheTotal : 0;

        // Calculate throughput
        const durationSeconds = window / 1000;
        const eventsPerSecond = windowMetrics.length / durationSeconds;
        const eventsPerMinute = eventsPerSecond * 60;

        // Count events by type and source
        const eventsByType: Record<string, number> = {};
        const eventsBySource: Record<string, number> = {};

        windowMetrics.forEach(m => {
            eventsByType[m.eventType] = (eventsByType[m.eventType] || 0) + 1;
            if (m.source) {
                eventsBySource[m.source] = (eventsBySource[m.source] || 0) + 1;
            }
        });

        // Health assessment
        const health = this.assessHealth(latencyStats, cacheHitRate);

        return {
            windowStart,
            windowEnd: now,
            durationMs: window,
            totalEvents: windowMetrics.length,
            eventsByType,
            eventsBySource,
            latency: latencyStats,
            cache: {
                hitRate: cacheHitRate,
                hits: cacheHitsInWindow,
                misses: cacheMissesInWindow,
            },
            throughput: {
                eventsPerSecond,
                eventsPerMinute,
            },
            health,
        };
    }

    /**
     * Subscribe to stats updates
     */
    onStatsUpdate(callback: (stats: PerformanceStats) => void): () => void {
        this.callbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index !== -1) {
                this.callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Emit stats update to subscribers
     */
    emitStatsUpdate(): void {
        const stats = this.getStats();
        this.callbacks.forEach(callback => {
            try {
                callback(stats);
            } catch (error) {
                console.error('❌ Error in performance stats callback:', error);
            }
        });
    }

    /**
     * Reset all metrics
     */
    reset(): void {
        this.metrics = [];
        this.eventCounts = {};
        this.sourceCounts = {};
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    /**
     * Enable/disable monitoring
     */
    setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
    }

    // ========================================================================
    // Internal Helpers
    // ========================================================================

    private getPercentile(sortedValues: number[], percentile: number): number {
        if (sortedValues.length === 0) return 0;
        const index = Math.ceil(sortedValues.length * percentile) - 1;
        return sortedValues[Math.max(0, index)];
    }

    private assessHealth(
        latency: { avg: number; p95: number },
        cacheHitRate: number
    ): PerformanceStats['health'] {
        const warnings: string[] = [];
        let status: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';

        // Check average latency
        if (latency.avg > this.config.warningThresholds.avgLatencyMs) {
            warnings.push(`High average latency: ${latency.avg.toFixed(1)}ms (threshold: ${this.config.warningThresholds.avgLatencyMs}ms)`);
            status = status === 'excellent' ? 'good' : status;
        }

        // Check p95 latency
        if (latency.p95 > this.config.warningThresholds.p95LatencyMs) {
            warnings.push(`High p95 latency: ${latency.p95.toFixed(1)}ms (threshold: ${this.config.warningThresholds.p95LatencyMs}ms)`);
            status = status === 'excellent' ? 'fair' : status === 'good' ? 'fair' : status;
        }

        // Check cache hit rate
        if (cacheHitRate < this.config.warningThresholds.cacheHitRate) {
            warnings.push(`Low cache hit rate: ${(cacheHitRate * 100).toFixed(1)}% (threshold: ${this.config.warningThresholds.cacheHitRate * 100}%)`);
            status = status === 'excellent' ? 'good' : status;
        }

        // Downgrade to poor if multiple issues
        if (warnings.length >= 2) {
            status = 'poor';
        }

        return {
            status,
            avgLatency: latency.avg,
            p95Latency: latency.p95,
            cacheHitRate,
            warnings,
        };
    }

    private getEmptyStats(now: number, windowStart: number): PerformanceStats {
        return {
            windowStart,
            windowEnd: now,
            durationMs: now - windowStart,
            totalEvents: 0,
            eventsByType: {},
            eventsBySource: {},
            latency: {
                min: 0,
                max: 0,
                avg: 0,
                median: 0,
                p95: 0,
                p99: 0,
            },
            cache: {
                hitRate: 0,
                hits: 0,
                misses: 0,
            },
            throughput: {
                eventsPerSecond: 0,
                eventsPerMinute: 0,
            },
            health: {
                status: 'excellent',
                avgLatency: 0,
                p95Latency: 0,
                cacheHitRate: 0,
                warnings: [],
            },
        };
    }
}

export default PerformanceMonitor;
