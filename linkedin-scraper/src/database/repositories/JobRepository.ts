import { eq, desc, and, gte, like } from 'drizzle-orm';
import { getDatabase } from '../db.js';
import { jobs } from '../schema.js';
import type { Job } from '../../types/index.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '../schema.js';

export class JobRepository {
  private db: BetterSQLite3Database<typeof schema>;

  constructor(db?: BetterSQLite3Database<typeof schema>) {
    this.db = (db || getDatabase()) as BetterSQLite3Database<typeof schema>;
  }

  async create(job: Omit<Job, 'id' | 'created_at' | 'updated_at'>): Promise<Job> {
    const result = this.db.insert(jobs).values({
      ...job,
      posted_at: job.posted_at,
      scraped_at: job.scraped_at
    }).returning().get();

    return this.mapToJob(result);
  }

  async findByJobId(jobId: string): Promise<Job | null> {
    const result = this.db.select().from(jobs).where(eq(jobs.job_id, jobId)).get();
    return result ? this.mapToJob(result) : null;
  }

  async findBySearchId(searchId: number, limit?: number): Promise<Job[]> {
    let query = this.db
      .select()
      .from(jobs)
      .where(eq(jobs.search_id, searchId))
      .orderBy(desc(jobs.posted_at));

    if (limit) {
      query = query.limit(limit) as any;
    }

    const results = query.all();
    return results.map(r => this.mapToJob(r));
  }

  async findById(id: number): Promise<Job | null> {
    const result = this.db.select().from(jobs).where(eq(jobs.id, id)).get();
    return result ? this.mapToJob(result) : null;
  }

  async findAll(filters?: {
    searchId?: number;
    company?: string;
    location?: string;
    dateFrom?: Date;
    limit?: number;
  }): Promise<Job[]> {
    let query = this.db.select().from(jobs);

    const conditions = [];
    if (filters?.searchId) {
      conditions.push(eq(jobs.search_id, filters.searchId));
    }
    if (filters?.company) {
      conditions.push(like(jobs.company, `%${filters.company}%`));
    }
    if (filters?.location) {
      conditions.push(like(jobs.location, `%${filters.location}%`));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(jobs.posted_at, filters.dateFrom));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(jobs.posted_at)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    const results = query.all();
    return results.map(r => this.mapToJob(r));
  }

  async update(id: number, updates: Partial<Omit<Job, 'id' | 'created_at'>>): Promise<Job | null> {
    const result = this.db
      .update(jobs)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(eq(jobs.id, id))
      .returning()
      .get();

    return result ? this.mapToJob(result) : null;
  }

  async delete(id: number): Promise<void> {
    this.db.delete(jobs).where(eq(jobs.id, id)).run();
  }

  async count(filters?: { searchId?: number }): Promise<number> {
    if (filters?.searchId) {
      const result = this.db
        .select()
        .from(jobs)
        .where(eq(jobs.search_id, filters.searchId))
        .all();
      return result.length;
    }

    const result = this.db.select().from(jobs).all();
    return result.length;
  }

  async deleteAll(): Promise<void> {
    this.db.delete(jobs).run();
  }

  private mapToJob(record: any): Job {
    return {
      ...record,
      posted_at: new Date(record.posted_at),
      scraped_at: new Date(record.scraped_at),
      created_at: record.created_at ? new Date(record.created_at) : undefined,
      updated_at: record.updated_at ? new Date(record.updated_at) : undefined
    };
  }
}
