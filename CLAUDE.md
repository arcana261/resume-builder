# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains tools for building and managing resumes, including a LinkedIn job scraper to gather job postings data for resume optimization and job search.

### Original Requirements

The LinkedIn scraper was built to fulfill these requirements:
1. Scrape job opportunities from LinkedIn
2. Store scraped data in a local database
3. Filter by job position and location
4. Store job search history in the database
5. Capture job posting timestamps
6. Display progress bars and terminal-based UI during scraping

## Repository Structure

### linkedin-scraper/

A TypeScript CLI application for scraping LinkedIn job postings with advanced filtering and local database storage.

**Technology Stack:**
- TypeScript 5.x
- Node.js v24.11.1 (managed via fnm)
- Playwright (browser automation with anti-detection)
- Drizzle ORM + better-sqlite3 (type-safe database)
- Commander (CLI framework)
- Inquirer (interactive prompts)
- Chalk, Ora, CLI-Progress (terminal UI)
- Winston (structured logging)
- P-Queue & P-Retry (concurrency & error handling)

**Project Structure:**
```
linkedin-scraper/
├── src/
│   ├── cli/
│   │   ├── commands/         # scrape, list, export, clear
│   │   ├── prompts/          # Interactive prompts
│   │   ├── ui/               # ProgressUI, JobTable
│   │   └── index.ts          # CLI entry point
│   ├── scraper/
│   │   ├── core/             # Browser, Parser
│   │   ├── filters/          # JobFilter (URL building)
│   │   └── anti-detection/   # (placeholder for future)
│   ├── database/
│   │   ├── schema.ts         # Drizzle schema definitions
│   │   ├── repositories/     # JobRepository, SearchRepository
│   │   └── db.ts             # Database connection & init
│   ├── services/             # ScraperService orchestration
│   ├── utils/                # Logger, validators, date helpers
│   └── types/                # TypeScript type definitions
├── data/                     # SQLite database (gitignored)
├── logs/                     # Application logs (gitignored)
├── dist/                     # Compiled JS (gitignored)
└── node_modules/             # Dependencies (gitignored)
```

## Development Commands

### linkedin-scraper

**Setup:**
```bash
cd linkedin-scraper
npm install                     # Install dependencies
npx playwright install chromium # Install browser
npm run build                   # Compile TypeScript
```

**Development:**
```bash
npm run dev                    # Run with auto-reload
npm run build                  # Build project
npm run watch                  # Watch mode
npm run clean                  # Clean build artifacts
```

**Usage:**
```bash
# Interactive scraping
npm run dev scrape --interactive

# CLI mode
npm run dev scrape --position "Software Engineer" --location "SF" --limit 50

# List scraped jobs
npm run dev list --limit 20

# Export to JSON/CSV
npm run dev export --format json --output jobs.json

# Clear database
npm run dev clear
```

## Node.js Version Management

This project uses **fnm** (Fast Node Manager) for Node.js version management:

- Required: Node.js >= 18.0.0
- Current: v24.11.1 (pinned via `.node-version`)
- fnm auto-switches to correct version when entering `linkedin-scraper/` directory

**fnm is configured in ~/.bashrc:**
```bash
eval "$(fnm env --use-on-cd)"
```

## Architecture Details

### Database Schema (SQLite)

**jobs table:**
- Primary fields: job_id (unique), title, company, location, description
- Employment details: employment_type, seniority_level, industry
- Salary: salary_min, salary_max, salary_currency
- Metadata: job_url, apply_url, posted_at, scraped_at, search_id
- Audit: created_at, updated_at
- Storage: raw_data (JSON string of full scraped data)
- Indexes: job_id, company, location, posted_at, search_id

**searches table:**
- Tracks each scrape session with query, location, filters (JSON)
- Counts: total_results, successful_scrapes, failed_scrapes
- Status: running, completed, failed, cancelled
- Timestamps: started_at, completed_at, created_at

**scrape_errors table:**
- Logs all scraping failures for debugging
- Fields: search_id, job_id, error_type, error_message, url, occurred_at
- Linked to searches table via foreign key

### Code Patterns

#### Scraping Flow
1. User provides filters (position, location, experience, etc.)
2. `ScraperService` creates search record and orchestrates scraping
3. `Browser` launches Playwright with anti-detection measures
4. `JobFilter` builds LinkedIn search URL with filter parameters
5. `Parser` extracts job cards from search results
6. For each job: click card, extract details, save to database
7. `ProgressUI` shows real-time terminal updates (progress bar, stats)
8. Complete search record and display summary

#### Multi-Strategy Parsing
The parser tries multiple extraction methods in order:
1. **JSON-LD extraction** - Parse `<script type="application/ld+json">` tags (fastest, most reliable)
2. **HTML extraction** - Query DOM selectors for job details (fallback)
3. **API interception** - Monitor XHR calls to LinkedIn's internal APIs (advanced, not implemented)

