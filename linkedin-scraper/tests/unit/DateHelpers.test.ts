import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { parsePostedDate, normalizeDate, formatDateForDisplay } from '../../src/utils/dateHelpers.js';

describe('DateHelpers', () => {
  describe('parsePostedDate', () => {
    beforeEach(() => {
      // Mock Date.now() to ensure consistent test results
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-14T12:00:00.000Z'));
    });

    describe('ISO date string parsing', () => {
      it('should parse ISO 8601 date strings from LinkedIn JSON-LD', () => {
        const isoDate = '2025-12-09T14:25:55.000Z';
        const result = parsePostedDate(isoDate);

        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString()).toBe('2025-12-09T14:25:55.000Z');
      });

      it('should parse date strings without milliseconds', () => {
        const result = parsePostedDate('2025-12-13T01:56:19Z');

        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2025);
        expect(result.getMonth()).toBe(11); // December
        expect(result.getDate()).toBe(13);
      });

      it('should handle ISO dates with timezone offset', () => {
        const result = parsePostedDate('2025-12-12T21:43:37+00:00');

        expect(result).toBeInstanceOf(Date);
        expect(result.getUTCHours()).toBe(21);
        expect(result.getUTCMinutes()).toBe(43);
      });
    });

    describe('Relative date parsing', () => {
      it('should parse "2 hours ago"', () => {
        const result = parsePostedDate('2 hours ago');
        const expected = new Date('2025-12-14T10:00:00.000Z');

        expect(result.getTime()).toBe(expected.getTime());
      });

      it('should parse "3 days ago"', () => {
        const result = parsePostedDate('3 days ago');
        const expected = new Date('2025-12-11T12:00:00.000Z');

        expect(result.getTime()).toBe(expected.getTime());
      });

      it('should parse "1 week ago"', () => {
        const result = parsePostedDate('1 week ago');
        const expected = new Date('2025-12-07T12:00:00.000Z');

        expect(result.getTime()).toBe(expected.getTime());
      });

      it('should parse "2 weeks ago"', () => {
        const result = parsePostedDate('2 weeks ago');
        const expected = new Date('2025-11-30T12:00:00.000Z');

        expect(result.getTime()).toBe(expected.getTime());
      });

      it('should parse "1 month ago"', () => {
        const result = parsePostedDate('1 month ago');
        const expected = new Date('2025-11-14T12:00:00.000Z');

        expect(result.getTime()).toBe(expected.getTime());
      });

      it('should handle "just now"', () => {
        const result = parsePostedDate('just now');
        const expected = new Date('2025-12-14T12:00:00.000Z');

        expect(result.getTime()).toBe(expected.getTime());
      });

      it('should handle "today"', () => {
        const result = parsePostedDate('today');
        const expected = new Date('2025-12-14T12:00:00.000Z');

        expect(result.getTime()).toBe(expected.getTime());
      });
    });

    describe('Edge cases and fallbacks', () => {
      it('should default to current date for unparseable strings', () => {
        const result = parsePostedDate('invalid date string');
        const expected = new Date('2025-12-14T12:00:00.000Z');

        expect(result.getTime()).toBe(expected.getTime());
      });

      it('should handle empty strings', () => {
        const result = parsePostedDate('');
        const expected = new Date('2025-12-14T12:00:00.000Z');

        expect(result.getTime()).toBe(expected.getTime());
      });

      it('should handle whitespace-only strings', () => {
        const result = parsePostedDate('   ');
        const expected = new Date('2025-12-14T12:00:00.000Z');

        expect(result.getTime()).toBe(expected.getTime());
      });

      it('should be case-insensitive for relative dates', () => {
        const result = parsePostedDate('2 DAYS AGO');
        const expected = new Date('2025-12-12T12:00:00.000Z');

        expect(result.getTime()).toBe(expected.getTime());
      });
    });

    describe('Real-world LinkedIn patterns', () => {
      it('should parse LinkedIn JSON-LD timestamp (real database example)', () => {
        // Real timestamp from database: 2025-12-13T01:56:19
        const result = parsePostedDate('2025-12-13T01:56:19.000Z');

        expect(result.toISOString()).toBe('2025-12-13T01:56:19.000Z');
      });

      it('should ensure posted_at differs from scraped_at when using ISO dates', () => {
        const postedDate = parsePostedDate('2025-12-09T14:25:55.000Z');
        const scrapedDate = new Date('2025-12-13T22:19:47.000Z');

        // posted_at should be earlier than scraped_at
        expect(postedDate.getTime()).toBeLessThan(scrapedDate.getTime());
      });

      it('should parse relative date and produce different timestamp than now', () => {
        const result = parsePostedDate('3 days ago');
        const now = new Date('2025-12-14T12:00:00.000Z');

        // Should be 3 days earlier
        expect(result.getTime()).toBeLessThan(now.getTime());
        const diffInDays = (now.getTime() - result.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffInDays).toBe(3);
      });
    });
  });

  describe('normalizeDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-14T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should convert relative date to ISO format', () => {
      const result = normalizeDate('2 days ago');

      expect(result).toBe('2025-12-12T12:00:00.000Z');
    });

    it('should handle ISO dates (pass-through)', () => {
      const isoDate = '2025-12-13T01:56:19.000Z';
      const result = normalizeDate(isoDate);

      expect(result).toBe(isoDate);
    });

    it('should return valid ISO string format', () => {
      const result = normalizeDate('3 hours ago');

      // Check ISO 8601 format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle "just now"', () => {
      const result = normalizeDate('just now');

      expect(result).toBe('2025-12-14T12:00:00.000Z');
    });

    it('should handle unparseable strings by returning current time', () => {
      const result = normalizeDate('invalid date');

      expect(result).toBe('2025-12-14T12:00:00.000Z');
    });
  });

  describe('formatDateForDisplay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-14T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Just now" for dates less than 1 hour ago', () => {
      const date = new Date('2025-12-14T11:30:00.000Z'); // 30 minutes ago
      const result = formatDateForDisplay(date);

      expect(result).toBe('Just now');
    });

    it('should return "1 hour ago" for 1 hour old date', () => {
      const date = new Date('2025-12-14T11:00:00.000Z'); // 1 hour ago
      const result = formatDateForDisplay(date);

      expect(result).toBe('1 hour ago');
    });

    it('should return "5 hours ago" for 5 hours old date', () => {
      const date = new Date('2025-12-14T07:00:00.000Z'); // 5 hours ago
      const result = formatDateForDisplay(date);

      expect(result).toBe('5 hours ago');
    });

    it('should return "1 day ago" for 24 hours old date', () => {
      const date = new Date('2025-12-13T12:00:00.000Z'); // 1 day ago
      const result = formatDateForDisplay(date);

      expect(result).toBe('1 day ago');
    });

    it('should return "3 days ago" for 3 days old date', () => {
      const date = new Date('2025-12-11T12:00:00.000Z'); // 3 days ago
      const result = formatDateForDisplay(date);

      expect(result).toBe('3 days ago');
    });

    it('should return "1 week ago" for 7 days old date', () => {
      const date = new Date('2025-12-07T12:00:00.000Z'); // 7 days ago
      const result = formatDateForDisplay(date);

      expect(result).toBe('1 week ago');
    });

    it('should return "2 weeks ago" for 14 days old date', () => {
      const date = new Date('2025-11-30T12:00:00.000Z'); // 14 days ago
      const result = formatDateForDisplay(date);

      expect(result).toBe('2 weeks ago');
    });

    it('should return "1 month ago" for 30+ days old date', () => {
      const date = new Date('2025-11-14T12:00:00.000Z'); // 30 days ago
      const result = formatDateForDisplay(date);

      expect(result).toBe('1 month ago');
    });

    it('should return "2 months ago" for 60 days old date', () => {
      const date = new Date('2025-10-15T12:00:00.000Z'); // ~60 days ago
      const result = formatDateForDisplay(date);

      expect(result).toBe('2 months ago');
    });

    it('should handle singular vs plural for hours', () => {
      const date1Hour = new Date('2025-12-14T11:00:00.000Z');
      const date2Hours = new Date('2025-12-14T10:00:00.000Z');

      expect(formatDateForDisplay(date1Hour)).toBe('1 hour ago');
      expect(formatDateForDisplay(date2Hours)).toBe('2 hours ago');
    });

    it('should handle singular vs plural for days', () => {
      const date1Day = new Date('2025-12-13T12:00:00.000Z');
      const date2Days = new Date('2025-12-12T12:00:00.000Z');

      expect(formatDateForDisplay(date1Day)).toBe('1 day ago');
      expect(formatDateForDisplay(date2Days)).toBe('2 days ago');
    });

    it('should handle singular vs plural for weeks', () => {
      const date1Week = new Date('2025-12-07T12:00:00.000Z');
      const date2Weeks = new Date('2025-11-30T12:00:00.000Z');

      expect(formatDateForDisplay(date1Week)).toBe('1 week ago');
      expect(formatDateForDisplay(date2Weeks)).toBe('2 weeks ago');
    });

    it('should handle singular vs plural for months', () => {
      const date1Month = new Date('2025-11-14T12:00:00.000Z');
      const date2Months = new Date('2025-10-15T12:00:00.000Z');

      expect(formatDateForDisplay(date1Month)).toBe('1 month ago');
      expect(formatDateForDisplay(date2Months)).toBe('2 months ago');
    });

    it('should handle dates at the boundary (23 hours)', () => {
      const date = new Date('2025-12-13T13:00:00.000Z'); // 23 hours ago
      const result = formatDateForDisplay(date);

      expect(result).toBe('23 hours ago');
    });

    it('should handle dates at week boundary (6 days)', () => {
      const date = new Date('2025-12-08T12:00:00.000Z'); // 6 days ago
      const result = formatDateForDisplay(date);

      expect(result).toBe('6 days ago');
    });
  });
});
