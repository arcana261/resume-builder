# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a complete job search management system consisting of two main applications:

1. **linkedin-scraper**: CLI tool to scrape job postings from LinkedIn
2. **job-browser**: Web application to browse and filter scraped jobs

### Original Requirements

The LinkedIn scraper was built to fulfill these requirements:
1. Scrape job opportunities from LinkedIn
2. Store scraped data in a local database
3. Filter by job position and location
4. Store job search history in the database
5. Capture job posting timestamps
6. Display progress bars and terminal-based UI during scraping

The job browser extends this with a web UI for exploring scraped data.

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
- Vitest + JSDOM (testing framework)

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
│   │   └── anti-detection/   # Enterprise anti-detection system (6 phases)
│   │       ├── AntiDetectionManager.ts       # Main orchestrator
│   │       ├── fingerprint/                  # Phase 1 & 4
│   │       │   ├── FingerprintManager.ts
│   │       │   ├── BrowserFingerprint.ts
│   │       │   └── advanced/
│   │       │       └── AdvancedFingerprintScripts.ts
│   │       ├── behavior/                     # Phase 2
│   │       │   └── BehaviorManager.ts
│   │       ├── network/                      # Phase 3
│   │       │   └── NetworkManager.ts
│   │       ├── stealth/                      # Phase 1
│   │       │   ├── StealthManager.ts
│   │       │   └── StealthScripts.ts
│   │       ├── detection/                    # Phase 5
│   │       │   └── DetectionMonitor.ts
│   │       ├── ml/                           # Phase 6
│   │       │   ├── MLPatternAnalyzer.ts
│   │       │   ├── TimingPatternAnalyzer.ts
│   │       │   ├── BehaviorPatternRecognizer.ts
│   │       │   ├── AnomalyDetector.ts
│   │       │   └── TrainingDataCollector.ts
│   │       ├── types.ts
│   │       └── index.ts
│   ├── database/
│   │   ├── schema.ts         # Drizzle schema definitions
│   │   ├── repositories/     # JobRepository, SearchRepository
│   │   └── db.ts             # Database connection & init
│   ├── services/             # ScraperService orchestration
│   ├── utils/                # Logger, validators, date helpers
│   └── types/                # TypeScript type definitions
├── tests/                    # 119 unit tests with 100% pass rate
│   ├── unit/                 # Parser, Repository, Filter tests
│   ├── fixtures/             # Real LinkedIn HTML samples
│   ├── mocks/                # MockPage with JSDOM
│   └── helpers/              # Test utilities
├── data/                     # SQLite database & ML training data (gitignored)
├── logs/                     # Application logs (gitignored)
├── dist/                     # Compiled JS (gitignored)
├── software-engineer.sh      # Helper script for testing
└── .gitignore
```

### job-browser/

A full-stack web application for browsing and filtering scraped LinkedIn job postings.

**Technology Stack:**

Frontend:
- React 18 + TypeScript
- Vite (build tool)
- TanStack React Query (data fetching)
- Zustand (state management)
- React Router (routing)
- Tailwind CSS (styling)
- DOMPurify (XSS protection)
- date-fns (date formatting)

Backend:
- Express + TypeScript
- better-sqlite3 (SQLite database)
- CORS middleware

**Project Structure:**
```
job-browser/
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/       # FilterPanel, JobCard, JobList, SafeHTML
│   │   ├── pages/            # JobBrowser, JobDetailPage
│   │   ├── hooks/            # useJobs (React Query)
│   │   ├── store/            # filterStore (Zustand)
│   │   ├── lib/              # api, utils
│   │   └── styles/           # Tailwind + custom CSS
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/                   # Express backend
│   ├── src/
│   │   ├── routes/           # jobs, searches
│   │   ├── services/         # JobService, DatabaseService
│   │   └── middleware/       # cors, errorHandler
│   └── .env.example
├── shared/                   # Shared TypeScript types
│   └── types.ts
└── package.json              # Workspace scripts
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
npm test                       # Run 119 unit tests
npm run test:watch             # Test watch mode
npm run test:ui                # Interactive test UI
npm run test:coverage          # With coverage report
```

**Usage:**
```bash
# Interactive scraping
npm run dev scrape --interactive

# CLI mode
npm run dev scrape --position "Software Engineer" --location "SF" --limit 50

