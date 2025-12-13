/**
 * Training Data Collector
 *
 * Collects and manages training data for ML pattern analyzers.
 * Persists data to disk for long-term learning across sessions.
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../../utils/logger.js';
import type { TimingObservation } from './TimingPatternAnalyzer.js';
import type { BehaviorObservation } from './BehaviorPatternRecognizer.js';
import type { MetricObservation } from './AnomalyDetector.js';

/**
 * Scraping session data
 */
export interface ScrapingSession {
  /** Session ID */
  id: string;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Total pages scraped */
  pagesScraped: number;
  /** Successful scrapes */
  successfulScrapes: number;
  /** Failed scrapes */
  failedScrapes: number;
  /** Detection events */
  detectionEvents: number;
  /** Average delay used */
  avgDelay: number;
  /** Session successful? */
  successful: boolean;
  /** URLs visited */
  urls: string[];
}

/**
 * Training data snapshot
 */
export interface TrainingDataSnapshot {
  /** Version of data format */
  version: string;
  /** Timestamp of snapshot */
  timestamp: number;
  /** Timing observations */
  timingObservations: TimingObservation[];
  /** Behavior observations */
  behaviorObservations: BehaviorObservation[];
  /** Metric observations */
  metricObservations: Record<string, MetricObservation[]>;
  /** Scraping sessions */
  sessions: ScrapingSession[];
}

/**
 * Configuration for training data collector
 */
export interface TrainingDataCollectorConfig {
  /** Directory to save training data */
  dataDirectory?: string;
  /** Auto-save interval (ms) */
  autoSaveInterval?: number;
  /** Enable auto-save */
  enableAutoSave?: boolean;
  /** Maximum sessions to keep */
  maxSessions?: number;
}

const DEFAULT_CONFIG: Required<TrainingDataCollectorConfig> = {
  dataDirectory: './data/training',
  autoSaveInterval: 10 * 60 * 1000, // 10 minutes
  enableAutoSave: true,
  maxSessions: 100
};

const DATA_VERSION = '1.0.0';

/**
 * Collects and persists training data for ML models
 */
export class TrainingDataCollector {
  private config: Required<TrainingDataCollectorConfig>;
  private timingObservations: TimingObservation[] = [];
  private behaviorObservations: BehaviorObservation[] = [];
  private metricObservations: Map<string, MetricObservation[]> = new Map();
  private sessions: ScrapingSession[] = [];
  private currentSession: ScrapingSession | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private dataLoaded: boolean = false;

  constructor(config?: TrainingDataCollectorConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.debug('[ML:Training] TrainingDataCollector initialized', {
      dataDirectory: this.config.dataDirectory,
      autoSave: this.config.enableAutoSave,
      interval: this.config.autoSaveInterval
    });
  }

  /**
   * Initialize - load existing data and setup auto-save
   */
  async initialize(): Promise<void> {
    // Load existing training data
    await this.loadData();

    // Setup auto-save
    if (this.config.enableAutoSave) {
      this.startAutoSave();
    }

    logger.info('[ML:Training] Initialized', {
      timingObs: this.timingObservations.length,
      behaviorObs: this.behaviorObservations.length,
      sessions: this.sessions.length
    });
  }

  /**
   * Start a new scraping session
   */
  startSession(sessionId: string): void {
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      endTime: 0,
      pagesScraped: 0,
      successfulScrapes: 0,
      failedScrapes: 0,
      detectionEvents: 0,
      avgDelay: 0,
      successful: false,
      urls: []
    };

