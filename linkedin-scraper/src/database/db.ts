import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { sql } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqliteInstance: Database.Database | null = null;

export function getDatabase(dbPath?: string) {
  if (dbInstance) {
    return dbInstance;
  }

  const finalDbPath = dbPath || process.env.DATABASE_PATH || './data/linkedin-jobs.db';

  // Ensure directory exists
  const dir = path.dirname(finalDbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  sqliteInstance = new Database(finalDbPath);
  sqliteInstance.pragma('journal_mode = WAL');

  dbInstance = drizzle(sqliteInstance, { schema });

  // Initialize database schema
  initializeDatabase(dbInstance);

  return dbInstance;
}

function initializeDatabase(db: ReturnType<typeof drizzle>) {
  // Create tables if they don't exist
  db.run(sql`
    CREATE TABLE IF NOT EXISTS searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      location TEXT NOT NULL,
      filters TEXT NOT NULL,
      total_results INTEGER NOT NULL DEFAULT 0,
      successful_scrapes INTEGER NOT NULL DEFAULT 0,
      failed_scrapes INTEGER NOT NULL DEFAULT 0,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      status TEXT NOT NULL DEFAULT 'running',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      company_id TEXT,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      employment_type TEXT,
      seniority_level TEXT,
      industry TEXT,
      salary_min REAL,
      salary_max REAL,
      salary_currency TEXT,
      job_url TEXT NOT NULL,
      apply_url TEXT,
      posted_at INTEGER NOT NULL,
      scraped_at INTEGER NOT NULL,
      search_id INTEGER NOT NULL,
      raw_data TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (search_id) REFERENCES searches(id)
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS scrape_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      job_id TEXT,
      error_type TEXT NOT NULL,
      error_message TEXT NOT NULL,
      url TEXT,
      occurred_at INTEGER NOT NULL,
      FOREIGN KEY (search_id) REFERENCES searches(id)
    )
  `);

  // Create indexes
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_jobs_job_id ON jobs(job_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_jobs_search_id ON jobs(search_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at)`);

  // Run migrations
  runMigrations(db);
}

function runMigrations(db: ReturnType<typeof drizzle>) {
  // Migration: Add page_html column to jobs table
  try {
    // Check if column exists first
    const tableInfo = sqliteInstance?.prepare('PRAGMA table_info(jobs)').all() as Array<{ name: string }>;
    const hasPageHtml = tableInfo?.some(col => col.name === 'page_html');

    if (!hasPageHtml) {
      db.run(sql`ALTER TABLE jobs ADD COLUMN page_html TEXT DEFAULT NULL`);
    }
  } catch (error: any) {
    // Silently ignore errors - column likely already exists
    if (!error.message?.includes('duplicate column') && !error.message?.includes('already exists')) {
      console.warn('Migration warning:', error.message);
    }
  }
}

export function closeDatabase() {
  if (sqliteInstance) {
    sqliteInstance.close();
    dbInstance = null;
    sqliteInstance = null;
  }
}