# Refresh existing jobs
npm run dev scrape --position "Software Engineer" --refresh

# List scraped jobs
npm run dev list --limit 20

# Export to JSON/CSV
npm run dev export --format json --output jobs.json

# Clear database
npm run dev clear

# Helper script for testing (Software Engineer jobs in London)
./software-engineer.sh
```

**Helper Scripts:**
- `software-engineer.sh` - Pre-configured script for testing scraper with Software Engineer jobs in London
  - Uses `--refresh` flag to update existing jobs
  - Mid-Senior level, Full-time, Past 24 hours filter
  - Headed mode (non-headless) for debugging
  - Limit: 2 jobs for quick testing

### job-browser

**Setup:**
```bash
cd job-browser
npm install              # Install all dependencies (client + server)
```

**Development:**
```bash
npm run dev              # Start both client and server
npm run dev:client       # Start client only (port 5173)
npm run dev:server       # Start server only (port 3000)
npm run build            # Build both client and server
npm run build:client     # Build client only
npm run build:server     # Build server only
```

**Production:**
```bash
npm run start            # Start production server (serves built client)
```

**Configuration:**
- Client runs on http://localhost:5173
- Server runs on http://localhost:3000
- Database path configured in server/.env (defaults to ../linkedin-scraper/data/linkedin-jobs.db)

## Node.js Version Management

This project uses **fnm** (Fast Node Manager) for Node.js version management:

- Required: Node.js >= 18.0.0
- Current: v24.11.1 (pinned via `.node-version`)
- fnm auto-switches to correct version when entering directories

**fnm is configured in ~/.bashrc:**
```bash
eval "$(fnm env --use-on-cd)"
```

## Architecture Details

### Database Schema (SQLite)

Both applications share the same SQLite database.

**jobs table:**
- Primary fields: job_id (unique), title, company, location, description
- Employment details: employment_type, seniority_level, industry
- Salary: salary_min, salary_max, salary_currency
- Metadata: job_url, apply_url, posted_at, scraped_at, search_id
- Storage: raw_data (JSON), page_html (full LinkedIn HTML)
- Audit: created_at, updated_at
- Indexes: job_id, company, location, posted_at, search_id
- Full-text search: jobs_fts virtual table (FTS5)

**searches table:**
- Tracks each scrape session with query, location, filters (JSON)
- Counts: total_results, successful_scrapes, failed_scrapes
- Status: running, completed, failed, cancelled
- Timestamps: started_at, completed_at, created_at

**scrape_errors table:**
- Logs all scraping failures for debugging
- Fields: search_id, job_id, error_type, error_message, url, occurred_at

### LinkedIn Scraper Architecture

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
3. **Job ID fallback** - Use card.id when JSON-LD missing identifier

This ensures resilience against HTML structure changes.

**Date Parsing:**
The `parsePostedDate` utility handles both ISO date strings and relative dates:
- ISO dates: `"2025-12-09T14:25:55.000Z"` (from LinkedIn JSON-LD)
- Relative dates: `"2 days ago"`, `"1 week ago"`, `"3 hours ago"`
- Special cases: `"today"`, `"just now"`

It tries ISO parsing first, then falls back to relative date parsing if needed. This ensures accurate `posted_at` timestamps that differ from `scraped_at`. Use the `--refresh` flag to update existing jobs with correct posted dates.

#### Filter URL Mapping
Job filters are mapped to LinkedIn URL parameters:
- Experience levels: Internship(1), Entry(2), Associate(3), Mid-Senior(4), Director(5), Executive(6)
- Employment types: Full-time(F), Part-time(P), Contract(C), Temporary(T), Volunteer(V), Internship(I)
- Date posted: Past 24h(r86400), Past Week(r604800), Past Month(r2592000)
- Remote: On-site(1), Remote(2), Hybrid(3)

#### Enterprise Anti-Detection System (6 Phases)

The scraper includes a comprehensive anti-detection architecture implemented across 6 phases with 16 TypeScript modules (~4,500+ lines):

**Phase 1: Core Infrastructure & Fingerprinting**
- Browser fingerprint randomization (viewport, user-agent, locale, timezone)
- Screen resolution and pixel ratio randomization
- Platform and language randomization
- Stealth patches (hideWebDriver, injectChrome, patchNavigator)
- Automation flag removal
- WebDriver property concealment

**Phase 2: Behavioral Simulation**
- Human-like mouse movement with Bézier curves
- Natural scrolling patterns with variable speeds and directions
- Reading time simulation based on content length (words per minute)
- Hover behavior before interactions (configurable probability)
- Random delays and timing variations
- Pre/post navigation hooks for realistic browsing

**Phase 3: Network Management**
- HTTP header randomization (Accept, Accept-Language, Accept-Encoding, etc.)
- Cookie and session management across sessions
- Storage data persistence (localStorage, sessionStorage)
- Proxy rotation support (configurable, disabled by default)
- Fingerprint-based session tracking

**Phase 4: Advanced Fingerprinting**
- Canvas fingerprinting with controlled noise injection
- WebGL parameter randomization (vendor, renderer)
- Audio context fingerprinting
- Font enumeration randomization
- Comprehensive fingerprint script generation
- Injected via page.addInitScript for early execution

**Phase 5: Detection Monitoring & Adaptive Strategies**
- CAPTCHA detection (reCAPTCHA, hCaptcha, generic patterns)
  - 10 CSS selectors, 6 text patterns, 3 URL patterns
- Rate limit detection (HTTP 429, 403, 503, retry-after headers)
- Block detection (Cloudflare, anti-bot services, access denied patterns)
- Suspicious behavior monitoring (fast responses, empty content, unexpected redirects)
- Adaptive delay multipliers:
  - Increases 1.2x-1.5x on detection
  - Decreases 0.9x when clean
  - Range: 1.0x - 5.0x
- Automatic abort conditions:
  - 3+ critical detections in 5 minutes OR
  - 5+ consecutive detections
- Detection history tracking (max 100 records, 5-minute sliding window)

**Phase 6: Machine Learning Patterns (Statistical ML)**
Uses lightweight statistical methods (no TensorFlow/PyTorch required):

*Timing Pattern Analysis:*
- Records timing observations (action type, delay, success/failure)
- Predicts optimal delays using mean + 0.5 × stdDev
- Adaptive adjustment (increase 20-30% on failure, decrease 5-10% on success)
- Caches predictions for 5 minutes
- Supports 5 action types: navigation, click, scroll, typing, hover

*Behavioral Pattern Recognition:*
- Uses Markov chains to model state transitions
- Predicts next action based on transition probabilities
- Detects anomalous sequences using Levenshtein distance
- Generates human-like behavior sequences
- Pattern frequency analysis

*Anomaly Detection:*
- Three statistical methods:
  - Z-score (standard deviation-based, threshold: 3.0)
  - IQR (interquartile range outliers, multiplier: 1.5)
  - MAD (median absolute deviation, multiplier: 3.5)
- Ensemble approach (2+ methods must agree)
- Tracks unlimited metrics (response time, content length, status codes, etc.)
- Calculates comprehensive statistics (mean, median, quartiles, MAD)

*Training Data Collection:*
- Persists learning data to `./data/training/training-data.json`
- Auto-saves every 10 minutes
- Tracks scraping sessions with success/failure stats
- Maximum limits to prevent unbounded growth:
  - 1,000 timing observations per action type
  - 500 behavior sequences
  - 1,000 metric observations per metric
  - 100 session records
- 24-hour time window for observations
- Continuous learning across sessions

**Integration & Configuration:**
- `AntiDetectionManager` orchestrates all components
- Default "balanced" mode enables all features
- Configurable via environment variables
- Optional async initialization for ML components
- Comprehensive logging with Winston
- Browser.ts integrates anti-detection hooks
- ScraperService.ts manages ML sessions and lifecycle

**Performance Characteristics:**
- Prediction latency: <1ms (statistical methods)
- Memory usage: ~50-100 MB for ML data
- Training data size: ~100-500 KB on disk
- Zero external ML dependencies (pure TypeScript)

#### Error Handling & Debugging
All errors are handled with comprehensive retry logic:
- Network errors: Retry 3 times with exponential backoff via p-retry
- Parsing errors: Try alternative strategies, log and continue
- Modal overlays: Auto-remove with loop (up to 10 attempts)
- Database errors: Log to scrape_errors table
- Debug artifacts: Auto-save screenshot + HTML on failures to logs/
  - First 3 failures per search
  - Each retry attempt
  - Complete retry exhaustion
- All errors logged to Winston (logs/scraper.log)
- Browser console forwarding to Node.js logs (opt-in via --log-browser-errors)

#### Refresh Mode (--refresh flag)
- By default, existing jobs are skipped during scraping
- `--refresh` flag forces update of existing job records
- Updates: description, salary, location, employment_type, seniority_level, etc.
- Updates scraped_at and updated_at timestamps
- Useful for tracking changes to job postings over time

#### Concurrency Control
- Uses `p-queue` for job scraping queue
- Max 2 concurrent browser operations
- Rate limiting: 1 batch per 5 seconds
- Ensures LinkedIn isn't overwhelmed with requests

### Job Browser Architecture

#### Frontend Architecture

**State Management:**
- Filter state managed by Zustand store (`filterStore.ts`)
- Persisted to localStorage for session continuity
- Tracks: search, companies, locations, employmentTypes, seniorityLevels, industries, salary range, date filters, sort options, pagination

**Data Fetching:**
- TanStack React Query for server state management
- Automatic caching and background refetching
- `useJobs` hook for job listings
- `useJob` hook for job details
- `useJobHTML` hook for original LinkedIn HTML

**Routing:**
- `/` - Main job browser with filters
- `/jobs/:id` - Job detail page with tabs (details, HTML, raw JSON)

**Components:**
- `FilterPanel` - Multi-criteria filtering UI with counts
- `JobList` - Paginated job cards with loading states
- `JobCard` - Job preview with metadata, description snippet, LinkedIn link
- `SafeHTML` - XSS-safe HTML rendering with DOMPurify
- `JobDetailPage` - Full job details with 3 tabs

**Safe HTML Rendering:**
- DOMPurify sanitizes all HTML content before rendering
- HTML entity decoding for double-encoded content
- Whitelist approach (only safe tags allowed)
- Tailwind prose classes for beautiful typography
- Custom CSS for enhanced formatting
- Dark mode support

#### Backend Architecture

**API Endpoints:**
```
GET  /api/jobs              # List jobs with filtering, pagination, sorting
GET  /api/jobs/:id          # Get single job by ID
GET  /api/jobs/:id/html     # Get original LinkedIn HTML
GET  /api/searches          # List all searches
GET  /api/searches/:id      # Get single search with jobs
```

**JobService:**
- Handles all business logic for job retrieval
- Full-text search using SQLite FTS5
- Complex filtering (company, location, type, seniority, industry, salary, dates)
- Pagination with limit/offset
- Sorting by multiple fields
- Filter options with counts for UI

**DatabaseService:**
- Singleton pattern for database connection
- Shared database with linkedin-scraper
- SQLite with WAL mode for concurrency

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
            ↓                                 ↓
      Navigate Back                   Complete & Show Summary
                                              ↓
                                    Browse with Web UI
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

### XSS Protection

Job descriptions contain user-generated HTML that must be sanitized:
- Use DOMPurify before rendering any HTML content
- Whitelist safe tags only (p, strong, ul, ol, li, etc.)
- Strip dangerous tags (script, iframe, object, embed)
- HTML entity decoding for display
- Never use `dangerouslySetInnerHTML` without sanitization

## Testing Framework

### Unit Testing with Vitest

The linkedin-scraper includes comprehensive fixture-based unit tests.

**Test Structure:**
```
tests/
├── unit/                      # Unit tests
│   ├── Parser.test.ts         # 26 tests - All extraction methods
│   ├── JobRepository.test.ts  # 32 tests - CRUD & filtering
│   ├── SearchRepository.test.ts # 26 tests - Search lifecycle
│   └── JobFilter.test.ts      # 35 tests - URL building
├── fixtures/                  # Test data
│   └── linkedin-search-91-jobs.html  # Real LinkedIn HTML
├── mocks/                     # Mock implementations
│   └── MockPage.ts            # Mock Playwright Page with JSDOM
└── helpers/                   # Test utilities
    ├── fixture-loader.ts      # Load HTML fixtures
    └── test-database.ts       # In-memory SQLite

