import { describe, it, expect } from 'vitest';
import { jobs, searches, scrape_errors } from '../../src/database/schema.js';

describe('Database Schema', () => {
  describe('Table Exports', () => {
    it('should export jobs table as Drizzle table object', () => {
      expect(jobs).toBeDefined();
      expect(typeof jobs).toBe('object');
      // Drizzle tables have special structure with Symbol properties
      expect(jobs).toHaveProperty('id');
      expect(jobs).toHaveProperty('job_id');
      expect(jobs).toHaveProperty('title');
      expect(jobs).toHaveProperty('company');
      expect(jobs).toHaveProperty('location');
      expect(jobs).toHaveProperty('description');
      expect(jobs).toHaveProperty('posted_at');
      expect(jobs).toHaveProperty('scraped_at');
    });

    it('should export searches table as Drizzle table object', () => {
      expect(searches).toBeDefined();
      expect(typeof searches).toBe('object');
      expect(searches).toHaveProperty('id');
      expect(searches).toHaveProperty('query');
      expect(searches).toHaveProperty('location');
      expect(searches).toHaveProperty('status');
      expect(searches).toHaveProperty('started_at');
    });

    it('should export scrape_errors table as Drizzle table object', () => {
      expect(scrape_errors).toBeDefined();
      expect(typeof scrape_errors).toBe('object');
      expect(scrape_errors).toHaveProperty('id');
      expect(scrape_errors).toHaveProperty('search_id');
      expect(scrape_errors).toHaveProperty('error_type');
      expect(scrape_errors).toHaveProperty('error_message');
      expect(scrape_errors).toHaveProperty('occurred_at');
    });
  });

  describe('Column Accessibility', () => {
    it('should allow accessing jobs table columns', () => {
      // Verify we can access column definitions
      expect(jobs.id).toBeDefined();
      expect(jobs.job_id).toBeDefined();
      expect(jobs.title).toBeDefined();
      expect(jobs.company).toBeDefined();
      expect(jobs.company_id).toBeDefined();
      expect(jobs.location).toBeDefined();
      expect(jobs.description).toBeDefined();
      expect(jobs.employment_type).toBeDefined();
      expect(jobs.seniority_level).toBeDefined();
      expect(jobs.industry).toBeDefined();
      expect(jobs.salary_min).toBeDefined();
      expect(jobs.salary_max).toBeDefined();
      expect(jobs.salary_currency).toBeDefined();
      expect(jobs.job_url).toBeDefined();
      expect(jobs.apply_url).toBeDefined();
      expect(jobs.posted_at).toBeDefined();
      expect(jobs.scraped_at).toBeDefined();
      expect(jobs.search_id).toBeDefined();
      expect(jobs.raw_data).toBeDefined();
      expect(jobs.page_html).toBeDefined();
      expect(jobs.created_at).toBeDefined();
      expect(jobs.updated_at).toBeDefined();
    });

    it('should allow accessing searches table columns', () => {
      expect(searches.id).toBeDefined();
      expect(searches.query).toBeDefined();
      expect(searches.location).toBeDefined();
      expect(searches.filters).toBeDefined();
      expect(searches.total_results).toBeDefined();
      expect(searches.successful_scrapes).toBeDefined();
      expect(searches.failed_scrapes).toBeDefined();
      expect(searches.started_at).toBeDefined();
      expect(searches.completed_at).toBeDefined();
      expect(searches.status).toBeDefined();
      expect(searches.created_at).toBeDefined();
    });

    it('should allow accessing scrape_errors table columns', () => {
      expect(scrape_errors.id).toBeDefined();
      expect(scrape_errors.search_id).toBeDefined();
      expect(scrape_errors.job_id).toBeDefined();
      expect(scrape_errors.error_type).toBeDefined();
      expect(scrape_errors.error_message).toBeDefined();
      expect(scrape_errors.url).toBeDefined();
      expect(scrape_errors.occurred_at).toBeDefined();
    });
  });
});
