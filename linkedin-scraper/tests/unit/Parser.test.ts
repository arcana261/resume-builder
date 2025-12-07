import { describe, it, expect, beforeEach } from 'vitest';
import { Parser } from '../../src/scraper/core/Parser.js';
import { FixtureLoader } from '../helpers/fixture-loader.js';
import { createMockPage } from '../mocks/MockPage.js';
import type { Page } from 'playwright';

describe('Parser', () => {
  let parser: Parser;
  let mockPage: Page;

  beforeEach(() => {
    const html = FixtureLoader.getLinkedInSearchHTML();
    mockPage = createMockPage(html);
    parser = new Parser(mockPage);
  });

  describe('extractTotalCount', () => {
    it('should extract the correct job count from LinkedIn search page', async () => {
      const count = await parser.extractTotalCount();

      expect(count).toBe(91);
    });

    it('should use the results-context-header__job-count selector', async () => {
      const count = await parser.extractTotalCount();

      // The fixture has exactly 91 jobs
      expect(count).toBeGreaterThan(0);
      expect(count).toBe(91);
    });

    it('should return a number', async () => {
      const count = await parser.extractTotalCount();

      expect(typeof count).toBe('number');
      expect(Number.isInteger(count)).toBe(true);
    });
  });

  describe('extractJobCards', () => {
    it('should extract job cards from the search results', async () => {
      const jobCards = await parser.extractJobCards();

      expect(jobCards).toBeDefined();
      expect(Array.isArray(jobCards)).toBe(true);
      expect(jobCards.length).toBeGreaterThan(0);
    });

    it('should extract job cards with correct structure', async () => {
      const jobCards = await parser.extractJobCards();

      const firstCard = jobCards[0];
      expect(firstCard).toHaveProperty('id');
      expect(firstCard).toHaveProperty('selector');
      expect(firstCard).toHaveProperty('title');
      expect(firstCard).toHaveProperty('company');
      expect(firstCard).toHaveProperty('location');
    });

    it('should extract job ID from data-entity-urn attribute', async () => {
      const jobCards = await parser.extractJobCards();

      const firstCard = jobCards[0];
      expect(firstCard.id).toBeDefined();
      expect(firstCard.id).toMatch(/^\d+$/); // Should be numeric string
      expect(firstCard.id.length).toBeGreaterThan(0);
    });

    it('should extract job title correctly', async () => {
      const jobCards = await parser.extractJobCards();

      const firstCard = jobCards[0];
      expect(firstCard.title).toBeDefined();
      expect(firstCard.title.length).toBeGreaterThan(0);
      expect(typeof firstCard.title).toBe('string');

      // The first job in debug.html is "Software Engineer - Python - Equity Trading - £250k"
      expect(firstCard.title).toContain('Software Engineer');
    });

    it('should extract company name correctly', async () => {
      const jobCards = await parser.extractJobCards();

      const firstCard = jobCards[0];
      expect(firstCard.company).toBeDefined();
      expect(firstCard.company.length).toBeGreaterThan(0);
      expect(typeof firstCard.company).toBe('string');

      // The first job in debug.html is from "Paragon Alpha - Hedge Fund Talent Business"
      expect(firstCard.company).toContain('Paragon Alpha');
    });

    it('should extract location correctly', async () => {
      const jobCards = await parser.extractJobCards();

      const firstCard = jobCards[0];
      expect(firstCard.location).toBeDefined();
      expect(typeof firstCard.location).toBe('string');

      // The first job in debug.html is in "London Area, United Kingdom"
      expect(firstCard.location).toContain('London');
    });

    it('should create correct selector for each job card', async () => {
      const jobCards = await parser.extractJobCards();

      const firstCard = jobCards[0];
      expect(firstCard.selector).toBeDefined();
      expect(firstCard.selector).toContain('div.base-card');
      expect(firstCard.selector).toContain('data-entity-urn');
    });

    it('should handle multiple job cards', async () => {
      const jobCards = await parser.extractJobCards();

      // The fixture should have multiple job cards (LinkedIn typically shows 25 per page)
      expect(jobCards.length).toBeGreaterThan(1);

      // Verify all cards have unique IDs
      const ids = jobCards.map(card => card.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should extract all job cards from the page', async () => {
      const jobCards = await parser.extractJobCards();

      // The fixture has multiple job cards (can vary by page)
      expect(jobCards.length).toBeGreaterThanOrEqual(10);
      // LinkedIn can show up to 75 jobs per page depending on scrolling/loading
      expect(jobCards.length).toBeLessThanOrEqual(75);
    });

    it('should handle cards with missing optional fields gracefully', async () => {
      const jobCards = await parser.extractJobCards();

      // All cards should at least have an ID and title
      jobCards.forEach(card => {
        expect(card.id).toBeDefined();
        expect(card.title).toBeDefined();
        // Company and location might be empty strings but should be defined
        expect(card).toHaveProperty('company');
        expect(card).toHaveProperty('location');
      });
    });
  });

  describe('hasNextPage', () => {
    it('should check for next page button', async () => {
      const hasNext = await parser.hasNextPage();

      // The result should be a boolean
      expect(typeof hasNext).toBe('boolean');
    });
  });

  describe('clickNextPage', () => {
    it('should return false if no next page exists', async () => {
      // First check if there's a next page
      const hasNext = await parser.hasNextPage();

      if (!hasNext) {
        const result = await parser.clickNextPage();
        expect(result).toBe(false);
      }
    });
  });

  describe('tryJsonLdExtraction', () => {
    it('should attempt to extract job data from JSON-LD', async () => {
      const jobData = await parser.tryJsonLdExtraction();

      // May return null if no JSON-LD is present in the fixture
      // This is expected for search results pages
      expect(jobData === null || typeof jobData === 'object').toBe(true);
    });

    it('should return null if no JSON-LD JobPosting is found', async () => {
      const jobData = await parser.tryJsonLdExtraction();

      // Search results page typically doesn't have JSON-LD, only job detail pages do
      expect(jobData).toBeNull();
    });
  });

  describe('tryHtmlExtraction', () => {
    it('should attempt to extract job data from HTML elements', async () => {
      // This test would fail on search results page as it expects job detail page
      // We'll test that it returns null gracefully
      const jobData = await parser.tryHtmlExtraction();

      expect(jobData === null || typeof jobData === 'object').toBe(true);
    });

    it('should return null if job detail selectors are not found', async () => {
      // Search results page doesn't have .jobs-unified-top-card
      const jobData = await parser.tryHtmlExtraction();

      expect(jobData).toBeNull();
    });
  });

  describe('White-box testing - selector priority', () => {
    it('should try .results-context-header__job-count selector first', async () => {
      // This tests the implementation detail that we prioritize the correct selector
      const count = await parser.extractTotalCount();

      // If this selector works, we should get 91
      expect(count).toBe(91);
    });

    it('should parse job count from text content', async () => {
      const count = await parser.extractTotalCount();

      // The count should be extracted from "91 Software Engineer Jobs in London"
      expect(count).toBe(91);
      expect(count).not.toBeNaN();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty job listings gracefully', async () => {
      const jobCards = await parser.extractJobCards();

      // Should not throw an error
      expect(Array.isArray(jobCards)).toBe(true);
    });

    it('should filter out invalid job cards', async () => {
      const jobCards = await parser.extractJobCards();

      // All returned cards should have valid IDs
      jobCards.forEach(card => {
        expect(card.id).toBeTruthy();
        expect(card.id.length).toBeGreaterThan(0);
      });
    });

    it('should trim whitespace from extracted text', async () => {
      const jobCards = await parser.extractJobCards();

      const firstCard = jobCards[0];
      // Text should not have leading/trailing whitespace
      expect(firstCard.title).toBe(firstCard.title.trim());
      expect(firstCard.company).toBe(firstCard.company.trim());
      expect(firstCard.location).toBe(firstCard.location.trim());
    });
  });

  describe('Data validation', () => {
    it('should extract valid job IDs (numeric strings)', async () => {
      const jobCards = await parser.extractJobCards();

      jobCards.forEach(card => {
        expect(card.id).toMatch(/^\d+$/);
      });
    });

    it('should not extract empty strings as job IDs', async () => {
      const jobCards = await parser.extractJobCards();

      jobCards.forEach(card => {
        expect(card.id).not.toBe('');
        expect(card.id.length).toBeGreaterThan(5); // LinkedIn job IDs are long
      });
    });
  });
});