Total: 119 tests, 100% passing
```

**Test Commands:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Interactive UI
npm run test:coverage # With coverage report
```

**Key Testing Features:**
- **Fixture-based**: Uses real LinkedIn HTML as test input
- **In-memory database**: SQLite in-memory for fast repository tests
- **Mock Playwright Page**: JSDOM-based mock for Parser tests without browser
- **White-box testing**: Tests internal implementation details
- **Dependency injection**: Repositories accept optional database parameter

## Common Issues

### LinkedIn Scraper

**"Browser not initialized"**
- Run: `npx playwright install chromium`
- Check browser dependencies on Linux systems

**Rate limiting/blocking**
- Increase delays in `.env`: `REQUEST_DELAY_MIN=5000`
- Reduce concurrency: `MAX_CONCURRENT_REQUESTS=1`
- Lower limit: `--limit 20`
- Wait 24 hours before retrying from same IP

**Parsing failures**
- LinkedIn may have changed HTML structure
- Check logs/ for debug artifacts (screenshot + HTML)
- Analyze saved HTML to find new selector patterns
- Parser has fallback strategies (JSON-LD → HTML → ID fallback)
- May need to update selectors in Parser.ts

**Modal overlays blocking clicks**
- Auto-removed by Browser.removeModalOverlay()
- Loops up to 10 times to handle stacked modals
- Check browser console logs ([ModalRemoval] prefix)

