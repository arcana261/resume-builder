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

      // Get all job card elements (using the actual LinkedIn structure)
      const cardElements = await this.page.$$('div.base-card[data-entity-urn]');

      for (let i = 0; i < cardElements.length; i++) {
        try {
          const element = cardElements[i];

          // Extract job ID from data-entity-urn attribute
          // Format: "urn:li:jobPosting:4337634700"
          const entityUrn = await element.getAttribute('data-entity-urn');
          if (!entityUrn) continue;

          const jobIdMatch = entityUrn.match(/urn:li:jobPosting:(\d+)/);
          if (!jobIdMatch) continue;

          const jobId = jobIdMatch[1];

          const title = await element.$eval('h3.base-search-card__title', el => el.textContent?.trim() || '').catch(() => '');
          const company = await element.$eval('h4.base-search-card__subtitle a', el => el.textContent?.trim() || '').catch(() => '');
          const location = await element.$eval('span.job-search-card__location', el => el.textContent?.trim() || '').catch(() => '');

          cards.push({
            id: jobId,
            selector: `div.base-card[data-entity-urn="${entityUrn}"]`,
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

      logger.info('Extracted data using JSON-LD strategy:', jsonLdData);

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
      // Try multiple selectors as LinkedIn's structure may vary
      // Starting with the actual selector found in LinkedIn's current structure
      const selectors = [
        '.results-context-header__job-count',
        '.jobs-search-results-list__subtitle',
        '.jobs-search-results__subtitle',
        'small.jobs-search-results-list__text',
        '[class*="jobs-search-results"]  [class*="subtitle"]',
        '[class*="jobs-search"] small'
      ];

      let countText: string | null = null;

      for (const selector of selectors) {
        try {
          // Wait for the selector with a timeout
          await this.page.waitForSelector(selector, { timeout: 10000, state: 'visible' });
          countText = await this.page.textContent(selector);

          if (countText && countText.trim()) {
            logger.info('Found count text with selector', { selector, text: countText });
            break;
          }
        } catch (selectorError) {
          // Try next selector
          logger.debug('Selector not found', { selector });
          continue;
        }
      }

      if (!countText) {
        // Try to get any text that might contain results count
        logger.warn('Could not find job count with known selectors, trying fallback');

        const bodyText = await this.page.evaluate(() => {
          const elements = document.querySelectorAll('small, .subtitle, [class*="subtitle"]');
          for (const el of Array.from(elements)) {
            const text = el.textContent || '';
            if (/\d+[\d,]*\s*results?/i.test(text)) {
              return text;
            }
          }
          return null;
        });

        countText = bodyText;
      }

      if (!countText) {
        logger.warn('No job count found on page');
        return 0;
      }

      // Try to match "123 results" or "123,456 results" format
      let match = countText.match(/(\d+[\d,]*)\s*results?/i);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''));
        logger.info('Extracted job count', { count, rawText: countText });
        return count;
      }

      // If no "results" keyword, try to extract just the number
      match = countText.match(/(\d+[\d,]*)/);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''));
        logger.info('Extracted job count (number only)', { count, rawText: countText });
        return count;
      }

      logger.warn('Could not parse job count from text', { text: countText });
      return 0;
    } catch (error) {
      logger.error('Failed to extract total count', { error });
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
