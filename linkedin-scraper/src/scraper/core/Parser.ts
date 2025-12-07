import { Page } from 'playwright';
import { logger } from '../../utils/logger.js';
import type { JobData, JobCard } from '../../types/index.js';

export class Parser {
  constructor(private page: Page) {}

  /**
   * Extract job cards from the search results page
   */
  async extractJobCards(): Promise<JobCard[]> {
    try {
      const cards: JobCard[] = [];

      // Wait for job listings to load
      await this.page.waitForSelector('.jobs-search__results-list', { timeout: 10000 });

      // Get all job card elements
      const cardElements = await this.page.$$('.jobs-search__results-list > li');

      for (let i = 0; i < cardElements.length; i++) {
        try {
          const element = cardElements[i];

          const jobId = await element.getAttribute('data-occludable-job-id');
          if (!jobId) continue;

          const title = await element.$eval('.job-card-list__title', el => el.textContent?.trim() || '');
          const company = await element.$eval('.job-card-container__company-name', el => el.textContent?.trim() || '');
          const location = await element.$eval('.job-card-container__metadata-item', el => el.textContent?.trim() || '');

          cards.push({
            id: jobId,
            selector: `li[data-occludable-job-id="${jobId}"]`,
            title,
            company,
            location
          });
        } catch (error) {
          logger.warn('Failed to parse job card', { index: i, error });
        }
      }

      logger.info('Extracted job cards', { count: cards.length });
      return cards;
    } catch (error) {
      logger.error('Failed to extract job cards', { error });
      return [];
    }
  }

  /**
   * Strategy 1: Try to extract job data from JSON-LD script tags
   */
  async tryJsonLdExtraction(): Promise<JobData | null> {
    try {
      const jsonLdData = await this.page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');

        for (const script of Array.from(scripts)) {
          try {
            const data = JSON.parse(script.textContent || '');
            if (data['@type'] === 'JobPosting') {
              return data;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }

        return null;
      });

      if (!jsonLdData) {
        return null;
      }

      logger.info('Extracted data using JSON-LD strategy');

      return this.normalizeJobPosting(jsonLdData);
    } catch (error) {
      logger.warn('JSON-LD extraction failed', { error });
      return null;
    }
  }

  /**
   * Strategy 2: Extract job data from HTML elements
   */
  async tryHtmlExtraction(): Promise<JobData | null> {
    try {
      await this.page.waitForSelector('.jobs-unified-top-card', { timeout: 5000 });

      const data = await this.page.evaluate(() => {
        const getTextContent = (selector: string): string => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || '';
        };

        const getHtmlContent = (selector: string): string => {
          const element = document.querySelector(selector);
          return element?.innerHTML?.trim() || '';
        };

        const getAttribute = (selector: string, attr: string): string => {
          const element = document.querySelector(selector);
          return element?.getAttribute(attr) || '';
        };

        // Extract job ID from URL or data attribute
        const jobId = window.location.pathname.match(/\/view\/(\d+)/)?.[1] || '';

        return {
          id: jobId,
          title: getTextContent('.jobs-unified-top-card__job-title'),
          company: getTextContent('.jobs-unified-top-card__company-name'),
          companyId: getAttribute('.jobs-unified-top-card__company-name a', 'href')?.match(/\/company\/([^/]+)/)?.[1],
          location: getTextContent('.jobs-unified-top-card__bullet'),
          description: getHtmlContent('.jobs-description__content'),
          employmentType: getTextContent('.jobs-unified-top-card__job-insight--EMPLOYMENT_TYPE'),
          seniorityLevel: getTextContent('.jobs-unified-top-card__job-insight--SENIORITY_LEVEL'),
          postedDate: getTextContent('.jobs-unified-top-card__posted-date'),
          url: window.location.href,
          applyUrl: getAttribute('.jobs-apply-button', 'href')
        };
      });

      if (!data.id || !data.title) {
        return null;
      }

      logger.info('Extracted data using HTML strategy');

      return {
        id: data.id,
        title: data.title,
        company: data.company,
        companyId: data.companyId,
        location: data.location,
        description: data.description,
        employmentType: data.employmentType,
        seniorityLevel: data.seniorityLevel,
        url: data.url,
        applyUrl: data.applyUrl,
        postedDate: data.postedDate
      };
    } catch (error) {
      logger.warn('HTML extraction failed', { error });
      return null;
    }
  }

  /**
   * Extract total job count from search results
   */
  async extractTotalCount(): Promise<number> {
    try {
      const countText = await this.page.textContent('.jobs-search-results-list__subtitle');

      if (!countText) {
        return 0;
      }

      const match = countText.match(/(\d+[\d,]*)\s*results?/i);
      if (match) {
        return parseInt(match[1].replace(/,/g, ''));
      }

      return 0;
    } catch (error) {
      logger.warn('Failed to extract total count', { error });
      return 0;
    }
  }

  /**
   * Check if there's a next page
   */
  async hasNextPage(): Promise<boolean> {
    try {
      const nextButton = await this.page.$('button[aria-label="View next page"]');
      if (!nextButton) {
        return false;
      }

      const isDisabled = await nextButton.getAttribute('disabled');
      return isDisabled === null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Click next page button
   */
  async clickNextPage(): Promise<boolean> {
    try {
      if (!(await this.hasNextPage())) {
        return false;
      }

      await this.page.click('button[aria-label="View next page"]');
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      return true;
    } catch (error) {
      logger.error('Failed to navigate to next page', { error });
      return false;
    }
  }

  private normalizeJobPosting(data: any): JobData {
    // Extract salary information if available
    let salaryMin: number | undefined;
    let salaryMax: number | undefined;
    let salaryCurrency: string | undefined;

    if (data.baseSalary) {
      if (data.baseSalary.value) {
        salaryMin = data.baseSalary.value.minValue;
        salaryMax = data.baseSalary.value.maxValue;
      }
      salaryCurrency = data.baseSalary.currency;
    }

    return {
      id: data.identifier?.value || data.jobPosting?.identifier?.value || '',
      title: data.title || '',
      company: data.hiringOrganization?.name || '',
      companyId: data.hiringOrganization?.sameAs?.match(/\/company\/([^/]+)/)?.[1],
      location: data.jobLocation?.address?.addressLocality || data.jobLocation?.address || '',
      description: data.description || '',
      employmentType: data.employmentType || undefined,
      seniorityLevel: data.seniorityLevel || undefined,
      industry: data.industry || undefined,
      salaryMin,
      salaryMax,
      salaryCurrency,
      url: data.url || '',
      applyUrl: data.directApply || undefined,
      postedDate: data.datePosted || ''
    };
  }
}
