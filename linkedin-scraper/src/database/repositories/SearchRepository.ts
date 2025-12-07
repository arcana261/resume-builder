import { eq, desc } from 'drizzle-orm';
import { getDatabase } from '../db.js';
import { searches, scrape_errors } from '../schema.js';
import type { Search, ScrapeError } from '../../types/index.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '../schema.js';

export class SearchRepository {
  private db: BetterSQLite3Database<typeof schema>;

  constructor(db?: BetterSQLite3Database<typeof schema>) {
    this.db = (db || getDatabase()) as BetterSQLite3Database<typeof schema>;
  }

  async create(search: Omit<Search, 'id' | 'created_at'>): Promise<Search> {
    const result = this.db.insert(searches).values({
      ...search,
      started_at: search.started_at,
      completed_at: search.completed_at || null
    }).returning().get();

    return this.mapToSearch(result);
  }

  async findById(id: number): Promise<Search | null> {
    const result = this.db.select().from(searches).where(eq(searches.id, id)).get();
    return result ? this.mapToSearch(result) : null;
  }

  async findAll(limit?: number): Promise<Search[]> {
    let query = this.db.select().from(searches).orderBy(desc(searches.created_at));

    if (limit) {
      query = query.limit(limit) as any;
    }

    const results = query.all();
    return results.map(r => this.mapToSearch(r));
  }

  async update(id: number, updates: Partial<Omit<Search, 'id' | 'created_at'>>): Promise<Search | null> {
    const updateData: any = { ...updates };

    if (updates.started_at) {
      updateData.started_at = updates.started_at;
    }
    if (updates.completed_at) {
      updateData.completed_at = updates.completed_at;
    }

    const result = this.db
      .update(searches)
      .set(updateData)
      .where(eq(searches.id, id))
      .returning()
      .get();

    return result ? this.mapToSearch(result) : null;
  }

  async incrementSuccessful(id: number): Promise<void> {
    const current = await this.findById(id);
    if (current) {
      await this.update(id, {
        successful_scrapes: current.successful_scrapes + 1
      });
    }
  }

  async incrementFailed(id: number): Promise<void> {
    const current = await this.findById(id);
    if (current) {
      await this.update(id, {
        failed_scrapes: current.failed_scrapes + 1
      });
    }
  }

  async logError(error: Omit<ScrapeError, 'id'>): Promise<void> {
    this.db.insert(scrape_errors).values({
      search_id: error.search_id,
      job_id: error.job_id || null,
      error_type: error.error_type,
      error_message: error.error_message,
      occurred_at: error.occurred_at
    }).run();
  }

  async getErrors(searchId: number): Promise<ScrapeError[]> {
    const results = this.db
      .select()
      .from(scrape_errors)
      .where(eq(scrape_errors.search_id, searchId))
      .all();

    return results.map(r => ({
      id: r.id,
      search_id: r.search_id,
      job_id: r.job_id || undefined,
      error_type: r.error_type,
      error_message: r.error_message,
      occurred_at: new Date(r.occurred_at)
    }));
  }

  async deleteAll(): Promise<void> {
    this.db.delete(scrape_errors).run();
    this.db.delete(searches).run();
  }

  private mapToSearch(record: any): Search {
    return {
      ...record,
      started_at: new Date(record.started_at),
      completed_at: record.completed_at ? new Date(record.completed_at) : undefined,
      created_at: record.created_at ? new Date(record.created_at) : undefined
    };
  }
}
