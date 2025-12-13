/**
 * Anomaly Detector
 *
 * Detects anomalies in scraping behavior and responses using statistical methods.
 * Uses z-score analysis, IQR (Interquartile Range), and pattern deviation.
 */

import { logger } from '../../../utils/logger.js';

/**
 * Metric observation for anomaly detection
 */
export interface MetricObservation {
  /** Metric name */
  metric: string;
  /** Metric value */
  value: number;
  /** Timestamp */
  timestamp: number;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Anomaly detection result
 */
export interface AnomalyResult {
  /** Whether an anomaly was detected */
  isAnomaly: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Detection method used */
  method: 'zscore' | 'iqr' | 'mad' | 'pattern';
  /** Threshold that was exceeded */
  threshold: number;
  /** Actual value/score */
  actualValue: number;
  /** Expected value/score */
  expectedValue: number;
  /** Deviation from expected */
  deviation: number;
}

/**
 * Metric statistics
 */
export interface MetricStats {
  /** Metric name */
  name: string;
  /** Mean value */
  mean: number;
  /** Standard deviation */
  stdDev: number;
  /** Median value */
  median: number;
  /** Median Absolute Deviation */
  mad: number;
  /** First quartile (Q1) */
  q1: number;
  /** Third quartile (Q3) */
  q3: number;
  /** Interquartile range */
  iqr: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Total observations */
  count: number;
}

/**
 * Configuration for anomaly detection
 */
export interface AnomalyDetectorConfig {
  /** Z-score threshold for anomaly detection */
  zScoreThreshold?: number;
  /** IQR multiplier for outlier detection */
  iqrMultiplier?: number;
  /** MAD multiplier for outlier detection */
  madMultiplier?: number;
  /** Minimum observations before detecting anomalies */
  minObservations?: number;
  /** Maximum observations to keep */
  maxObservations?: number;
  /** Time window for observations (ms) */
  timeWindow?: number;
}

const DEFAULT_CONFIG: Required<AnomalyDetectorConfig> = {
  zScoreThreshold: 3.0, // 3 standard deviations
  iqrMultiplier: 1.5, // Standard IQR outlier detection
  madMultiplier: 3.5, // MAD multiplier for robust detection
  minObservations: 10,
  maxObservations: 1000,
  timeWindow: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * Detects anomalies using statistical methods
 */
export class AnomalyDetector {
  private config: Required<AnomalyDetectorConfig>;
  private observations: Map<string, MetricObservation[]> = new Map();
  private statsCache: Map<string, { stats: MetricStats; timestamp: number }> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor(config?: AnomalyDetectorConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.debug('[ML:Anomaly] AnomalyDetector initialized', {
      zScoreThreshold: this.config.zScoreThreshold,
      iqrMultiplier: this.config.iqrMultiplier,
      minObservations: this.config.minObservations
    });
  }

  /**
   * Record a metric observation
   */
  recordMetric(metric: string, value: number, context?: Record<string, unknown>): void {
    const observation: MetricObservation = {
      metric,
      value,
      timestamp: Date.now(),
      context
    };

    let metricObs = this.observations.get(metric);
    if (!metricObs) {
      metricObs = [];
      this.observations.set(metric, metricObs);
    }

    metricObs.push(observation);
    this.trimObservations(metric);

    // Invalidate cache for this metric
    this.statsCache.delete(metric);

    logger.debug('[ML:Anomaly] Metric recorded', {
      metric,
      value,
      totalObservations: metricObs.length
    });
  }

  /**
   * Detect anomaly using z-score method
   */
  detectAnomalyZScore(metric: string, value: number): AnomalyResult | null {
    const stats = this.getStats(metric);

    if (!stats) {
      return null;
    }

    // Calculate z-score
    const zScore = stats.stdDev === 0 ? 0 : Math.abs((value - stats.mean) / stats.stdDev);

    const isAnomaly = zScore > this.config.zScoreThreshold;
    const confidence = Math.min(1.0, zScore / (this.config.zScoreThreshold * 2));

    return {
      isAnomaly,
      confidence,
      method: 'zscore',
      threshold: this.config.zScoreThreshold,
      actualValue: value,
      expectedValue: stats.mean,
      deviation: zScore
    };
  }

  /**
   * Detect anomaly using IQR method
   */
  detectAnomalyIQR(metric: string, value: number): AnomalyResult | null {
    const stats = this.getStats(metric);

    if (!stats) {
      return null;
    }

    // Calculate IQR bounds
    const lowerBound = stats.q1 - this.config.iqrMultiplier * stats.iqr;
    const upperBound = stats.q3 + this.config.iqrMultiplier * stats.iqr;

    const isAnomaly = value < lowerBound || value > upperBound;

    // Calculate deviation from bounds
    let deviation = 0;
    if (value < lowerBound) {
      deviation = (lowerBound - value) / (stats.iqr || 1);
    } else if (value > upperBound) {
      deviation = (value - upperBound) / (stats.iqr || 1);
    }

    const confidence = Math.min(1.0, deviation / this.config.iqrMultiplier);

    return {
      isAnomaly,
      confidence,
      method: 'iqr',
      threshold: this.config.iqrMultiplier,
      actualValue: value,
      expectedValue: stats.median,
      deviation
    };
  }

  /**
   * Detect anomaly using MAD (Median Absolute Deviation) method
   */
  detectAnomalyMAD(metric: string, value: number): AnomalyResult | null {
    const stats = this.getStats(metric);

    if (!stats) {
      return null;
    }

    // Calculate modified z-score using MAD
    const modifiedZScore = stats.mad === 0 ? 0 : Math.abs((value - stats.median) / (1.4826 * stats.mad));

    const isAnomaly = modifiedZScore > this.config.madMultiplier;
    const confidence = Math.min(1.0, modifiedZScore / (this.config.madMultiplier * 2));

    return {
      isAnomaly,
      confidence,
      method: 'mad',
      threshold: this.config.madMultiplier,
      actualValue: value,
      expectedValue: stats.median,
      deviation: modifiedZScore
    };
  }

  /**
   * Detect anomaly using all methods (ensemble)
   */
  detectAnomaly(metric: string, value: number): AnomalyResult | null {
    const zScoreResult = this.detectAnomalyZScore(metric, value);
    const iqrResult = this.detectAnomalyIQR(metric, value);
    const madResult = this.detectAnomalyMAD(metric, value);

    // If any method is null, not enough data
    if (!zScoreResult || !iqrResult || !madResult) {
      return null;
    }

    // Ensemble: consider anomaly if 2+ methods agree
    const anomalyCount =
      (zScoreResult.isAnomaly ? 1 : 0) +
      (iqrResult.isAnomaly ? 1 : 0) +
      (madResult.isAnomaly ? 1 : 0);

    const isAnomaly = anomalyCount >= 2;

    // Average confidence
    const confidence =
      (zScoreResult.confidence + iqrResult.confidence + madResult.confidence) / 3;

    logger.debug('[ML:Anomaly] Anomaly detection', {
      metric,
      value,
      isAnomaly,
      confidence: (confidence * 100).toFixed(1) + '%',
      methods: {
        zscore: zScoreResult.isAnomaly,
        iqr: iqrResult.isAnomaly,
        mad: madResult.isAnomaly
      }
    });

    // Return result from most confident method
    const results = [zScoreResult, iqrResult, madResult];
    results.sort((a, b) => b.confidence - a.confidence);

    return {
      ...results[0],
      isAnomaly,
      confidence
    };
  }

  /**
   * Check multiple metrics for anomalies
   */
  checkMetrics(metrics: Record<string, number>): Map<string, AnomalyResult> {
    const results = new Map<string, AnomalyResult>();

    for (const [metric, value] of Object.entries(metrics)) {
      const result = this.detectAnomaly(metric, value);
      if (result && result.isAnomaly) {
        results.set(metric, result);
      }
    }

    if (results.size > 0) {
      logger.warn('[ML:Anomaly] Anomalies detected', {
        count: results.size,
        metrics: Array.from(results.keys())
      });
    }

    return results;
  }

  /**
   * Get statistics for a metric
   */
  getStats(metric: string): MetricStats | null {
    // Check cache
    const cached = this.statsCache.get(metric);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.stats;
    }

    const observations = this.observations.get(metric);

    if (!observations || observations.length < this.config.minObservations) {
      return null;
    }

    const stats = this.calculateStats(metric, observations);

    // Cache stats
    this.statsCache.set(metric, {
      stats,
      timestamp: Date.now()
    });

    return stats;
  }

  /**
   * Get all tracked metrics
   */
  getTrackedMetrics(): string[] {
    return Array.from(this.observations.keys());
  }

  /**
   * Get all statistics
   */
  getAllStats(): MetricStats[] {
    return this.getTrackedMetrics()
      .map(metric => this.getStats(metric))
      .filter((stats): stats is MetricStats => stats !== null);
  }

  /**
   * Clear observations for a metric
   */
  clearMetric(metric: string): void {
    this.observations.delete(metric);
    this.statsCache.delete(metric);
    logger.info('[ML:Anomaly] Metric cleared', { metric });
  }

  /**
   * Clear all observations
   */
  clearAll(): void {
    this.observations.clear();
    this.statsCache.clear();
    logger.info('[ML:Anomaly] All observations cleared');
  }

  /**
   * Export observations
   */
  exportObservations(): Record<string, MetricObservation[]> {
    const exported: Record<string, MetricObservation[]> = {};
    for (const [metric, obs] of this.observations.entries()) {
      exported[metric] = [...obs];
    }
    return exported;
  }

  /**
   * Import observations
   */
  importObservations(data: Record<string, MetricObservation[]>): void {
    this.observations.clear();
    this.statsCache.clear();

    for (const [metric, obs] of Object.entries(data)) {
      this.observations.set(metric, [...obs]);
      this.trimObservations(metric);
    }

    logger.info('[ML:Anomaly] Observations imported', {
      metrics: this.getTrackedMetrics().length
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculate statistics for a metric
   */
  private calculateStats(metric: string, observations: MetricObservation[]): MetricStats {
    const values = observations.map(obs => obs.value);

    // Sort for median and quartile calculations
    const sorted = [...values].sort((a, b) => a - b);

    // Mean
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Standard deviation
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Median
    const median = this.calculateMedian(sorted);

    // Quartiles
    const q1 = this.calculateMedian(sorted.slice(0, Math.floor(sorted.length / 2)));
    const q3 = this.calculateMedian(sorted.slice(Math.ceil(sorted.length / 2)));
    const iqr = q3 - q1;

    // MAD (Median Absolute Deviation)
    const deviations = values.map(v => Math.abs(v - median));
    const mad = this.calculateMedian(deviations.sort((a, b) => a - b));

    return {
      name: metric,
      mean,
      stdDev,
      median,
      mad,
      q1,
      q3,
      iqr,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  /**
   * Calculate median of sorted array
   */
  private calculateMedian(sorted: number[]): number {
    if (sorted.length === 0) {
      return 0;
    }

    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  /**
   * Trim observations for a metric
   */
  private trimObservations(metric: string): void {
    const observations = this.observations.get(metric);
    if (!observations) {
      return;
    }

    // Trim by max size
    if (observations.length > this.config.maxObservations) {
      this.observations.set(metric, observations.slice(-this.config.maxObservations));
    }

    // Trim by time window
    const now = Date.now();
    const cutoff = now - this.config.timeWindow;
    const filtered = observations.filter(obs => obs.timestamp >= cutoff);

    if (filtered.length < observations.length) {
      this.observations.set(metric, filtered);
      logger.debug('[ML:Anomaly] Old observations removed', {
        metric,
        removed: observations.length - filtered.length,
        remaining: filtered.length
      });
    }
  }
}