This ensures resilience against HTML structure changes.

#### Filter URL Mapping
Job filters are mapped to LinkedIn URL parameters:
- Experience levels: Internship(1), Entry(2), Associate(3), Mid-Senior(4), Director(5), Executive(6)
- Employment types: Full-time(F), Part-time(P), Contract(C), Temporary(T), Volunteer(V), Internship(I)
- Date posted: Past 24h(r86400), Past Week(r604800), Past Month(r2592000)
- Remote: On-site(1), Remote(2), Hybrid(3)

#### Anti-Detection Measures
- User-agent rotation (5 different user agents)
- Random delays (3-7 seconds between requests, 2-4 seconds between job clicks)
- Browser fingerprinting prevention (hides WebDriver, adds Chrome object)
- Request throttling (max 2 concurrent, 5 second intervals)
- Stealth mode via Playwright context modifications
- Headless mode by default (configurable via .env)

#### Error Handling
All errors are handled with retry logic:
- Network errors: Retry 3 times with exponential backoff
- Parsing errors: Try alternative strategies, log and continue
- Rate limiting: Should pause (not implemented - scraper stops)
- Database errors: Log to scrape_errors table
- All errors logged to Winston (logs/scraper.log)

#### Concurrency Control
- Uses `p-queue` for job scraping queue
- Max 2 concurrent browser operations
- Rate limiting: 1 batch per 5 seconds
- Ensures LinkedIn isn't overwhelmed with requests

### Data Flow Diagram

```
User Input → Validate → Create Search Record → Launch Browser
                                                       ↓
                                    Build Search URL with Filters
                                                       ↓
                                    Navigate to LinkedIn Jobs
                                                       ↓
                            ┌──────────────────────────┴──────────────┐
                            ↓                                          ↓
                    Extract Job Cards                      Show Progress UI
                            ↓                                          ↑
                    Queue Job Scrapes ────────────────────────────────┘
                            ↓
            ┌───────────────┴────────────────┐
            ↓                                 ↓
    Click Job Card                    Extract Details
            ↓                                 ↓
    Try JSON-LD ──(fail)──> Try HTML  Parse Posted Date
            ↓                                 ↓
         Save to Database              Update Search Stats
                                              ↓
                                    Complete & Show Summary
```

## Important Considerations

### Legal & Ethical

**⚠️ CRITICAL:** LinkedIn's Terms of Service prohibit automated scraping. This tool is for **educational purposes only**. When working on this code:

- Do NOT encourage large-scale scraping (max 50-100 jobs per session)
- Always mention legal implications in documentation
- Recommend official APIs for production use
- Suggest reasonable rate limits
- Include legal disclaimers in any new features
- Never add authentication/login features (increases legal risk)

### Rate Limiting

LinkedIn actively blocks aggressive scraping:
- Typically blocks around page 10 per IP address
- Use delays of 3-7 seconds minimum between requests
- Limit concurrent requests to 1-2
- Default max pages: 10 (configurable via MAX_PAGES_PER_SEARCH)
- Consider proxy rotation for production (not implemented)

### Error Handling Strategy

All scraping errors are logged to:
- `logs/scraper.log` - Winston structured logs with full context
- `scrape_errors` table - Database records for analysis
- Console output - User-friendly error messages

Use retry logic with exponential backoff (implemented via `p-retry` with 3 retries).

## Testing Approach

When testing the scraper:

1. **Start small**: Use `--limit 10` for initial tests
2. **Monitor logs**: Check `logs/scraper.log` for errors
3. **Verify data**: Use `npm run dev list` to inspect results
4. **Check database**: SQLite file at `data/linkedin-jobs.db`
5. **Watch for blocks**: If scraping stops early, you may be rate-limited
6. **Test incrementally**: Add features one at a time and test thoroughly

## Common Issues

### "Browser not initialized"
- Run: `npx playwright install chromium`
- Check browser dependencies on Linux systems

### Rate limiting/blocking
- Increase delays in `.env`: `REQUEST_DELAY_MIN=5000`
- Reduce concurrency: `MAX_CONCURRENT_REQUESTS=1`
- Lower limit: `--limit 20`
- Wait 24 hours before retrying from same IP

### Parsing failures
- LinkedIn may have changed HTML structure
- Check logs for specific selectors that failed
- Parser has fallback strategies (JSON-LD → HTML)
- May need to update selectors in Parser.ts

### TypeScript errors
- Ensure DOM types in lib: `"lib": ["ES2022", "DOM"]`
- Code in `page.evaluate()` runs in browser context
- Use proper type assertions for browser APIs

### Database locked errors
- SQLite uses WAL mode to reduce locking
- Close other connections to the database
- Check file permissions on data/ directory

## Environment Variables

Configure via `.env` file in linkedin-scraper/:

