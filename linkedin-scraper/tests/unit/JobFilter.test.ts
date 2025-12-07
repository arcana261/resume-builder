import { describe, it, expect, beforeEach } from 'vitest';
import { JobFilter } from '../../src/scraper/filters/JobFilter.js';
import type { JobFilters } from '../../src/types/index.js';

describe('JobFilter', () => {
  let filter: JobFilter;

  beforeEach(() => {
    filter = new JobFilter();
  });

  describe('buildSearchUrl', () => {
    it('should build basic URL with position only', () => {
      const filters: JobFilters = {
        position: 'Software Engineer',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('https://www.linkedin.com/jobs/search');
      expect(url).toContain('keywords=Software+Engineer');
    });

    it('should build URL with position and location', () => {
      const filters: JobFilters = {
        position: 'Software Engineer',
        location: 'San Francisco, CA',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('keywords=Software+Engineer');
      expect(url).toContain('location=San+Francisco');
    });

    it('should encode special characters in position', () => {
      const filters: JobFilters = {
        position: 'C++ & Python Developer',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('keywords=C%2B%2B');
      expect(url).toContain('%26');
    });

    it('should handle empty filters object', () => {
      const filters: JobFilters = {
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toBe('https://www.linkedin.com/jobs/search?');
    });
  });

  describe('Experience level filtering', () => {
    it('should map single experience level', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        experienceLevel: ['Entry Level'],
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_E=2');
    });

    it('should map multiple experience levels', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        experienceLevel: ['Entry Level', 'Mid-Senior'],
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_E=2%2C4');
    });

    it('should map all experience levels correctly', () => {
      const testCases = [
        { level: 'Internship', code: '1' },
        { level: 'Entry Level', code: '2' },
        { level: 'Associate', code: '3' },
        { level: 'Mid-Senior', code: '4' },
        { level: 'Director', code: '5' },
        { level: 'Executive', code: '6' }
      ];

      testCases.forEach(({ level, code }) => {
        const filters: JobFilters = {
          position: 'Test',
          experienceLevel: [level],
          limit: 50
        };

        const url = filter.buildSearchUrl(filters);
        expect(url).toContain(`f_E=${code}`);
      });
    });

    it('should filter out invalid experience levels', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        experienceLevel: ['Entry Level', 'Invalid Level' as any],
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_E=2');
      expect(url).not.toContain('Invalid');
    });

    it('should not add f_E parameter if all levels are invalid', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        experienceLevel: ['Invalid' as any],
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).not.toContain('f_E');
    });
  });

  describe('Employment type filtering', () => {
    it('should map single employment type', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        employmentType: ['Full-time'],
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_JT=F');
    });

    it('should map multiple employment types', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        employmentType: ['Full-time', 'Contract'],
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_JT=F%2CC');
    });

    it('should map all employment types correctly', () => {
      const testCases = [
        { type: 'Full-time', code: 'F' },
        { type: 'Part-time', code: 'P' },
        { type: 'Contract', code: 'C' },
        { type: 'Temporary', code: 'T' },
        { type: 'Volunteer', code: 'V' },
        { type: 'Internship', code: 'I' }
      ];

      testCases.forEach(({ type, code }) => {
        const filters: JobFilters = {
          position: 'Test',
          employmentType: [type],
          limit: 50
        };

        const url = filter.buildSearchUrl(filters);
        expect(url).toContain(`f_JT=${code}`);
      });
    });

    it('should filter out invalid employment types', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        employmentType: ['Full-time', 'Invalid Type' as any],
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_JT=F');
      expect(url).not.toContain('Invalid');
    });
  });

  describe('Date posted filtering', () => {
    it('should map "Past 24 hours"', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        datePosted: 'Past 24 hours',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_TPR=r86400');
    });

    it('should map "Past Week"', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        datePosted: 'Past Week',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_TPR=r604800');
    });

    it('should map "Past Month"', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        datePosted: 'Past Month',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_TPR=r2592000');
    });

    it('should handle "Any time" (empty value)', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        datePosted: 'Any time',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      // "Any time" maps to empty string, which is falsy, so it won't be added to URL
      expect(url).not.toContain('f_TPR');
    });

    it('should not add f_TPR for invalid date posted value', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        datePosted: 'Invalid' as any,
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).not.toContain('f_TPR');
    });
  });

  describe('Remote option filtering', () => {
    it('should map "On-site"', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        remoteOption: 'On-site',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_WT=1');
    });

    it('should map "Remote"', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        remoteOption: 'Remote',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_WT=2');
    });

    it('should map "Hybrid"', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        remoteOption: 'Hybrid',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_WT=3');
    });

    it('should not add f_WT for invalid remote option', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        remoteOption: 'Invalid' as any,
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).not.toContain('f_WT');
    });
  });

  describe('Salary filtering', () => {
    it('should add minimum salary filter', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        salary: { min: 100000 },
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('f_SB2=100000');
    });

    it('should handle zero minimum salary', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        salary: { min: 0 },
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      // 0 is falsy, so it won't be added
      expect(url).not.toContain('f_SB2');
    });

    it('should not add salary filter if salary object is missing min', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        salary: {},
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).not.toContain('f_SB2');
    });
  });

  describe('Complex filter combinations', () => {
    it('should combine all filters correctly', () => {
      const filters: JobFilters = {
        position: 'Software Engineer',
        location: 'London',
        experienceLevel: ['Mid-Senior', 'Director'],
        employmentType: ['Full-time', 'Contract'],
        datePosted: 'Past Week',
        remoteOption: 'Remote',
        salary: { min: 100000 },
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('keywords=Software+Engineer');
      expect(url).toContain('location=London');
      expect(url).toContain('f_E=4%2C5');
      expect(url).toContain('f_JT=F%2CC');
      expect(url).toContain('f_TPR=r604800');
      expect(url).toContain('f_WT=2');
      expect(url).toContain('f_SB2=100000');
    });

    it('should produce valid URL with all parameters', () => {
      const filters: JobFilters = {
        position: 'Developer',
        location: 'New York',
        experienceLevel: ['Entry Level'],
        employmentType: ['Full-time'],
        datePosted: 'Past 24 hours',
        remoteOption: 'Hybrid',
        salary: { min: 80000 },
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      // Should be a valid URL
      expect(() => new URL(url)).not.toThrow();

      // Should have all parameters
      const urlObj = new URL(url);
      expect(urlObj.searchParams.get('keywords')).toBe('Developer');
      expect(urlObj.searchParams.get('location')).toBe('New York');
      expect(urlObj.searchParams.get('f_E')).toBe('2');
      expect(urlObj.searchParams.get('f_JT')).toBe('F');
      expect(urlObj.searchParams.get('f_TPR')).toBe('r86400');
      expect(urlObj.searchParams.get('f_WT')).toBe('3');
      expect(urlObj.searchParams.get('f_SB2')).toBe('80000');
    });
  });

  describe('URL structure validation', () => {
    it('should always start with LinkedIn base URL', () => {
      const filters: JobFilters = {
        position: 'Test',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toMatch(/^https:\/\/www\.linkedin\.com\/jobs\/search/);
    });

    it('should produce parseable URL', () => {
      const filters: JobFilters = {
        position: 'Software Engineer',
        location: 'San Francisco',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(() => new URL(url)).not.toThrow();
    });

    it('should properly encode query parameters', () => {
      const filters: JobFilters = {
        position: 'C++ Developer & Python Expert',
        location: 'São Paulo, Brazil',
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      const urlObj = new URL(url);
      expect(urlObj.searchParams.get('keywords')).toBe('C++ Developer & Python Expert');
      expect(urlObj.searchParams.get('location')).toBe('São Paulo, Brazil');
    });
  });

  describe('White-box testing - mapping functions', () => {
    it('should correctly map all experience levels internally', () => {
      const allLevels: JobFilters = {
        position: 'Test',
        experienceLevel: [
          'Internship',
          'Entry Level',
          'Associate',
          'Mid-Senior',
          'Director',
          'Executive'
        ],
        limit: 50
      };

      const url = filter.buildSearchUrl(allLevels);

      // Should contain all codes: 1,2,3,4,5,6
      expect(url).toContain('f_E=1%2C2%2C3%2C4%2C5%2C6');
    });

    it('should correctly map all employment types internally', () => {
      const allTypes: JobFilters = {
        position: 'Test',
        employmentType: [
          'Full-time',
          'Part-time',
          'Contract',
          'Temporary',
          'Volunteer',
          'Internship'
        ],
        limit: 50
      };

      const url = filter.buildSearchUrl(allTypes);

      // Should contain all codes: F,P,C,T,V,I
      expect(url).toContain('f_JT=F%2CP%2CC%2CT%2CV%2CI');
    });

    it('should preserve order of parameters', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        location: 'NYC',
        experienceLevel: ['Mid-Senior'],
        employmentType: ['Full-time'],
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      // Parameters should appear in a consistent order
      const paramOrder = url.indexOf('keywords') < url.indexOf('location');
      expect(paramOrder).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined optional fields', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        location: undefined,
        experienceLevel: undefined,
        employmentType: undefined,
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).toContain('keywords=Engineer');
      expect(url).not.toContain('location');
      expect(url).not.toContain('f_E');
      expect(url).not.toContain('f_JT');
    });

    it('should handle empty arrays for multi-select fields', () => {
      const filters: JobFilters = {
        position: 'Engineer',
        experienceLevel: [],
        employmentType: [],
        limit: 50
      };

      const url = filter.buildSearchUrl(filters);

      expect(url).not.toContain('f_E');
      expect(url).not.toContain('f_JT');
    });
  });
});
