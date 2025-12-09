import PQueue from 'p-queue';
import pRetry from 'p-retry';
import { Browser } from '../scraper/core/Browser.js';
import { Parser } from '../scraper/core/Parser.js';
import { JobFilter } from '../scraper/filters/JobFilter.js';
import { JobRepository } from '../database/repositories/JobRepository.js';
import { SearchRepository } from '../database/repositories/SearchRepository.js';
import { ProgressUI } from '../cli/ui/ProgressUI.js';
import { parsePostedDate } from '../utils/dateHelpers.js';
import { logger } from '../utils/logger.js';
import type { ScrapeOptions, ScrapeResult, Job, JobCard, JobData } from '../types/index.js';

export class ScraperService {
  private browser: Browser;
  private jobRepo: JobRepository;
  private searchRepo: SearchRepository;
  private progressUI: ProgressUI;
  private queue: PQueue;
  private jobFilter: JobFilter;

  constructor() {
    this.browser = new Browser({
      headless: process.env.HEADLESS !== 'false',
      type: (process.env.BROWSER_TYPE as any) || 'chromium'
    });

    this.jobRepo = new JobRepository();
    this.searchRepo = new SearchRepository();
    this.progressUI = new ProgressUI();
    this.jobFilter = new JobFilter();

    const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_REQUESTS || '2');
    const delayMin = parseInt(process.env.REQUEST_DELAY_MIN || '3000');

