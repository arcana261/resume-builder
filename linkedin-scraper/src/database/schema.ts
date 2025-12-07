import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  job_id: text('job_id').notNull().unique(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  company_id: text('company_id'),
  location: text('location').notNull(),
  description: text('description').notNull(),
  employment_type: text('employment_type'),
  seniority_level: text('seniority_level'),
  industry: text('industry'),
  salary_min: real('salary_min'),
  salary_max: real('salary_max'),
  salary_currency: text('salary_currency'),
  job_url: text('job_url').notNull(),
  apply_url: text('apply_url'),
  posted_at: integer('posted_at', { mode: 'timestamp' }).notNull(),
  scraped_at: integer('scraped_at', { mode: 'timestamp' }).notNull(),
  search_id: integer('search_id').notNull().references(() => searches.id),
  raw_data: text('raw_data').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});

export const searches = sqliteTable('searches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  query: text('query').notNull(),
  location: text('location').notNull(),
  filters: text('filters').notNull(),
  total_results: integer('total_results').notNull().default(0),
  successful_scrapes: integer('successful_scrapes').notNull().default(0),
  failed_scrapes: integer('failed_scrapes').notNull().default(0),
  started_at: integer('started_at', { mode: 'timestamp' }).notNull(),
  completed_at: integer('completed_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('running'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull()
});

export const scrape_errors = sqliteTable('scrape_errors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  search_id: integer('search_id').notNull().references(() => searches.id),
  job_id: text('job_id'),
  error_type: text('error_type').notNull(),
  error_message: text('error_message').notNull(),
  url: text('url'),
  occurred_at: integer('occurred_at', { mode: 'timestamp' }).notNull()
});
