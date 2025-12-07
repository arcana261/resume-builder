import { describe, it, expect, beforeEach } from 'vitest';
import { JobRepository } from '../../src/database/repositories/JobRepository.js';
import { createTestDatabase } from '../helpers/test-database.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '../../src/database/schema.js';
import type { Job } from '../../src/types/index.js';

describe('JobRepository', () => {
  let db: BetterSQLite3Database<typeof schema>;
  let repository: JobRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repository = new JobRepository(db);
  });

  const createSampleJob = (overrides?: Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>>): Omit<Job, 'id' | 'created_at' | 'updated_at'> => ({
    job_id: '1234567890',
    title: 'Software Engineer',
    company: 'Test Company',
    company_id: 'test-company',
    location: 'San Francisco, CA',
    description: 'Test job description',
    employment_type: 'Full-time',
    seniority_level: 'Mid-Senior level',
    industry: 'Technology',
    salary_min: 100000,
    salary_max: 150000,
    salary_currency: 'USD',
    job_url: 'https://www.linkedin.com/jobs/view/1234567890',
    apply_url: 'https://www.linkedin.com/jobs/apply/1234567890',
    posted_at: new Date('2025-12-01'),
    scraped_at: new Date(),
    search_id: 1,
    raw_data: JSON.stringify({}),
    ...overrides
  });

  describe('create', () => {
    it('should create a new job record', async () => {
      const jobData = createSampleJob();
      const job = await repository.create(jobData);

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.title).toBe('Software Engineer');
      expect(job.company).toBe('Test Company');
    });

    it('should auto-generate id, created_at, and updated_at', async () => {
      const jobData = createSampleJob();
      const job = await repository.create(jobData);

      expect(job.id).toBeGreaterThan(0);
      expect(job.created_at).toBeInstanceOf(Date);
      expect(job.updated_at).toBeInstanceOf(Date);
    });

    it('should enforce unique job_id constraint', async () => {
      const jobData = createSampleJob();
      await repository.create(jobData);

      // Trying to create another job with the same job_id should fail
      await expect(repository.create(jobData)).rejects.toThrow();
    });

    it('should handle nullable fields correctly', async () => {
      const jobData = createSampleJob({
        company_id: undefined,
        description: undefined,
        employment_type: undefined,
        seniority_level: undefined,
        industry: undefined,
        salary_min: undefined,
        salary_max: undefined,
        salary_currency: undefined,
        apply_url: undefined
      });

      const job = await repository.create(jobData);
      expect(job).toBeDefined();
      expect(job.company_id).toBeNull();
      expect(job.description).toBeNull();
    });

    it('should store all required fields', async () => {
      const jobData = createSampleJob();
      const job = await repository.create(jobData);

      expect(job.job_id).toBe(jobData.job_id);
      expect(job.title).toBe(jobData.title);
      expect(job.company).toBe(jobData.company);
      expect(job.job_url).toBe(jobData.job_url);
    });

    it('should store salary information correctly', async () => {
      const jobData = createSampleJob({
        salary_min: 120000,
        salary_max: 180000,
        salary_currency: 'USD'
      });

      const job = await repository.create(jobData);
      expect(job.salary_min).toBe(120000);
      expect(job.salary_max).toBe(180000);
      expect(job.salary_currency).toBe('USD');
    });
  });

  describe('findByJobId', () => {
    it('should find a job by job_id', async () => {
      const jobData = createSampleJob({ job_id: '9876543210' });
      await repository.create(jobData);

      const found = await repository.findByJobId('9876543210');
      expect(found).toBeDefined();
      expect(found?.job_id).toBe('9876543210');
    });

    it('should return null if job_id does not exist', async () => {
      const found = await repository.findByJobId('nonexistent');
      expect(found).toBeNull();
    });

    it('should return the correct job when multiple jobs exist', async () => {
      await repository.create(createSampleJob({ job_id: '111' }));
      await repository.create(createSampleJob({ job_id: '222' }));
      await repository.create(createSampleJob({ job_id: '333' }));

      const found = await repository.findByJobId('222');
      expect(found?.job_id).toBe('222');
    });
  });

  describe('findById', () => {
    it('should find a job by id', async () => {
      const job = await repository.create(createSampleJob());

      const found = await repository.findById(job.id!);
      expect(found).toBeDefined();
      expect(found?.id).toBe(job.id);
    });

    it('should return null if id does not exist', async () => {
      const found = await repository.findById(99999);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no jobs exist', async () => {
      const jobs = await repository.findAll();
      expect(jobs).toEqual([]);
    });

    it('should return all jobs', async () => {
      await repository.create(createSampleJob({ job_id: '1' }));
      await repository.create(createSampleJob({ job_id: '2' }));
      await repository.create(createSampleJob({ job_id: '3' }));

      const jobs = await repository.findAll();
      expect(jobs).toHaveLength(3);
    });

    it('should respect limit parameter', async () => {
      await repository.create(createSampleJob({ job_id: '1' }));
      await repository.create(createSampleJob({ job_id: '2' }));
      await repository.create(createSampleJob({ job_id: '3' }));

      const jobs = await repository.findAll({ limit: 2 });
      expect(jobs).toHaveLength(2);
    });

    it('should filter by search_id', async () => {
      await repository.create(createSampleJob({ job_id: '1', search_id: 1 }));
      await repository.create(createSampleJob({ job_id: '2', search_id: 2 }));
      await repository.create(createSampleJob({ job_id: '3', search_id: 1 }));

      const jobs = await repository.findAll({ searchId: 1 });
      expect(jobs).toHaveLength(2);
      expect(jobs.every(j => j.search_id === 1)).toBe(true);
    });

    it('should filter by company', async () => {
      await repository.create(createSampleJob({ job_id: '1', company: 'Google' }));
      await repository.create(createSampleJob({ job_id: '2', company: 'Meta' }));
      await repository.create(createSampleJob({ job_id: '3', company: 'Google' }));

      const jobs = await repository.findAll({ company: 'Google' });
      expect(jobs).toHaveLength(2);
      expect(jobs.every(j => j.company === 'Google')).toBe(true);
    });

    it('should filter by location', async () => {
      await repository.create(createSampleJob({ job_id: '1', location: 'San Francisco' }));
      await repository.create(createSampleJob({ job_id: '2', location: 'New York' }));
      await repository.create(createSampleJob({ job_id: '3', location: 'San Francisco' }));

      const jobs = await repository.findAll({ location: 'San Francisco' });
      expect(jobs).toHaveLength(2);
      expect(jobs.every(j => j.location?.includes('San Francisco'))).toBe(true);
    });

    it('should filter by date range', async () => {
      const oldDate = new Date('2025-11-01');
      const recentDate = new Date('2025-12-01');

      await repository.create(createSampleJob({ job_id: '1', posted_at: oldDate }));
      await repository.create(createSampleJob({ job_id: '2', posted_at: recentDate }));

      const jobs = await repository.findAll({ dateFrom: new Date('2025-11-15') });
      expect(jobs).toHaveLength(1);
      expect(jobs[0].job_id).toBe('2');
    });

    it('should apply multiple filters simultaneously', async () => {
      await repository.create(createSampleJob({
        job_id: '1',
        company: 'Google',
        search_id: 1,
        location: 'San Francisco'
      }));
      await repository.create(createSampleJob({
        job_id: '2',
        company: 'Google',
        search_id: 2,
        location: 'San Francisco'
      }));
      await repository.create(createSampleJob({
        job_id: '3',
        company: 'Meta',
        search_id: 1,
        location: 'San Francisco'
      }));

      const jobs = await repository.findAll({
        company: 'Google',
        searchId: 1
      });
      expect(jobs).toHaveLength(1);
      expect(jobs[0].job_id).toBe('1');
    });
  });

  describe('update', () => {
    it('should update a job record', async () => {
      const job = await repository.create(createSampleJob());

      const updated = await repository.update(job.id!, {
        title: 'Senior Software Engineer'
      });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('Senior Software Engineer');
      expect(updated?.company).toBe('Test Company'); // Unchanged
    });

    it('should update updated_at timestamp', async () => {
      const job = await repository.create(createSampleJob());
      const originalUpdatedAt = job.updated_at;

      // Wait a tiny bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await repository.update(job.id!, {
        title: 'New Title'
      });

      expect(updated?.updated_at.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should return null if job does not exist', async () => {
      const updated = await repository.update(99999, { title: 'New Title' });
      expect(updated).toBeNull();
    });

    it('should partially update fields', async () => {
      const job = await repository.create(createSampleJob({
        salary_min: 100000,
        salary_max: 150000
      }));

      const updated = await repository.update(job.id!, {
        salary_min: 120000
      });

      expect(updated?.salary_min).toBe(120000);
      expect(updated?.salary_max).toBe(150000); // Unchanged
    });
  });

  describe('delete', () => {
    it('should delete a job record', async () => {
      const job = await repository.create(createSampleJob());

      await repository.delete(job.id!);

      const found = await repository.findById(job.id!);
      expect(found).toBeNull();
    });

    it('should not throw error if job does not exist', async () => {
      await expect(repository.delete(99999)).resolves.not.toThrow();
    });

    it('should only delete the specified job', async () => {
      const job1 = await repository.create(createSampleJob({ job_id: '1' }));
      const job2 = await repository.create(createSampleJob({ job_id: '2' }));

      await repository.delete(job1.id!);

      const found1 = await repository.findById(job1.id!);
      const found2 = await repository.findById(job2.id!);

      expect(found1).toBeNull();
      expect(found2).toBeDefined();
    });
  });

  describe('count', () => {
    it('should return 0 when no jobs exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });

    it('should return correct count', async () => {
      await repository.create(createSampleJob({ job_id: '1' }));
      await repository.create(createSampleJob({ job_id: '2' }));
      await repository.create(createSampleJob({ job_id: '3' }));

      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should filter count by search_id', async () => {
      await repository.create(createSampleJob({ job_id: '1', search_id: 1 }));
      await repository.create(createSampleJob({ job_id: '2', search_id: 2 }));
      await repository.create(createSampleJob({ job_id: '3', search_id: 1 }));

      const count = await repository.count({ searchId: 1 });
      expect(count).toBe(2);
    });
  });

  describe('Data integrity', () => {
    it('should preserve exact salary values', async () => {
      const jobData = createSampleJob({
        salary_min: 175000,
        salary_max: 225000
      });

      const job = await repository.create(jobData);
      const found = await repository.findById(job.id!);

      expect(found?.salary_min).toBe(175000);
      expect(found?.salary_max).toBe(225000);
    });

    it('should preserve timestamps accurately', async () => {
      const postedAt = new Date('2025-12-05T10:30:00Z');
      const jobData = createSampleJob({ posted_at: postedAt });

      const job = await repository.create(jobData);
      const found = await repository.findById(job.id!);

      expect(found?.posted_at.getTime()).toBe(postedAt.getTime());
    });

    it('should handle special characters in text fields', async () => {
      const jobData = createSampleJob({
        title: 'Software Engineer - C++ & Python (£100k+)',
        description: 'Looking for "rockstar" developer with 5+ years\' experience'
      });

      const job = await repository.create(jobData);
      const found = await repository.findById(job.id!);

      expect(found?.title).toBe(jobData.title);
      expect(found?.description).toBe(jobData.description);
    });
  });
});
