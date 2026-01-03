import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseService {
  private db: Database.Database;
  private static instance: DatabaseService;

  private constructor(dbPath?: string) {
    const finalDbPath = dbPath || process.env.DATABASE_PATH || path.join(__dirname, '../../../../linkedin-scraper/data/linkedin-jobs.db');

    console.log(`[DatabaseService] Connecting to database: ${finalDbPath}`);

    this.db = new Database(finalDbPath, { readonly: false });
    this.db.pragma('journal_mode = WAL');

    // Initialize FTS5 if not exists
    this.initializeFTS5();
  }

  public static getInstance(dbPath?: string): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService(dbPath);
    }
    return DatabaseService.instance;
  }

  private initializeFTS5() {
    try {
      // Check if FTS5 table exists
      const tableExists = this.db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='jobs_fts'
      `).get();

      if (!tableExists) {
        console.log('[DatabaseService] Creating FTS5 virtual table...');

        // Create FTS5 virtual table
        this.db.exec(`
          CREATE VIRTUAL TABLE jobs_fts USING fts5(
            job_id UNINDEXED,
            title,
            company,
            location,
            description,
            industry,
            content='jobs',
            content_rowid='id'
          );
        `);

        // Populate FTS table from existing jobs
        this.db.exec(`
          INSERT INTO jobs_fts(rowid, job_id, title, company, location, description, industry)
          SELECT id, job_id, title, company, location, description, industry
          FROM jobs;
        `);

        // Create triggers to keep FTS in sync
        this.db.exec(`
          CREATE TRIGGER jobs_ai AFTER INSERT ON jobs BEGIN
            INSERT INTO jobs_fts(rowid, job_id, title, company, location, description, industry)
            VALUES (new.id, new.job_id, new.title, new.company, new.location, new.description, new.industry);
          END;
        `);

        this.db.exec(`
          CREATE TRIGGER jobs_ad AFTER DELETE ON jobs BEGIN
            DELETE FROM jobs_fts WHERE rowid = old.id;
          END;
        `);

        this.db.exec(`
          CREATE TRIGGER jobs_au AFTER UPDATE ON jobs BEGIN
            DELETE FROM jobs_fts WHERE rowid = old.id;
            INSERT INTO jobs_fts(rowid, job_id, title, company, location, description, industry)
            VALUES (new.id, new.job_id, new.title, new.company, new.location, new.description, new.industry);
          END;
        `);

        console.log('[DatabaseService] FTS5 setup complete');
      } else {
        console.log('[DatabaseService] FTS5 table already exists');
      }
    } catch (error) {
      console.error('[DatabaseService] Error setting up FTS5:', error);
      // Non-fatal error - continue without FTS5
    }
  }

  public getDatabase(): Database.Database {
    return this.db;
  }

  public close() {
    this.db.close();
  }

  /**
   * Delete a single job by job_id
   * @param jobId - The job_id to delete
   * @returns true if deleted, false if not found
   */
  public deleteJob(jobId: string): boolean {
    try {
      const stmt = this.db.prepare('DELETE FROM jobs WHERE job_id = ?');
      const result = stmt.run(jobId);
      return result.changes > 0;
    } catch (error) {
      console.error(`[DatabaseService] Error deleting job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Delete multiple jobs by job_ids in a transaction
   * @param jobIds - Array of job_ids to delete
   * @returns Object with count of deleted jobs and array of failed job_ids
   */
  public deleteBulk(jobIds: string[]): { deleted: number; failed: string[] } {
    const failed: string[] = [];
    let deleted = 0;

    try {
      // Use transaction for atomicity
      const deleteMany = this.db.transaction((ids: string[]) => {
        const stmt = this.db.prepare('DELETE FROM jobs WHERE job_id = ?');

        for (const jobId of ids) {
          try {
            const result = stmt.run(jobId);
            if (result.changes > 0) {
              deleted++;
            } else {
              failed.push(jobId);
            }
          } catch (error) {
            console.error(`[DatabaseService] Error deleting job ${jobId}:`, error);
            failed.push(jobId);
          }
        }
      });

      deleteMany(jobIds);

      return { deleted, failed };
    } catch (error) {
      console.error('[DatabaseService] Error in bulk delete transaction:', error);
      throw error;
    }
  }
}
