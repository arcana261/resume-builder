import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/database/schema.js';

/**
 * Create an in-memory SQLite database for testing
 */
export function createTestDatabase(): BetterSQLite3Database<typeof schema> {
  const sqlite = new Database(':memory:');

  // Enable WAL mode for better performance
  sqlite.pragma('journal_mode = WAL');

  const db = drizzle(sqlite, { schema });

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      company_id TEXT,
      location TEXT,
      description TEXT,
      employment_type TEXT,
      seniority_level TEXT,
      industry TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      salary_currency TEXT,
      job_url TEXT NOT NULL,
      apply_url TEXT,
      posted_at INTEGER NOT NULL,
      scraped_at INTEGER NOT NULL,
      search_id INTEGER,
      raw_data TEXT,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      location TEXT,
      filters TEXT,
      total_results INTEGER DEFAULT 0 NOT NULL,
      successful_scrapes INTEGER DEFAULT 0 NOT NULL,
      failed_scrapes INTEGER DEFAULT 0 NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      status TEXT DEFAULT 'pending' NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scrape_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      job_id TEXT,
      error_type TEXT NOT NULL,
      error_message TEXT NOT NULL,
      url TEXT,
      occurred_at INTEGER NOT NULL,
      FOREIGN KEY (search_id) REFERENCES searches(id)
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_job_id ON jobs(job_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_search_id ON jobs(search_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
    CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
    CREATE INDEX IF NOT EXISTS idx_searches_status ON searches(status);
    CREATE INDEX IF NOT EXISTS idx_scrape_errors_search_id ON scrape_errors(search_id);
  `);

  return db;
}

/**
 * Clean up test database
 */
export function cleanupTestDatabase(db: BetterSQLite3Database<typeof schema>): void {
  const sqlite = db._.fullSchema;
  // Close the database connection if it has one
}