**Key settings:**
- `DATABASE_PATH` - SQLite database location (default: ./data/linkedin-jobs.db)
- `HEADLESS` - Run browser headless (default: true)
- `MAX_CONCURRENT_REQUESTS` - Concurrency limit (default: 2)
- `REQUEST_DELAY_MIN/MAX` - Delay range in ms (default: 3000-7000)
- `MAX_PAGES_PER_SEARCH` - Page limit per search (default: 10)
- `MAX_RETRIES` - Retry attempts for failed scrapes (default: 3)
- `LOG_LEVEL` - Logging verbosity: error, warn, info, debug (default: info)
- `LOG_FILE` - Log file path (default: ./logs/scraper.log)
- `BROWSER_TYPE` - Browser to use: chromium, firefox, webkit (default: chromium)

**Proxy settings (optional, not fully tested):**
- `PROXY_ENABLED` - Enable proxy (default: false)
- `PROXY_HOST`, `PROXY_PORT`, `PROXY_USERNAME`, `PROXY_PASSWORD`

## Adding New Features

When adding features to linkedin-scraper:

1. **Update types** in `src/types/index.ts` first
2. **Add database fields** in `src/database/schema.ts` and repositories
3. **Implement business logic** in `src/services/`
4. **Add CLI command** in `src/cli/commands/` and register in cli/index.ts
5. **Update UI** in `src/cli/ui/` if needed
6. **Update README.md** with usage examples
7. **Test with small limits** before full runs
8. **Update .env.example** if adding new config

## Dependencies to Note

**Core:**
- `playwright` - Browser automation (chose over Puppeteer for better TypeScript support)
- `better-sqlite3` - Synchronous SQLite (faster than async for this use case, simpler error handling)
- `drizzle-orm` - Type-safe ORM without code generation (lighter than Prisma)

**CLI:**
- `commander` - CLI framework (industry standard)
- `inquirer` - Interactive prompts (rich question types)
- `chalk` - Terminal colors (most popular)
- `ora` - Terminal spinners (elegant animations)
- `cli-progress` - Progress bars (highly customizable)
- `boxen` - Terminal boxes (nice formatting)
- `cli-table3` - Tables (maintained fork of cli-table)

**Utilities:**
- `p-queue` - Concurrency control (promise-based, easy to use)
- `p-retry` - Retry logic (exponential backoff support)
- `date-fns` - Date parsing (LinkedIn uses relative dates like "2 days ago")
- `zod` - Runtime validation (TypeScript-first, great DX)
- `winston` - Logging (structured logging, transports, popular)
- `dotenv` - Environment variables (standard)

## CLI Commands Reference

**scrape** - Main scraping command
- Options: position, location, experience-level, employment-type, date-posted, limit, interactive
- Creates search record, launches browser, extracts jobs, saves to database
- Shows real-time progress with stats

**list** - View scraped jobs
- Options: search-id, company, location, date-from, limit
- Displays jobs in formatted table
- Defaults to 20 most recent jobs

**export** - Export jobs to file
- Options: search-id, format (json/csv), output
- Exports all jobs or filtered by search-id
- Auto-generates filename if not provided

**clear** - Clear database
- Options: yes (skip confirmation)
- Deletes all jobs, searches, and errors
- Prompts for confirmation unless --yes

## Performance Characteristics

- **Scraping speed**: ~4-6 jobs per minute (varies by network, LinkedIn response time)
- **Memory usage**: ~150-200 MB for Chromium + Node.js process
- **Database size**: ~1-2 KB per job record (depends on description length)
- **Network usage**: ~500 KB - 1 MB per job page load
- **CPU usage**: Low (mostly I/O bound, waiting for page loads)

## Future Enhancement Ideas

Based on the original architecture design, potential enhancements:

1. **Email Notifications**: Alert when new jobs matching criteria are posted
2. **ML Job Matching**: Score jobs based on user profile/resume
3. **Company Insights**: Scrape company pages, employee reviews
4. **Application Tracking**: Mark jobs as applied/rejected/interview
5. **Resume Optimization**: Suggest resume keywords based on job descriptions
6. **Advanced Deduplication**: ML-based similarity detection
7. **Cloud Deployment**: Run as scheduled Lambda/Cloud Function
8. **Web Dashboard**: React UI for browsing jobs
9. **Proxy Rotation**: Automatic proxy switching for scale
10. **API Interception**: Monitor LinkedIn's internal APIs

## Documentation Files

- **README.md** - User guide with installation and usage examples
- **SETUP.md** - Detailed installation instructions for different platforms
- **how-to-scrape-linkedin.md** - Research on scraping methods, tools, APIs
- **.env.example** - Template for environment configuration

## License

MIT License - Copyright (c) 2025 Mohamadmehdi Kharatizadeh

---

**Note**: This project was built according to requirements in prompt.md and designed using architecture.md as the blueprint. Both files have been integrated into this documentation for future reference.
