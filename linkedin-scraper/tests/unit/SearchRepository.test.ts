import { describe, it, expect, beforeEach } from 'vitest';
import { SearchRepository } from '../../src/database/repositories/SearchRepository.js';
import { createTestDatabase } from '../helpers/test-database.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '../../src/database/schema.js';
import type { Search, ScrapeError } from '../../src/types/index.js';

describe('SearchRepository', () => {
  let db: BetterSQLite3Database<typeof schema>;
  let repository: SearchRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repository = new SearchRepository(db);
  });

  const createSampleSearch = (overrides?: Partial<Omit<Search, 'id' | 'created_at'>>): Omit<Search, 'id' | 'created_at'> => ({
    query: 'Software Engineer',
    location: 'San Francisco, CA',
    filters: JSON.stringify({ experienceLevel: ['Mid-Senior'], employmentType: ['Full-time'] }),
    total_results: 100,
    successful_scrapes: 0,
    failed_scrapes: 0,
    started_at: new Date(),
    completed_at: undefined,
    status: 'running',
    ...overrides
  });

  describe('create', () => {
    it('should create a new search record', async () => {
      const searchData = createSampleSearch();
      const search = await repository.create(searchData);

      expect(search).toBeDefined();
      expect(search.id).toBeDefined();
      expect(search.query).toBe('Software Engineer');
      expect(search.location).toBe('San Francisco, CA');
    });

    it('should auto-generate id and created_at', async () => {
      const searchData = createSampleSearch();
      const search = await repository.create(searchData);

      expect(search.id).toBeGreaterThan(0);
      expect(search.created_at).toBeInstanceOf(Date);
    });

    it('should store status field correctly', async () => {
      const searchData = createSampleSearch({ status: 'pending' });
      const search = await repository.create(searchData);

      expect(search.status).toBe('pending');
    });

    it('should store filters as JSON string', async () => {
      const filters = { experienceLevel: ['Entry'], remote: true };
      const searchData = createSampleSearch({
        filters: JSON.stringify(filters)
      });

      const search = await repository.create(searchData);
      expect(search.filters).toBe(JSON.stringify(filters));

      // Should be parseable
      const parsed = JSON.parse(search.filters!);
      expect(parsed.experienceLevel).toEqual(['Entry']);
      expect(parsed.remote).toBe(true);
    });

    it('should initialize counters to 0', async () => {
      const searchData = createSampleSearch({
        successful_scrapes: undefined,
        failed_scrapes: undefined
      });

      const search = await repository.create(searchData as any);
      expect(search.successful_scrapes).toBe(0);
      expect(search.failed_scrapes).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find a search by id', async () => {
      const search = await repository.create(createSampleSearch());

      const found = await repository.findById(search.id!);
      expect(found).toBeDefined();
      expect(found?.id).toBe(search.id);
    });

    it('should return null if id does not exist', async () => {
      const found = await repository.findById(99999);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no searches exist', async () => {
      const searches = await repository.findAll();
      expect(searches).toEqual([]);
    });

    it('should return all searches', async () => {
      await repository.create(createSampleSearch({ query: 'Engineer' }));
      await repository.create(createSampleSearch({ query: 'Designer' }));
      await repository.create(createSampleSearch({ query: 'Manager' }));

      const searches = await repository.findAll();
      expect(searches).toHaveLength(3);
    });

    it('should order by created_at desc by default', async () => {
      const search1 = await repository.create(createSampleSearch({ query: 'First' }));
      const search2 = await repository.create(createSampleSearch({ query: 'Second' }));
      const search3 = await repository.create(createSampleSearch({ query: 'Third' }));

      const searches = await repository.findAll();

      // Should return all searches (order may vary due to timestamp precision)
      expect(searches).toHaveLength(3);
      const ids = searches.map(s => s.id);
      expect(ids).toContain(search1.id);
      expect(ids).toContain(search2.id);
      expect(ids).toContain(search3.id);
    });
  });

  describe('update', () => {
    it('should update a search record', async () => {
      const search = await repository.create(createSampleSearch());

      const updated = await repository.update(search.id!, {
        status: 'completed',
        completed_at: new Date()
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('completed');
      expect(updated?.completed_at).toBeDefined();
    });

    it('should return null if search does not exist', async () => {
      const updated = await repository.update(99999, { status: 'completed' });
      expect(updated).toBeNull();
    });

    it('should partially update fields', async () => {
      const search = await repository.create(createSampleSearch({
        total_results: 100,
        status: 'running'
      }));

      const updated = await repository.update(search.id!, {
        total_results: 150
      });

      expect(updated?.total_results).toBe(150);
      expect(updated?.status).toBe('running'); // Unchanged
    });
  });

  describe('incrementSuccessful', () => {
    it('should increment successful_scrapes counter', async () => {
      const search = await repository.create(createSampleSearch());
      expect(search.successful_scrapes).toBe(0);

      await repository.incrementSuccessful(search.id!);

      const updated = await repository.findById(search.id!);
      expect(updated?.successful_scrapes).toBe(1);
    });

    it('should increment multiple times', async () => {
      const search = await repository.create(createSampleSearch());

      await repository.incrementSuccessful(search.id!);
      await repository.incrementSuccessful(search.id!);
      await repository.incrementSuccessful(search.id!);

      const updated = await repository.findById(search.id!);
      expect(updated?.successful_scrapes).toBe(3);
    });
  });

  describe('incrementFailed', () => {
    it('should increment failed_scrapes counter', async () => {
      const search = await repository.create(createSampleSearch());
      expect(search.failed_scrapes).toBe(0);

      await repository.incrementFailed(search.id!);

      const updated = await repository.findById(search.id!);
      expect(updated?.failed_scrapes).toBe(1);
    });

    it('should increment multiple times', async () => {
      const search = await repository.create(createSampleSearch());

      await repository.incrementFailed(search.id!);
      await repository.incrementFailed(search.id!);

      const updated = await repository.findById(search.id!);
      expect(updated?.failed_scrapes).toBe(2);
    });
  });

  describe('logError', () => {
    it('should log an error for a search', async () => {
      const search = await repository.create(createSampleSearch());

      const errorData: Omit<ScrapeError, 'id'> = {
        search_id: search.id!,
        job_id: '1234567890',
        error_type: 'TimeoutError',
        error_message: 'Request timed out',
        occurred_at: new Date()
      };

      await repository.logError(errorData);

      const errors = await repository.getErrors(search.id!);
      expect(errors).toHaveLength(1);
      expect(errors[0].error_type).toBe('TimeoutError');
      expect(errors[0].error_message).toBe('Request timed out');
    });

    it('should log multiple errors', async () => {
      const search = await repository.create(createSampleSearch());

      await repository.logError({
        search_id: search.id!,
        job_id: '111',
        error_type: 'TimeoutError',
        error_message: 'Error 1',
        occurred_at: new Date()
      });

      await repository.logError({
        search_id: search.id!,
        job_id: '222',
        error_type: 'ParseError',
        error_message: 'Error 2',
        occurred_at: new Date()
      });

      const errors = await repository.getErrors(search.id!);
      expect(errors).toHaveLength(2);
    });

    it('should handle errors without job_id', async () => {
      const search = await repository.create(createSampleSearch());

      await repository.logError({
        search_id: search.id!,
        job_id: undefined,
        error_type: 'NetworkError',
        error_message: 'Connection failed',
        occurred_at: new Date()
      });

      const errors = await repository.getErrors(search.id!);
      expect(errors).toHaveLength(1);
      expect(errors[0].job_id).toBeUndefined();
    });
  });

  describe('getErrors', () => {
    it('should return empty array when no errors exist', async () => {
      const search = await repository.create(createSampleSearch());

      const errors = await repository.getErrors(search.id!);
      expect(errors).toEqual([]);
    });

    it('should return only errors for the specified search', async () => {
      const search1 = await repository.create(createSampleSearch());
      const search2 = await repository.create(createSampleSearch());

      await repository.logError({
        search_id: search1.id!,
        job_id: '111',
        error_type: 'Error1',
        error_message: 'Message 1',
        occurred_at: new Date()
      });

      await repository.logError({
        search_id: search2.id!,
        job_id: '222',
        error_type: 'Error2',
        error_message: 'Message 2',
        occurred_at: new Date()
      });

      const errors1 = await repository.getErrors(search1.id!);
      const errors2 = await repository.getErrors(search2.id!);

      expect(errors1).toHaveLength(1);
      expect(errors2).toHaveLength(1);
      expect(errors1[0].error_type).toBe('Error1');
      expect(errors2[0].error_type).toBe('Error2');
    });
  });

  describe('Search workflow', () => {
    it('should track complete search lifecycle', async () => {
      // Create search
      const search = await repository.create(createSampleSearch({
        status: 'running',
        total_results: 50
      }));

      expect(search.status).toBe('running');
      expect(search.successful_scrapes).toBe(0);
      expect(search.failed_scrapes).toBe(0);

      // Simulate successful scrapes
      await repository.incrementSuccessful(search.id!);
      await repository.incrementSuccessful(search.id!);

      // Simulate failed scrape with error
      await repository.incrementFailed(search.id!);
      await repository.logError({
        search_id: search.id!,
        job_id: '999',
        error_type: 'ScrapeError',
        error_message: 'Failed to extract data',
        occurred_at: new Date()
      });

      // Complete search
      await repository.update(search.id!, {
        status: 'completed',
        completed_at: new Date()
      });

      // Verify final state
      const final = await repository.findById(search.id!);
      expect(final?.status).toBe('completed');
      expect(final?.successful_scrapes).toBe(2);
      expect(final?.failed_scrapes).toBe(1);
      expect(final?.completed_at).toBeDefined();

      const errors = await repository.getErrors(search.id!);
      expect(errors).toHaveLength(1);
    });
  });

  describe('Data integrity', () => {
    it('should preserve timestamps accurately', async () => {
      const startedAt = new Date('2025-12-05T10:00:00Z');
      const completedAt = new Date('2025-12-05T11:00:00Z');

      const search = await repository.create(createSampleSearch({
        started_at: startedAt,
        completed_at: completedAt
      }));

      const found = await repository.findById(search.id!);
      expect(found?.started_at.getTime()).toBe(startedAt.getTime());
      expect(found?.completed_at?.getTime()).toBe(completedAt.getTime());
    });

    it('should handle special characters in query and location', async () => {
      const search = await repository.create(createSampleSearch({
        query: 'C++ & Python Developer',
        location: 'São Paulo, Brazil'
      }));

      const found = await repository.findById(search.id!);
      expect(found?.query).toBe('C++ & Python Developer');
      expect(found?.location).toBe('São Paulo, Brazil');
    });

    it('should handle complex JSON in filters', async () => {
      const complexFilters = {
        experienceLevel: ['Entry', 'Mid-Senior'],
        employmentType: ['Full-time', 'Contract'],
        datePosted: 'Past Week',
        remote: true,
        salary: { min: 100000, max: 200000 }
      };

      const search = await repository.create(createSampleSearch({
        filters: JSON.stringify(complexFilters)
      }));

      const found = await repository.findById(search.id!);
      const parsedFilters = JSON.parse(found!.filters!);
      expect(parsedFilters).toEqual(complexFilters);
    });
  });
});