    logger.debug('[ML:Training] Session started', { sessionId });
  }

  /**
   * End current scraping session
   */
  endSession(successful: boolean): void {
    if (!this.currentSession) {
      logger.warn('[ML:Training] No active session to end');
      return;
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.successful = successful;

    // Add to sessions history
    this.sessions.push(this.currentSession);
    this.trimSessions();

    logger.info('[ML:Training] Session ended', {
      id: this.currentSession.id,
      duration: this.currentSession.endTime - this.currentSession.startTime,
      pagesScraped: this.currentSession.pagesScraped,
      successful
    });

    this.currentSession = null;

    // Save data
    if (this.config.enableAutoSave) {
      this.saveData().catch(err =>
        logger.error('[ML:Training] Failed to save after session end', { error: err })
      );
    }
  }

  /**
   * Record session event
   */
  recordSessionEvent(event: Partial<ScrapingSession>): void {
    if (!this.currentSession) {
      return;
    }

    if (event.pagesScraped !== undefined) {
      this.currentSession.pagesScraped += event.pagesScraped;
    }
    if (event.successfulScrapes !== undefined) {
      this.currentSession.successfulScrapes += event.successfulScrapes;
    }
    if (event.failedScrapes !== undefined) {
      this.currentSession.failedScrapes += event.failedScrapes;
    }
    if (event.detectionEvents !== undefined) {
      this.currentSession.detectionEvents += event.detectionEvents;
    }
    if (event.urls && event.urls.length > 0) {
      this.currentSession.urls.push(...event.urls);
    }
  }

  /**
   * Add timing observation
   */
  addTimingObservation(observation: TimingObservation): void {
    this.timingObservations.push(observation);
    logger.debug('[ML:Training] Timing observation added', {
      actionType: observation.actionType,
      delay: observation.delay,
      successful: observation.successful
    });
  }

  /**
   * Add behavior observation
   */
  addBehaviorObservation(observation: BehaviorObservation): void {
    this.behaviorObservations.push(observation);
    logger.debug('[ML:Training] Behavior observation added', {
      actions: observation.actions.join(' -> '),
      successful: observation.successful
    });
  }

  /**
   * Add metric observation
   */
  addMetricObservation(observation: MetricObservation): void {
    let metricObs = this.metricObservations.get(observation.metric);
    if (!metricObs) {
      metricObs = [];
      this.metricObservations.set(observation.metric, metricObs);
    }
    metricObs.push(observation);

    logger.debug('[ML:Training] Metric observation added', {
      metric: observation.metric,
      value: observation.value
    });
  }

  /**
   * Get all timing observations
   */
  getTimingObservations(): TimingObservation[] {
    return [...this.timingObservations];
  }

  /**
   * Get all behavior observations
   */
  getBehaviorObservations(): BehaviorObservation[] {
    return [...this.behaviorObservations];
  }

  /**
   * Get metric observations
   */
  getMetricObservations(): Record<string, MetricObservation[]> {
    const result: Record<string, MetricObservation[]> = {};
    for (const [metric, obs] of this.metricObservations.entries()) {
      result[metric] = [...obs];
    }
    return result;
  }

  /**
   * Get all sessions
   */
  getSessions(): ScrapingSession[] {
    return [...this.sessions];
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalSessions: number;
    successfulSessions: number;
    failedSessions: number;
    avgSuccessRate: number;
    avgDetectionRate: number;
  } {
    const successful = this.sessions.filter(s => s.successful).length;
    const totalDetections = this.sessions.reduce((sum, s) => sum + s.detectionEvents, 0);
    const totalScrapes = this.sessions.reduce((sum, s) => sum + s.pagesScraped, 0);

    return {
      totalSessions: this.sessions.length,
      successfulSessions: successful,
      failedSessions: this.sessions.length - successful,
      avgSuccessRate: this.sessions.length > 0 ? successful / this.sessions.length : 0,
      avgDetectionRate: totalScrapes > 0 ? totalDetections / totalScrapes : 0
    };
  }

  /**
   * Save training data to disk
   */
  async saveData(): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.config.dataDirectory, { recursive: true });

      const snapshot: TrainingDataSnapshot = {
        version: DATA_VERSION,
        timestamp: Date.now(),
        timingObservations: this.timingObservations,
        behaviorObservations: this.behaviorObservations,
        metricObservations: this.getMetricObservations(),
        sessions: this.sessions
      };

      const filePath = path.join(this.config.dataDirectory, 'training-data.json');
      await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');

      logger.debug('[ML:Training] Data saved', {
        path: filePath,
        timingObs: this.timingObservations.length,
        behaviorObs: this.behaviorObservations.length,
        sessions: this.sessions.length
      });
    } catch (error) {
      logger.error('[ML:Training] Failed to save data', { error });
      throw error;
    }
  }

  /**
   * Load training data from disk
   */
  async loadData(): Promise<void> {
    try {
      const filePath = path.join(this.config.dataDirectory, 'training-data.json');

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        logger.debug('[ML:Training] No existing training data found');
        this.dataLoaded = true;
        return;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const snapshot: TrainingDataSnapshot = JSON.parse(content);

      // Validate version
      if (snapshot.version !== DATA_VERSION) {
        logger.warn('[ML:Training] Data version mismatch', {
          expected: DATA_VERSION,
          actual: snapshot.version
        });
      }

      // Load data
      this.timingObservations = snapshot.timingObservations || [];
      this.behaviorObservations = snapshot.behaviorObservations || [];

      // Load metric observations
      this.metricObservations.clear();
      if (snapshot.metricObservations) {
        for (const [metric, obs] of Object.entries(snapshot.metricObservations)) {
          this.metricObservations.set(metric, obs);
        }
      }

      this.sessions = snapshot.sessions || [];
      this.trimSessions();

      this.dataLoaded = true;

      logger.info('[ML:Training] Data loaded', {
        path: filePath,
        timingObs: this.timingObservations.length,
        behaviorObs: this.behaviorObservations.length,
        sessions: this.sessions.length
      });
    } catch (error) {
      logger.error('[ML:Training] Failed to load data', { error });
      this.dataLoaded = true; // Mark as loaded even if failed (start fresh)
    }
  }

  /**
   * Clear all training data
   */
  clearAll(): void {
    this.timingObservations = [];
    this.behaviorObservations = [];
    this.metricObservations.clear();
    this.sessions = [];

    logger.info('[ML:Training] All training data cleared');
  }

  /**
   * Export training data as JSON
   */
  exportData(): TrainingDataSnapshot {
    return {
      version: DATA_VERSION,
      timestamp: Date.now(),
      timingObservations: this.timingObservations,
      behaviorObservations: this.behaviorObservations,
      metricObservations: this.getMetricObservations(),
      sessions: this.sessions
    };
  }

  /**
   * Import training data from JSON
   */
  importData(snapshot: TrainingDataSnapshot): void {
    this.timingObservations = snapshot.timingObservations || [];
    this.behaviorObservations = snapshot.behaviorObservations || [];

    this.metricObservations.clear();
    if (snapshot.metricObservations) {
      for (const [metric, obs] of Object.entries(snapshot.metricObservations)) {
        this.metricObservations.set(metric, obs);
      }
    }

    this.sessions = snapshot.sessions || [];
    this.trimSessions();

    logger.info('[ML:Training] Data imported', {
      timingObs: this.timingObservations.length,
      behaviorObs: this.behaviorObservations.length,
      sessions: this.sessions.length
    });
  }

  /**
   * Shutdown - stop auto-save and save final data
   */
  async shutdown(): Promise<void> {
    this.stopAutoSave();

    if (this.dataLoaded) {
      await this.saveData();
    }

    logger.info('[ML:Training] Shutdown complete');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      return;
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveData().catch(err =>
        logger.error('[ML:Training] Auto-save failed', { error: err })
      );
    }, this.config.autoSaveInterval);

    logger.debug('[ML:Training] Auto-save started', {
      interval: this.config.autoSaveInterval
    });
  }

  /**
   * Stop auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      logger.debug('[ML:Training] Auto-save stopped');
    }
  }

  /**
   * Trim sessions to max limit
   */
  private trimSessions(): void {
    if (this.sessions.length > this.config.maxSessions) {
      this.sessions = this.sessions.slice(-this.config.maxSessions);
      logger.debug('[ML:Training] Sessions trimmed', {
        newCount: this.sessions.length
      });
    }
  }
}
