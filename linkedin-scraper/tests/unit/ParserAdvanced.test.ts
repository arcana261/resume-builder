import { describe, it, expect, beforeEach } from 'vitest';
import { Parser } from '../../src/scraper/core/Parser.js';
import { createMockPage } from '../mocks/MockPage.js';

describe('Parser Advanced Features', () => {
  let parser: Parser;
  let mockPage: ReturnType<typeof createMockPage>;

  beforeEach(() => {
    mockPage = createMockPage('');
    parser = new Parser(mockPage as any);
  });

  describe('normalizeJobPosting - Salary Extraction', () => {
    it('should extract salary from baseSalary.value structure', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '12345' },
        title: 'Software Engineer',
        hiringOrganization: { name: 'Test Company' },
        jobLocation: { address: { addressLocality: 'San Francisco' } },
        description: 'Test description',
        baseSalary: {
          value: {
            minValue: 100000,
            maxValue: 150000
          },
          currency: 'USD'
        },
        url: 'https://linkedin.com/jobs/12345'
      };

      // Access private method via prototype
      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.salaryMin).toBe(100000);
      expect(result.salaryMax).toBe(150000);
      expect(result.salaryCurrency).toBe('USD');
    });

    it('should extract GBP currency correctly', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '67890' },
        title: 'Engineer',
        hiringOrganization: { name: 'UK Company' },
        jobLocation: { address: 'London' },
        description: 'Test',
        baseSalary: {
          value: {
            minValue: 55000,
            maxValue: 90000
          },
          currency: 'GBP'
        },
        url: 'https://linkedin.com/jobs/67890'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.salaryCurrency).toBe('GBP');
    });

    it('should handle missing salary data gracefully', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '99999' },
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        jobLocation: { address: 'Location' },
        description: 'Test',
        url: 'https://linkedin.com/jobs/99999'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.salaryMin).toBeUndefined();
      expect(result.salaryMax).toBeUndefined();
      expect(result.salaryCurrency).toBeUndefined();
    });

    it('should handle partial salary data (only minValue)', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '11111' },
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        jobLocation: { address: 'Location' },
        description: 'Test',
        baseSalary: {
          value: {
            minValue: 75000
          },
          currency: 'USD'
        },
        url: 'https://linkedin.com/jobs/11111'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.salaryMin).toBe(75000);
      expect(result.salaryMax).toBeUndefined();
      expect(result.salaryCurrency).toBe('USD');
    });

    it('should handle low hourly rate salaries', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '22222' },
        title: 'Executive Assistant',
        hiringOrganization: { name: 'Warner Music' },
        jobLocation: { address: 'Los Angeles' },
        description: 'Test',
        baseSalary: {
          value: {
            minValue: 20,
            maxValue: 25
          },
          currency: 'USD'
        },
        url: 'https://linkedin.com/jobs/22222'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.salaryMin).toBe(20);
      expect(result.salaryMax).toBe(25);
    });
  });

  describe('normalizeJobPosting - Company ID Extraction', () => {
    it('should extract company ID from sameAs URL', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '33333' },
        title: 'Engineer',
        hiringOrganization: {
          name: 'Google',
          sameAs: 'https://www.linkedin.com/company/google'
        },
        jobLocation: { address: 'Mountain View' },
        description: 'Test',
        url: 'https://linkedin.com/jobs/33333'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.companyId).toBe('google');
    });

    it('should extract company ID with numbers and hyphens', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '44444' },
        title: 'Engineer',
        hiringOrganization: {
          name: 'Company',
          sameAs: 'https://www.linkedin.com/company/tech-company-123'
        },
        jobLocation: { address: 'SF' },
        description: 'Test',
        url: 'https://linkedin.com/jobs/44444'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.companyId).toBe('tech-company-123');
    });

    it('should handle missing sameAs field', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '55555' },
        title: 'Engineer',
        hiringOrganization: {
          name: 'Company'
        },
        jobLocation: { address: 'Location' },
        description: 'Test',
        url: 'https://linkedin.com/jobs/55555'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.companyId).toBeUndefined();
    });
  });

  describe('normalizeJobPosting - Location Parsing', () => {
    it('should extract location from addressLocality', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '66666' },
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        jobLocation: {
          address: {
            addressLocality: 'San Francisco'
          }
        },
        description: 'Test',
        url: 'https://linkedin.com/jobs/66666'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.location).toBe('San Francisco');
    });

    it('should fallback to address if addressLocality missing', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '77777' },
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        jobLocation: {
          address: 'London, United Kingdom'
        },
        description: 'Test',
        url: 'https://linkedin.com/jobs/77777'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.location).toBe('London, United Kingdom');
    });

    it('should handle empty location', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '88888' },
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        description: 'Test',
        url: 'https://linkedin.com/jobs/88888'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.location).toBe('');
    });
  });

  describe('normalizeJobPosting - Additional Fields', () => {
    it('should extract employment type', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '99999' },
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        jobLocation: { address: 'SF' },
        description: 'Test',
        employmentType: 'FULL_TIME',
        url: 'https://linkedin.com/jobs/99999'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.employmentType).toBe('FULL_TIME');
    });

    it('should extract seniority level', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '00001' },
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        jobLocation: { address: 'SF' },
        description: 'Test',
        seniorityLevel: 'Mid-Senior level',
        url: 'https://linkedin.com/jobs/00001'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.seniorityLevel).toBe('Mid-Senior level');
    });

    it('should extract industry', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '00002' },
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        jobLocation: { address: 'SF' },
        description: 'Test',
        industry: 'Computer Software',
        url: 'https://linkedin.com/jobs/00002'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.industry).toBe('Computer Software');
    });

    it('should extract apply URL from directApply', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '00003' },
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        jobLocation: { address: 'SF' },
        description: 'Test',
        directApply: 'https://company.com/apply',
        url: 'https://linkedin.com/jobs/00003'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.applyUrl).toBe('https://company.com/apply');
    });

    it('should extract posted date', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '00004' },
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        jobLocation: { address: 'SF' },
        description: 'Test',
        datePosted: '2025-12-13',
        url: 'https://linkedin.com/jobs/00004'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.postedDate).toBe('2025-12-13');
    });
  });

  describe('normalizeJobPosting - Identifier Extraction', () => {
    it('should extract identifier from identifier.value', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: '12345' },
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        jobLocation: { address: 'SF' },
        description: 'Test',
        url: 'https://linkedin.com/jobs/12345'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.id).toBe('12345');
    });

    it('should fallback to jobPosting.identifier.value', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        jobPosting: {
          identifier: { value: '67890' }
        },
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        jobLocation: { address: 'SF' },
        description: 'Test',
        url: 'https://linkedin.com/jobs/67890'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.id).toBe('67890');
    });

    it('should return empty string if no identifier found', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        title: 'Engineer',
        hiringOrganization: { name: 'Company' },
        jobLocation: { address: 'SF' },
        description: 'Test',
        url: 'https://linkedin.com/jobs/test'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.id).toBe('');
    });
  });

  describe('normalizeJobPosting - Complete Real-World Example', () => {
    it('should handle complete LinkedIn JSON-LD structure', () => {
      const jsonLdData = {
        '@type': 'JobPosting',
        identifier: { value: 'R-026327' },
        title: 'Executive Assistant, A&R',
        hiringOrganization: {
          name: 'Warner Music Group',
          sameAs: 'https://www.linkedin.com/company/warner-music-group'
        },
        jobLocation: {
          address: {
            addressLocality: 'Los Angeles'
          }
        },
        description: '<p>Exciting opportunity at Warner Music...</p>',
        employmentType: 'FULL_TIME',
        baseSalary: {
          value: {
            minValue: 20,
            maxValue: 25
          },
          currency: 'USD'
        },
        datePosted: '2025-12-13T14:00:23.000Z',
        directApply: 'https://careers.warnermusicgroup.com/apply',
        industry: 'Entertainment',
        url: 'https://www.linkedin.com/jobs/view/R-026327'
      };

      const result = (parser as any).normalizeJobPosting(jsonLdData);

      expect(result.id).toBe('R-026327');
      expect(result.title).toBe('Executive Assistant, A&R');
      expect(result.company).toBe('Warner Music Group');
      expect(result.companyId).toBe('warner-music-group');
      expect(result.location).toBe('Los Angeles');
      expect(result.description).toContain('Warner Music');
      expect(result.employmentType).toBe('FULL_TIME');
      expect(result.salaryMin).toBe(20);
      expect(result.salaryMax).toBe(25);
      expect(result.salaryCurrency).toBe('USD');
      expect(result.postedDate).toBe('2025-12-13T14:00:23.000Z');
      expect(result.applyUrl).toBe('https://careers.warnermusicgroup.com/apply');
      expect(result.industry).toBe('Entertainment');
      expect(result.url).toBe('https://www.linkedin.com/jobs/view/R-026327');
    });
  });
});
