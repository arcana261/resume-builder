import { describe, it, expect, beforeEach } from 'vitest';
import { JobRepository } from '../../src/database/repositories/JobRepository.js';
import { createTestDatabase } from '../helpers/test-database.js';
import type { Job } from '../../src/types/index.js';

describe('Data-Driven Tests (Based on Real Database Patterns)', () => {
  let repository: JobRepository;

  beforeEach(() => {
    const db = createTestDatabase();
    repository = new JobRepository(db);
  });

  describe('Multi-currency salary handling', () => {
    it('should store and retrieve USD salary correctly', async () => {
      const job = await repository.create({
        job_id: 'sony-job',
        title: 'Software Engineer',
        company: 'Sony Interactive Entertainment',
        location: 'San Francisco, CA',
        description: 'Test description',
        job_url: 'https://linkedin.com/jobs/test',
        posted_at: new Date('2025-12-13'),
        scraped_at: new Date(),
        salary_min: 157300,
        salary_max: 187600,
        salary_currency: 'USD'
      });

      expect(job.salary_min).toBe(157300);
      expect(job.salary_max).toBe(187600);
      expect(job.salary_currency).toBe('USD');
    });

    it('should store and retrieve GBP salary correctly', async () => {
      const job = await repository.create({
        job_id: 'opensource-job',
        title: 'Software Engineer',
        company: 'OpenSource',
        location: 'London Area, United Kingdom',
        description: 'Test description',
        job_url: 'https://linkedin.com/jobs/test',
        posted_at: new Date('2025-12-13'),
        scraped_at: new Date(),
        salary_min: 55000,
        salary_max: 90000,
        salary_currency: 'GBP'
      });

      expect(job.salary_min).toBe(55000);
      expect(job.salary_max).toBe(90000);
      expect(job.salary_currency).toBe('GBP');
    });

    it('should handle low hourly-rate salaries (real database example)', async () => {
      // Real database example: Warner Music Group - $20-$25/hour
      const job = await repository.create({
        job_id: 'warner-job',
        title: 'Executive Assistant, A&R',
        company: 'Warner Music Group',
        location: 'Los Angeles, CA',
        description: 'Test description',
        job_url: 'https://linkedin.com/jobs/test',
        posted_at: new Date('2025-12-13'),
        scraped_at: new Date(),
        salary_min: 20,
        salary_max: 25,
        salary_currency: 'USD'
      });

      expect(job.salary_min).toBe(20);
      expect(job.salary_max).toBe(25);
      expect(job.salary_currency).toBe('USD');
    });

    it('should correctly compare jobs with different currencies', async () => {
      const usdJob = await repository.create({
        job_id: 'usd-1',
        title: 'Engineer USD',
        company: 'Company A',
        location: 'San Francisco',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/1',
        posted_at: new Date(),
        scraped_at: new Date(),
        salary_min: 100000,
        salary_currency: 'USD'
      });

      const gbpJob = await repository.create({
        job_id: 'gbp-1',
        title: 'Engineer GBP',
        company: 'Company B',
        location: 'London',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/2',
        posted_at: new Date(),
        scraped_at: new Date(),
        salary_min: 75000,
        salary_currency: 'GBP'
      });

      const jobs = await repository.findAll();
      expect(jobs).toHaveLength(2);

      const currencies = jobs.map(j => j.salary_currency);
      expect(currencies).toContain('USD');
      expect(currencies).toContain('GBP');
    });
  });

  describe('Location handling with special characters', () => {
    it('should store and retrieve Japanese characters in location', async () => {
      // Real database example: Warner Music Group job with Japanese location
      const job = await repository.create({
        job_id: 'japanese-location',
        title: 'Executive Assistant',
        company: 'Warner Music Group',
        location: 'ロサンゼルス', // Los Angeles in Japanese
        description: 'Test description',
        job_url: 'https://linkedin.com/jobs/test',
        posted_at: new Date(),
        scraped_at: new Date()
      });

      expect(job.location).toBe('ロサンゼルス');

      const found = await repository.findByJobId('japanese-location');
      expect(found?.location).toBe('ロサンゼルス');
    });

    it('should filter jobs by location with special characters', async () => {
      await repository.create({
        job_id: 'jp-1',
        title: 'Job 1',
        company: 'Company',
        location: 'ロサンゼルス',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/1',
        posted_at: new Date(),
        scraped_at: new Date()
      });

      await repository.create({
        job_id: 'us-1',
        title: 'Job 2',
        company: 'Company',
        location: 'Los Angeles',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/2',
        posted_at: new Date(),
        scraped_at: new Date()
      });

      const jobs = await repository.findAll({ location: 'ロサンゼルス' });
      expect(jobs).toHaveLength(1);
      expect(jobs[0].location).toBe('ロサンゼルス');
    });

    it('should handle "London Area" vs "London" correctly', async () => {
      // Real database has both "London Area" and "London"
      await repository.create({
        job_id: 'london-area-1',
        title: 'Job 1',
        company: 'Company',
        location: 'London Area, United Kingdom',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/1',
        posted_at: new Date(),
        scraped_at: new Date()
      });

      await repository.create({
        job_id: 'london-2',
        title: 'Job 2',
        company: 'Company',
        location: 'London, England, United Kingdom',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/2',
        posted_at: new Date(),
        scraped_at: new Date()
      });

      // Filter by "London" should return both
      const londonJobs = await repository.findAll({ location: 'London' });
      expect(londonJobs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('NULL seniority_level handling', () => {
    it('should handle jobs without seniority_level (real database pattern)', async () => {
      // Real database: All 12 jobs have NULL seniority_level
      const job = await repository.create({
        job_id: 'no-seniority',
        title: 'Software Engineer',
        company: 'Company',
        location: 'San Francisco',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/test',
        posted_at: new Date(),
        scraped_at: new Date(),
        seniority_level: undefined
      });

      expect(job.seniority_level).toBeNull();

      const found = await repository.findByJobId('no-seniority');
      expect(found?.seniority_level).toBeNull();
    });

    it('should filter jobs correctly when seniority_level is NULL', async () => {
      await repository.create({
        job_id: 'job-1',
        title: 'Engineer',
        company: 'Company',
        location: 'SF',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/1',
        posted_at: new Date(),
        scraped_at: new Date(),
        seniority_level: undefined
      });

      await repository.create({
        job_id: 'job-2',
        title: 'Senior Engineer',
        company: 'Company',
        location: 'SF',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/2',
        posted_at: new Date(),
        scraped_at: new Date(),
        seniority_level: 'Senior level'
      });

      const allJobs = await repository.findAll();
      expect(allJobs).toHaveLength(2);

      // Both should be retrievable
      const nullSeniorityJobs = allJobs.filter(j => !j.seniority_level);
      expect(nullSeniorityJobs).toHaveLength(1);

      const withSeniorityJobs = allJobs.filter(j => j.seniority_level);
      expect(withSeniorityJobs).toHaveLength(1);
    });
  });

  describe('posted_at vs scraped_at distinction', () => {
    it('should maintain distinct posted_at and scraped_at timestamps', async () => {
      // Real database pattern: newer jobs have different posted_at vs scraped_at
      const postedDate = new Date('2025-12-13T01:56:19.000Z');
      const scrapedDate = new Date('2025-12-13T22:19:47.000Z');

      const job = await repository.create({
        job_id: 'distinct-timestamps',
        title: 'Software Engineer',
        company: 'Company',
        location: 'London',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/test',
        posted_at: postedDate,
        scraped_at: scrapedDate
      });

      expect(job.posted_at.getTime()).toBe(postedDate.getTime());
      expect(job.scraped_at.getTime()).toBe(scrapedDate.getTime());
      expect(job.posted_at.getTime()).not.toBe(job.scraped_at.getTime());
      expect(job.posted_at.getTime()).toBeLessThan(job.scraped_at.getTime());
    });

    it('should preserve timestamp precision when retrieving', async () => {
      const postedDate = new Date('2025-12-12T21:43:37.000Z');
      const scrapedDate = new Date('2025-12-13T19:46:56.000Z');

      await repository.create({
        job_id: 'timestamp-precision',
        title: 'Engineer',
        company: 'Company',
        location: 'SF',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/test',
        posted_at: postedDate,
        scraped_at: scrapedDate
      });

      const found = await repository.findByJobId('timestamp-precision');
      expect(found?.posted_at.getTime()).toBe(postedDate.getTime());
      expect(found?.scraped_at.getTime()).toBe(scrapedDate.getTime());
    });

    it('should filter by posted_at date correctly', async () => {
      const oldDate = new Date('2025-11-13T00:00:00.000Z');
      const recentDate = new Date('2025-12-13T00:00:00.000Z');

      await repository.create({
        job_id: 'old-job',
        title: 'Old Job',
        company: 'Company',
        location: 'SF',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/1',
        posted_at: oldDate,
        scraped_at: new Date()
      });

      await repository.create({
        job_id: 'recent-job',
        title: 'Recent Job',
        company: 'Company',
        location: 'SF',
        description: 'Test',
        job_url: 'https://linkedin.com/jobs/2',
        posted_at: recentDate,
        scraped_at: new Date()
      });

      const cutoffDate = new Date('2025-12-01T00:00:00.000Z');
      const recentJobs = await repository.findAll({ dateFrom: cutoffDate });

      expect(recentJobs).toHaveLength(1);
      expect(recentJobs[0].job_id).toBe('recent-job');
    });
  });

  describe('Field completeness validation', () => {
    it('should verify critical fields are always present (real database pattern)', async () => {
      // Real database: 100% completeness for description, location, industry, page_html, raw_data
      const job = await repository.create({
        job_id: 'complete-job',
        title: 'Software Engineer',
        company: 'Sony Interactive Entertainment',
        location: 'San Francisco, CA',
        description: 'Complete job description with all details',
        industry: 'Computer Games',
        job_url: 'https://linkedin.com/jobs/test',
        posted_at: new Date(),
        scraped_at: new Date(),
        page_html: '<html><body>Full LinkedIn page HTML</body></html>',
        raw_data: JSON.stringify({ source: 'linkedin', complete: true })
      });

      // Verify all critical fields are present
      expect(job.description).toBeDefined();
      expect(job.description).not.toBe('');
      expect(job.location).toBeDefined();
      expect(job.location).not.toBe('');
      expect(job.industry).toBeDefined();
      expect(job.industry).not.toBe('');
      expect(job.page_html).toBeDefined();
      expect(job.page_html).not.toBe('');
      expect(job.raw_data).toBeDefined();
      expect(job.raw_data).not.toBe('');
    });

    it('should handle optional fields being undefined', async () => {
      const job = await repository.create({
        job_id: 'minimal-job',
        title: 'Engineer',
        company: 'Company',
        location: 'SF',
        description: 'Description',
        job_url: 'https://linkedin.com/jobs/test',
        posted_at: new Date(),
        scraped_at: new Date(),
        // Optional fields omitted
        company_id: undefined,
        employment_type: undefined,
        seniority_level: undefined,
        industry: undefined,
        salary_min: undefined,
        salary_max: undefined,
        salary_currency: undefined,
        apply_url: undefined,
        raw_data: undefined,
        page_html: undefined
      });

      expect(job.job_id).toBe('minimal-job');
      expect(job.company_id).toBeNull();
      expect(job.employment_type).toBeNull();
      expect(job.seniority_level).toBeNull();
    });
  });

  describe('Real database company patterns', () => {
    it('should store jobs from various real companies', async () => {
      const companies = [
        'Sony Interactive Entertainment',
        'OpenSource',
        'Warner Music Group',
        'Revolut',
        'LSEG (London Stock Exchange Group)'
      ];

      for (let i = 0; i < companies.length; i++) {
        await repository.create({
          job_id: `company-${i}`,
          title: 'Software Engineer',
          company: companies[i],
          location: 'Various',
          description: 'Test',
          job_url: `https://linkedin.com/jobs/${i}`,
          posted_at: new Date(),
          scraped_at: new Date()
        });
      }

      const allJobs = await repository.findAll();
      expect(allJobs).toHaveLength(companies.length);

      const storedCompanies = allJobs.map(j => j.company);
      for (const company of companies) {
        expect(storedCompanies).toContain(company);
      }
    });
  });
});