**"logger is not defined" in browser context**
- Code in page.evaluate() runs in browser, not Node.js
- Use console.log instead of logger inside evaluate()
- Browser console forwarded to Node.js via listeners

**Database locked errors**
- SQLite uses WAL mode to reduce locking
- Close other connections to the database
- Check file permissions on data/ directory

**Migration warnings**
- "ALTER TABLE jobs ADD COLUMN page_html" - column already exists
- Migration checks for existence before adding
- Safe to ignore if column exists

### Job Browser

**CORS errors**
- Server must be running on port 3000
- Client must proxy API requests in vite.config.ts
- Check server/.env for correct configuration

**Empty job list**
- Ensure linkedin-scraper has run and populated database
- Check DATABASE_PATH in server/.env
- Verify database file exists and has data

**HTML not rendering**
- Check SafeHTML component is used
- Verify DOMPurify is installed
- Check browser console for errors

**Filters not working**
- Clear localStorage and refresh
- Check filter state in Zustand DevTools
- Verify API response includes filter options

## Environment Variables

### linkedin-scraper/.env

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

### job-browser/server/.env

**Settings:**
- `PORT` - Server port (default: 3000)
- `DATABASE_PATH` - SQLite database path (default: ../../linkedin-scraper/data/linkedin-jobs.db)
- `CORS_ORIGIN` - Allowed CORS origins (default: http://localhost:5173)

## Adding New Features

### LinkedIn Scraper

When adding features to linkedin-scraper:

1. **Update types** in `src/types/index.ts` first
2. **Add database fields** in `src/database/schema.ts` and repositories
3. **Add migration** in `src/database/db.ts` (runMigrations function)
4. **Implement business logic** in `src/services/`
5. **Add CLI command** in `src/cli/commands/` and register in cli/index.ts
6. **Update validator** in `src/utils/validators.ts` (Zod schema)
7. **Update UI** in `src/cli/ui/` if needed
8. **Write tests** in `tests/unit/` with fixtures
9. **Update README.md** with usage examples
10. **Update .env.example** if adding new config

### Job Browser

When adding features to job-browser:

1. **Update shared types** in `shared/types.ts`
2. **Add backend logic** in `server/src/services/`
3. **Add API endpoint** in `server/src/routes/`
4. **Update frontend API client** in `client/src/lib/api.ts`
5. **Add React Query hook** in `client/src/hooks/`
6. **Update UI components** in `client/src/components/` or `pages/`
7. **Update Zustand store** if adding filters/state
8. **Update Tailwind config** if adding new styles
9. **Test thoroughly** (no automated tests yet)
10. **Update README.md** with usage examples

## Dependencies to Note

### LinkedIn Scraper

**Core:**
- `playwright` - Browser automation (chose over Puppeteer for better TypeScript support)
- `better-sqlite3` - Synchronous SQLite (faster than async, simpler error handling)
- `drizzle-orm` - Type-safe ORM without code generation (lighter than Prisma)

**CLI:**
- `commander` - CLI framework (industry standard)
- `inquirer` - Interactive prompts (rich question types)
- `chalk` - Terminal colors (most popular)
- `ora` - Terminal spinners (elegant animations)
- `cli-progress` - Progress bars (highly customizable)

**Utilities:**
- `p-queue` - Concurrency control (promise-based)
- `p-retry` - Retry logic (exponential backoff)
- `date-fns` - Date parsing (LinkedIn uses relative dates)
- `zod` - Runtime validation (TypeScript-first)
- `winston` - Logging (structured logging)

**Testing:**
- `vitest` - Test runner (Vite-powered, faster than Jest)
- `jsdom` - DOM implementation for Node.js
- `happy-dom` - Alternative DOM for faster tests

### Job Browser

**Frontend:**
- `react` + `react-dom` - UI framework
- `react-router-dom` - Client-side routing
- `@tanstack/react-query` - Server state management
- `zustand` - Client state management (simpler than Redux)
- `tailwindcss` - Utility-first CSS
- `dompurify` - HTML sanitization
- `isomorphic-dompurify` - Universal DOMPurify
- `date-fns` - Date formatting
- `lucide-react` - Icon library

**Backend:**
- `express` - Web framework
- `better-sqlite3` - SQLite driver (shared with scraper)
- `cors` - CORS middleware
- `dotenv` - Environment variables

**Build:**
- `vite` - Frontend build tool
- `typescript` - Type safety
- `tsx` - TypeScript execution
- `concurrently` - Run multiple commands

## CLI Commands Reference

### linkedin-scraper

**scrape** - Main scraping command
- Options: position, location, experience-level, employment-type, date-posted, remote-option, limit, refresh, interactive, log-browser-errors
- Creates search record, launches browser, extracts jobs, saves to database
- Shows real-time progress with stats
- `--refresh` flag updates existing jobs instead of skipping

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

### job-browser

No CLI commands - web application accessed via browser at http://localhost:5173

## Performance Characteristics

### LinkedIn Scraper
- **Scraping speed**: ~4-6 jobs per minute (varies by network, LinkedIn response time)
- **Memory usage**: ~150-200 MB for Chromium + Node.js process
- **Database size**: ~1-2 KB per job record (depends on description length)
- **Network usage**: ~500 KB - 1 MB per job page load
- **CPU usage**: Low (mostly I/O bound, waiting for page loads)

### Job Browser
- **Initial load**: ~100-200ms (depends on database size)
- **Filter response**: <50ms (SQLite FTS5 is fast)
- **Pagination**: <30ms per page
- **Memory usage**: ~50-100 MB (Express + SQLite)
- **Client bundle**: ~200-300 KB gzipped

## Future Enhancement Ideas

Based on the current architecture, potential enhancements:

### LinkedIn Scraper
1. **Email Notifications**: Alert when new jobs matching criteria are posted
2. **ML Job Matching**: Score jobs based on user profile/resume
3. **Company Insights**: Scrape company pages, employee reviews
4. **Advanced Deduplication**: ML-based similarity detection
5. **Cloud Deployment**: Run as scheduled Lambda/Cloud Function
6. **Proxy Rotation**: Automatic proxy switching for scale
7. **API Interception**: Monitor LinkedIn's internal APIs
8. **Scheduled Scraping**: Cron-based automatic scraping
9. **Multi-platform**: Support Indeed, Glassdoor, etc.

### Job Browser
1. **Application Tracking**: Mark jobs as applied/rejected/interview
2. **Resume Optimization**: Suggest keywords based on job descriptions
3. **Job Analytics**: Visualize trends (salaries, locations, companies)
4. **Saved Searches**: Save filter combinations
5. **Email Alerts**: Notify on new jobs matching filters
6. **Export to PDF**: Generate job reports
7. **Company Research**: Link to company info, reviews
8. **Skill Extraction**: Parse required skills from descriptions
9. **Authentication**: User accounts and personalization
10. **Mobile App**: React Native version

## Documentation Files

### linkedin-scraper/
- **README.md** - User guide with installation and usage examples
- **SETUP.md** - Detailed installation instructions for different platforms
- **how-to-scrape-linkedin.md** - Research on scraping methods, tools, APIs
- **.env.example** - Template for environment configuration

### job-browser/
- **README.md** - Setup and usage guide
- **QUICKSTART.md** - Quick start guide with examples
- **server/.env.example** - Backend configuration template

## License

MIT License - Copyright (c) 2025 Mohamadmehdi Kharatizadeh

---

**Note**: This project evolved from a simple scraper to a complete job search management system. The architecture.md and prompt.md files have been integrated into this documentation for reference.
