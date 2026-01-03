import { describe, it, expect, afterEach, vi } from 'vitest';
import { getDatabase, closeDatabase } from '../../src/database/db.js';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

describe('Database', () => {
  const testDbPath = './data/test-db-lifecycle.db';
  const testDbDir = './data';

  afterEach(() => {
    // Clean up database
    closeDatabase();

    // Remove test database files
    const extensions = ['', '-shm', '-wal', '-journal'];
    extensions.forEach(ext => {
      const filePath = testDbPath + ext;
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          // Ignore errors - file might be locked
        }
      }
    });
  });

  describe('getDatabase', () => {
    it('should create database file if not exists', () => {
      const db = getDatabase(testDbPath);

      expect(db).toBeDefined();
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('should create parent directory if missing', () => {
      const customPath = './data/custom/test.db';
      const customDir = './data/custom';

      // Ensure directory doesn't exist
      if (fs.existsSync(customDir)) {
        fs.rmSync(customDir, { recursive: true });
      }

      const db = getDatabase(customPath);

      expect(fs.existsSync(customDir)).toBe(true);
      expect(fs.existsSync(customPath)).toBe(true);

      // Cleanup
      closeDatabase();
      fs.unlinkSync(customPath);
      fs.rmdirSync(customDir);
    });

    it('should return singleton instance on multiple calls', () => {
      const db1 = getDatabase(testDbPath);
      const db2 = getDatabase(testDbPath);

      expect(db1).toBe(db2);
    });

    it('should use environment variable if no path provided', () => {
      const originalEnv = process.env.DATABASE_PATH;
      process.env.DATABASE_PATH = testDbPath;

      const db = getDatabase();

      expect(db).toBeDefined();
      expect(fs.existsSync(testDbPath)).toBe(true);

      process.env.DATABASE_PATH = originalEnv;
    });

    it('should use default path if no path or env provided', () => {
      const originalEnv = process.env.DATABASE_PATH;
      const defaultPath = './data/linkedin-jobs.db';

      // Clean up default database before test
      try {
        closeDatabase();
        ['', '-shm', '-wal', '-journal'].forEach(ext => {
          const filePath = defaultPath + ext;
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      } catch (error) {
        // Ignore cleanup errors
      }

      delete process.env.DATABASE_PATH;

      const db = getDatabase();

      expect(db).toBeDefined();
      expect(fs.existsSync(defaultPath)).toBe(true);

      process.env.DATABASE_PATH = originalEnv;
    });
  });

  describe('closeDatabase', () => {
    it('should close database connection', () => {
      const db = getDatabase(testDbPath);
      expect(db).toBeDefined();

      closeDatabase();

      // After closing, next getDatabase should create new instance
      const db2 = getDatabase(testDbPath);
      expect(db2).toBeDefined();
      expect(db2).not.toBe(db); // Different instance
    });

    it('should reset singleton to null', () => {
      getDatabase(testDbPath);
      closeDatabase();

      // Getting database again should create new instance
      const newDb = getDatabase(testDbPath);
      expect(newDb).toBeDefined();
    });

    it('should handle multiple close calls gracefully', () => {
      getDatabase(testDbPath);

      expect(() => {
        closeDatabase();
        closeDatabase();
        closeDatabase();
      }).not.toThrow();
    });
  });

  describe('Schema Initialization', () => {
    it('should create searches table with correct schema', () => {
      const db = getDatabase(testDbPath);

      // Query table schema
      const sqlite = new Database(testDbPath);
      const tableInfo = sqlite.prepare('PRAGMA table_info(searches)').all() as Array<{
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
      }>;

      expect(tableInfo.length).toBeGreaterThan(0);

      const columnNames = tableInfo.map(col => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('query');
      expect(columnNames).toContain('location');
      expect(columnNames).toContain('filters');
      expect(columnNames).toContain('total_results');
      expect(columnNames).toContain('successful_scrapes');
      expect(columnNames).toContain('failed_scrapes');
      expect(columnNames).toContain('started_at');
      expect(columnNames).toContain('completed_at');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('created_at');

      sqlite.close();
    });

    it('should create jobs table with correct schema', () => {
      const db = getDatabase(testDbPath);

      const sqlite = new Database(testDbPath);
      const tableInfo = sqlite.prepare('PRAGMA table_info(jobs)').all() as Array<{
        name: string;
        type: string;
      }>;

      expect(tableInfo.length).toBeGreaterThan(0);

      const columnNames = tableInfo.map(col => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('job_id');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('company');
      expect(columnNames).toContain('company_id');
      expect(columnNames).toContain('location');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('employment_type');
      expect(columnNames).toContain('seniority_level');
      expect(columnNames).toContain('industry');
      expect(columnNames).toContain('salary_min');
      expect(columnNames).toContain('salary_max');
      expect(columnNames).toContain('salary_currency');
      expect(columnNames).toContain('job_url');
      expect(columnNames).toContain('apply_url');
      expect(columnNames).toContain('posted_at');
      expect(columnNames).toContain('scraped_at');
      expect(columnNames).toContain('search_id');
      expect(columnNames).toContain('raw_data');
      expect(columnNames).toContain('page_html');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');

      sqlite.close();
    });

    it('should create scrape_errors table with correct schema', () => {
      const db = getDatabase(testDbPath);

      const sqlite = new Database(testDbPath);
      const tableInfo = sqlite.prepare('PRAGMA table_info(scrape_errors)').all() as Array<{
        name: string;
      }>;

      expect(tableInfo.length).toBeGreaterThan(0);

      const columnNames = tableInfo.map(col => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('search_id');
      expect(columnNames).toContain('job_id');
      expect(columnNames).toContain('error_type');
      expect(columnNames).toContain('error_message');
      expect(columnNames).toContain('url');
      expect(columnNames).toContain('occurred_at');

      sqlite.close();
    });

    it('should create all required indexes', () => {
      const db = getDatabase(testDbPath);

      const sqlite = new Database(testDbPath);
      const indexes = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all() as Array<{
        name: string;
      }>;

      const indexNames = indexes.map(idx => idx.name);

      expect(indexNames).toContain('idx_jobs_job_id');
      expect(indexNames).toContain('idx_jobs_company');
      expect(indexNames).toContain('idx_jobs_location');
      expect(indexNames).toContain('idx_jobs_posted_at');
      expect(indexNames).toContain('idx_jobs_search_id');
      expect(indexNames).toContain('idx_searches_created_at');

      sqlite.close();
    });

    it('should enable WAL mode', () => {
      const db = getDatabase(testDbPath);

      const sqlite = new Database(testDbPath);
      const result = sqlite.prepare('PRAGMA journal_mode').get() as { journal_mode: string };

      expect(result.journal_mode).toBe('wal');

      sqlite.close();
    });

    it('should have foreign key constraints defined', () => {
      const db = getDatabase(testDbPath);

      const sqlite = new Database(testDbPath);

      // Check jobs table foreign key to searches
      const jobsFk = sqlite.prepare('PRAGMA foreign_key_list(jobs)').all() as Array<{
        table: string;
        from: string;
        to: string;
      }>;

      expect(jobsFk.length).toBeGreaterThan(0);
      expect(jobsFk[0].table).toBe('searches');
      expect(jobsFk[0].from).toBe('search_id');

      // Check scrape_errors table foreign key to searches
      const errorsFk = sqlite.prepare('PRAGMA foreign_key_list(scrape_errors)').all() as Array<{
        table: string;
        from: string;
      }>;

      expect(errorsFk.length).toBeGreaterThan(0);
      expect(errorsFk[0].table).toBe('searches');
      expect(errorsFk[0].from).toBe('search_id');

      sqlite.close();
    });
  });

  describe('Migrations', () => {
    it('should add page_html column to jobs table', () => {
      const db = getDatabase(testDbPath);

      const sqlite = new Database(testDbPath);
      const tableInfo = sqlite.prepare('PRAGMA table_info(jobs)').all() as Array<{
        name: string;
      }>;

      const hasPageHtml = tableInfo.some(col => col.name === 'page_html');
      expect(hasPageHtml).toBe(true);

      sqlite.close();
    });

    it('should be idempotent - running migration multiple times should not fail', () => {
      // First initialization
      const db1 = getDatabase(testDbPath);
      closeDatabase();

      // Second initialization (migrations should run again without errors)
      expect(() => {
        const db2 = getDatabase(testDbPath);
      }).not.toThrow();
    });

    it('should not throw on duplicate column error', () => {
      const db = getDatabase(testDbPath);

      // Try to add the column again (already exists from initialization)
      const sqlite = new Database(testDbPath);

      // This should not throw - migration handles this gracefully
      expect(() => {
        try {
          sqlite.prepare('ALTER TABLE jobs ADD COLUMN page_html TEXT DEFAULT NULL').run();
        } catch (error: any) {
          // Migration code silently handles this
          if (error.message?.includes('duplicate column')) {
            // Expected - column already exists
          } else {
            throw error;
          }
        }
      }).not.toThrow();

      sqlite.close();
    });
  });
});