    this.queue = new PQueue({
      concurrency: maxConcurrent,
      interval: delayMin,
      intervalCap: 1
    });
  }

  async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
    let searchId: number | undefined;

    try {
      logger.info('Starting scrape', { options });

      // Create search record
      const search = await this.searchRepo.create({
        query: options.position || '',
        location: options.location || '',
        filters: JSON.stringify(options),
        total_results: 0,
        successful_scrapes: 0,
        failed_scrapes: 0,
        started_at: new Date(),
        status: 'running'
      });

      searchId = search.id!;
      logger.info('Created search record', { searchId });

      // Launch browser
      await this.browser.launch();

      // Build search URL
      const searchUrl = this.jobFilter.buildSearchUrl(options);
      logger.info('Search URL', { url: searchUrl });

      // Navigate to search page
      await this.browser.navigate(searchUrl);

      // Wait for results to load - LinkedIn needs time to render
      logger.info('Waiting for LinkedIn to load results...');
      await this.randomDelay(3000, 5000);

      // Get parser instance
      const parser = new Parser(this.browser.getPage());

      // Extract total count
      logger.info('Extracting total job count...');
      const totalJobs = await parser.extractTotalCount();

      if (totalJobs === 0) {
        logger.warn('No jobs found. This might indicate LinkedIn blocking or invalid search.');
        await this.saveDebugArtifacts('no-jobs-found', { searchUrl });
      }

      await this.searchRepo.update(searchId, { total_results: totalJobs });

      const limit = Math.min(options.limit, totalJobs);
      this.progressUI.start(limit);

      logger.info('Total jobs found', { total: totalJobs, limit });

      let scrapedCount = 0;
      let pageNum = 0;
      const maxPages = parseInt(process.env.MAX_PAGES_PER_SEARCH || '10');

      // Scrape jobs page by page
      while (scrapedCount < limit && pageNum < maxPages) {
        pageNum++;
        logger.info('Processing page', { page: pageNum });

        // Extract job cards
        const jobCards = await parser.extractJobCards();

        if (jobCards.length === 0) {
          logger.warn('No job cards found on page', { page: pageNum });
          break;
        }

        // Queue each job for scraping
        for (const card of jobCards) {
          if (scrapedCount >= limit) break;

          await this.queue.add(async () => {
            try {
              await this.scrapeJobDetails(card, searchId!, parser);
              scrapedCount++;
              this.progressUI.incrementSuccess();
              this.progressUI.update(scrapedCount, `Scraped: ${card.title} at ${card.company}`);
            } catch (error) {
              logger.error('Failed to scrape job', { card, error });
              this.progressUI.incrementFailed();
              await this.searchRepo.incrementFailed(searchId!);

              // Save debug artifacts for first few failures
              const failedCount = await this.searchRepo.findById(searchId!).then(s => s?.failed_scrapes || 0);
              if (failedCount < 3) {
                await this.saveDebugArtifacts('job-scrape-failed', {
                  jobId: card.id,
                  title: card.title,
                  company: card.company,
                  error: error instanceof Error ? error.message : String(error)
                });
              }

              await this.searchRepo.logError({
                search_id: searchId!,
                job_id: card.id,
                error_type: 'ScrapeError',
                error_message: error instanceof Error ? error.message : String(error),
                occurred_at: new Date()
              });
            }
          });
        }

        // Try to navigate to next page
        if (scrapedCount < limit && await parser.hasNextPage()) {
          const success = await parser.clickNextPage();
          if (!success) {
            logger.warn('Failed to navigate to next page');
            break;
          }
          await this.randomDelay(3000, 7000);
        } else {
          break;
        }
      }

      // Wait for queue to complete
      await this.queue.onIdle();

      // Update search record
      await this.searchRepo.update(searchId, {
        completed_at: new Date(),
        status: 'completed'
      });

      // Complete UI
      this.progressUI.complete();

      logger.info('Scraping completed', { searchId, scrapedCount });

      return {
        searchId,
        totalScraped: scrapedCount,
        success: true
      };
    } catch (error) {
      logger.error('Scraping failed', { error });

      if (searchId) {
        await this.searchRepo.update(searchId, {
          completed_at: new Date(),
          status: 'failed'
        });
      }

      this.progressUI.fail('Scraping failed: ' + (error instanceof Error ? error.message : String(error)));

      return {
        searchId: searchId || 0,
        totalScraped: 0,
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    } finally {
      await this.browser.close();
    }
  }

  private async scrapeJobDetails(card: JobCard, searchId: number, parser: Parser): Promise<void> {
    // Check if job already exists
    const existing = await this.jobRepo.findByJobId(card.id);
    if (existing) {
      logger.info('Job already exists, skipping', { jobId: card.id });
      this.progressUI.incrementDuplicates();
      return;
    }

    logger.info('Starting job scrape', {
      jobId: card.id,
      title: card.title,
      company: card.company,
      searchId
    });

    // Retry logic for scraping
    try {
      await pRetry(
        async () => {
          logger.debug('Attempting to scrape job details', { jobId: card.id, title: card.title });

          // Click job card to load details
          await this.browser.click(card.selector);
          await this.randomDelay(1500, 3000); // Reduced from 2000-4000

          // Remove modal overlay if present after clicking job card
          await this.browser.removeModalOverlay();

          // Try multiple extraction strategies
          logger.debug('Trying JSON-LD extraction', { jobId: card.id });
          let jobData: JobData | null = await parser.tryJsonLdExtraction();

          if (!jobData) {
            logger.debug('JSON-LD extraction failed, trying HTML extraction', { jobId: card.id });
            jobData = await parser.tryHtmlExtraction();
          }

          if (!jobData || !jobData.id) {
            logger.warn('Both extraction strategies failed', {
              jobId: card.id,
              title: card.title,
              hasJobData: !!jobData,
              hasJobId: jobData?.id
            });
            throw new Error('Failed to extract job data');
          }

          logger.debug('Job data extracted successfully', {
            jobId: jobData.id,
            title: jobData.title,
            hasDescription: !!jobData.description,
            descriptionLength: jobData.description?.length || 0
          });

          // Check again if job was already saved (can happen during retries)
          const alreadyExists = await this.jobRepo.findByJobId(jobData.id);
          if (alreadyExists) {
            logger.info('Job already saved during retry, skipping database insert', {
              jobId: jobData.id,
              title: jobData.title
            });
            return; // Exit successfully without re-inserting
          }

          // Create job record
          const job: Omit<Job, 'id' | 'created_at' | 'updated_at'> = {
            job_id: jobData.id,
            title: jobData.title,
            company: jobData.company,
            company_id: jobData.companyId,
            location: jobData.location,
            description: jobData.description,
            employment_type: jobData.employmentType,
            seniority_level: jobData.seniorityLevel,
            industry: jobData.industry,
            salary_min: jobData.salaryMin,
            salary_max: jobData.salaryMax,
            salary_currency: jobData.salaryCurrency,
            job_url: jobData.url || card.id,
            apply_url: jobData.applyUrl,
            posted_at: parsePostedDate(jobData.postedDate || 'today'),
            scraped_at: new Date(),
            search_id: searchId,
            raw_data: JSON.stringify(jobData)
          };

          // Save to database
          await this.jobRepo.create(job);
          await this.searchRepo.incrementSuccessful(searchId);

          logger.info('Job scraped successfully', {
            jobId: jobData.id,
            title: jobData.title,
            company: jobData.company
          });
        },
        {
          retries: parseInt(process.env.MAX_RETRIES || '3'),
          onFailedAttempt: async (error) => {
            logger.warn('Retry attempt failed', {
              jobId: card.id,
              title: card.title,
              attempt: error.attemptNumber,
              retriesLeft: error.retriesLeft,
              error: error.message,
              willRetry: error.retriesLeft > 0
            });

            // Collect debug artifacts on each failed attempt
            await this.saveDebugArtifacts(`job-retry-attempt-${error.attemptNumber}`, {
              jobId: card.id,
              title: card.title,
              company: card.company,
              selector: card.selector,
              searchId,
              attemptNumber: error.attemptNumber,
              retriesLeft: error.retriesLeft,
              error: error.message
            });
          }
        }
      );
    } catch (error) {
      // All retries exhausted - save debug artifacts
      logger.error('All retry attempts exhausted for job', {
        jobId: card.id,
        title: card.title,
        company: card.company,
        error: error instanceof Error ? error.message : String(error)
      });

      await this.saveDebugArtifacts('job-retry-exhausted', {
        jobId: card.id,
        title: card.title,
        company: card.company,
        selector: card.selector,
        searchId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Re-throw to let parent handler deal with it
      throw error;
    }
  }

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Save debug artifacts (screenshot + HTML) for troubleshooting
   */
  private async saveDebugArtifacts(prefix: string, context?: Record<string, any>): Promise<void> {
    const timestamp = Date.now();
    const page = this.browser.getPage();

    // Save screenshot
    try {
      const screenshotPath = `./logs/${prefix}-screenshot-${timestamp}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      logger.info('Debug screenshot saved', { path: screenshotPath, context });
    } catch (screenshotError) {
      logger.debug('Could not save screenshot', { error: screenshotError });
    }

    // Save HTML from browser's internal state (no re-download)
    try {
      const htmlContent = await page.content();
      const htmlPath = `./logs/${prefix}-page-${timestamp}.html`;
      const fs = await import('fs');
      fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
      logger.info('Debug HTML saved', {
        path: htmlPath,
        size: htmlContent.length,
        context
      });
    } catch (htmlError) {
      logger.debug('Could not save HTML', { error: htmlError });
    }
  }
}
