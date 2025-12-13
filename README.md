# Resume Builder

A complete job search management system with tools for scraping LinkedIn job postings and browsing them through a modern web interface.

## Project Structure

### `linkedin-scraper/`

A TypeScript CLI application for scraping LinkedIn job postings with advanced filtering capabilities and local database storage.

**Features:**
- 🔍 Advanced filtering (position, location, experience level, employment type, date posted, remote work)
- 💾 Local SQLite database storage with full-text search
- 🛡️ **Enterprise anti-detection system** (6 phases, fingerprinting, behavioral simulation, ML patterns)
- 📊 Real-time progress tracking with terminal UI
- 🎯 Multi-strategy parsing (JSON-LD, HTML fallback, job ID fallback)
- 🔄 Automatic retry logic with exponential backoff and debug artifacts
- 🔁 Refresh mode to update existing job postings
- 📋 Export to JSON/CSV
- ✅ 119 unit tests with 100% pass rate

**Tech Stack:** TypeScript, Node.js, Playwright, SQLite, Drizzle ORM, Vitest

### `job-browser/`

A full-stack web application for browsing and filtering scraped LinkedIn job postings.

**Features:**
- 🌐 Modern React UI with Tailwind CSS
- 🔍 Full-text search and multi-criteria filtering
- 📄 Beautiful HTML rendering with XSS protection (DOMPurify)
- 💾 Persistent filter state with localStorage
- 📊 Real-time filter counts and statistics
- 🎨 Dark mode support
- 📱 Responsive design
- 🔗 Direct links to LinkedIn job postings
- 📋 View original LinkedIn HTML and raw JSON data

**Tech Stack:** React, TypeScript, Vite, TanStack Query, Zustand, Express, Tailwind CSS

## Quick Start

### Prerequisites

- Node.js >= 18.0.0 (managed via fnm)
- npm

### LinkedIn Scraper

```bash
cd linkedin-scraper

# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Build the project
npm run build

# Interactive scraping
npm run dev scrape --interactive

# CLI mode with filters
npm run dev scrape \
  --position "Software Engineer" \
  --location "San Francisco, CA" \
  --limit 50

# Refresh existing jobs
npm run dev scrape --position "Software Engineer" --refresh

# List scraped jobs
npm run dev list --limit 20

# Export to JSON
npm run dev export --format json --output jobs.json

# Run tests
npm test
```

### Job Browser

```bash
cd job-browser

# Install dependencies
npm install

# Start both client and server
npm run dev

# Visit http://localhost:5173 in browser
```

**Alternative commands:**
```bash
npm run dev:client  # Client only (port 5173)
npm run dev:server  # Server only (port 3000)
npm run build       # Build both
npm run start       # Production server
```

## Commands

### LinkedIn Scraper CLI

- **`scrape`** - Scrape LinkedIn job postings with filters
  - `--position <string>` - Job position/title
  - `--location <string>` - Location
  - `--experience-level <levels...>` - Experience levels (Internship, Entry Level, etc.)
  - `--employment-type <types...>` - Employment types (Full-time, Part-time, etc.)
  - `--date-posted <date>` - Date posted filter
  - `--remote-option <option>` - Remote work (On-site, Remote, Hybrid)
  - `--limit <number>` - Max jobs to scrape (default: 50)
  - `--refresh` - Force update existing jobs
  - `--interactive` - Interactive mode with prompts
  - `--log-browser-errors` - Log browser console errors

- **`list`** - View scraped jobs in formatted table
  - `--search-id <id>` - Filter by search ID
  - `--company <name>` - Filter by company
  - `--location <location>` - Filter by location
  - `--date-from <date>` - Jobs posted after date
  - `--limit <number>` - Max results (default: 20)

- **`export`** - Export jobs to JSON or CSV
  - `--search-id <id>` - Export specific search
  - `--format <format>` - json or csv (default: json)
  - `--output <file>` - Output filename

- **`clear`** - Clear database
  - `--yes` - Skip confirmation

### Job Browser Web UI

Access the web interface at http://localhost:5173

**Features:**
- Search jobs by keyword
- Filter by company, location, employment type, seniority level, industry
- Filter by salary range
- Filter by posted date and scraped date
- Sort by posted date, scraped date, salary, title
- Pagination
- View job details with formatted HTML
- See original LinkedIn HTML
- Export raw JSON data

## Documentation

- **CLAUDE.md** - Complete developer guide for working with this repository
- **linkedin-scraper/README.md** - Detailed user guide with examples
- **linkedin-scraper/SETUP.md** - Platform-specific installation instructions
- **job-browser/README.md** - Web application setup and usage
- **job-browser/QUICKSTART.md** - Quick start guide with examples
- **how-to-scrape-linkedin.md** - Research on LinkedIn scraping methods

## ⚠️ Legal Disclaimer

The LinkedIn scraper is for **educational purposes only**. LinkedIn's Terms of Service prohibit automated scraping. Users are responsible for ensuring compliance with:

- LinkedIn's Terms of Service
- Local data protection laws (GDPR, CCPA, etc.)
- Computer Fraud and Abuse Act (CFAA)
- Website scraping regulations in their jurisdiction

**For production use, consider:**
- Official LinkedIn APIs or licensed third-party data providers
- Reasonable rate limits (max 50-100 jobs per session)
- Respecting robots.txt and Terms of Service

## Development

### Node.js Version Management

This project uses **fnm** (Fast Node Manager):
```bash
# fnm automatically loads Node.js v24.11.1 when entering directories
cd linkedin-scraper
node --version  # v24.11.1
```

### Testing

**LinkedIn Scraper (119 unit tests):**
```bash
cd linkedin-scraper
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:ui         # Interactive UI
npm run test:coverage   # With coverage
```

**Job Browser:**
Start with small limits to test:
```bash
cd linkedin-scraper
npm run dev scrape --position "Test" --limit 10

cd ../job-browser
npm run dev
```

Monitor logs at `linkedin-scraper/logs/scraper.log` for errors.

### Architecture

**Shared Database:**
Both applications use the same SQLite database located at `linkedin-scraper/data/linkedin-jobs.db`.

**Data Flow:**
1. LinkedIn Scraper → Scrapes jobs → SQLite database
2. Job Browser → Reads from database → Displays in web UI

**Key Features:**
- SQLite with WAL mode for concurrency
- Full-text search with FTS5
- Automatic migrations
- Comprehensive error logging
- Debug artifacts (screenshots + HTML on failures)

### Anti-Detection System

The LinkedIn scraper includes an enterprise-grade anti-detection system implemented across **6 phases** with 16 TypeScript modules (~4,500+ lines):

**Phase 1: Core Fingerprinting**
- Browser fingerprint randomization (viewport, user-agent, locale, timezone, platform)
- Stealth patches to hide automation (WebDriver, automation flags)
- Screen resolution and pixel ratio randomization

**Phase 2: Behavioral Simulation**
- Human-like mouse movement with Bézier curves
- Natural scrolling patterns with variable speeds
- Reading time simulation based on content length
- Hover behavior before interactions

**Phase 3: Network Management**
- HTTP header randomization
- Cookie and session persistence
- Storage data management

**Phase 4: Advanced Fingerprinting**
- Canvas fingerprinting with noise injection
- WebGL parameter randomization
- Audio context fingerprinting
- Font enumeration randomization

**Phase 5: Detection Monitoring**
- CAPTCHA detection (reCAPTCHA, hCaptcha)
- Rate limit detection (HTTP 429, retry-after headers)
- Block detection (Cloudflare, anti-bot services)
- Adaptive delay multipliers (1.2x-5.0x based on detection)
- Automatic abort on critical detections

**Phase 6: Machine Learning Patterns**
- **Timing Analysis:** Predicts optimal delays using statistical methods (mean + 0.5×stdDev)
- **Behavior Recognition:** Uses Markov chains to model human-like action sequences
- **Anomaly Detection:** Ensemble methods (z-score, IQR, MAD) to detect unusual responses
- **Training Data:** Persists learning data to disk for continuous improvement across sessions
- **Zero ML Dependencies:** Pure TypeScript statistical algorithms (no TensorFlow/PyTorch)

**Performance:**
- Prediction latency: <1ms
- Memory: ~50-100 MB for ML data
- Training data: Auto-saves every 10 minutes to `./data/training/`

**Configuration:**
- Default "balanced" mode enables all features
- Configurable via environment variables
- Optional async initialization for ML components

See `CLAUDE.md` for complete technical documentation.

## Common Issues

### LinkedIn Scraper

**Rate limiting/blocking:**
- Increase delays: `REQUEST_DELAY_MIN=5000` in `.env`
- Reduce concurrency: `MAX_CONCURRENT_REQUESTS=1`
- Lower limit: `--limit 20`
- Wait 24 hours before retrying

**Parsing failures:**
- Check `logs/` for debug artifacts (auto-saved on failures)
- Update selectors in `src/scraper/core/Parser.ts` if LinkedIn changed HTML
- Parser has multiple fallback strategies

**Browser not initialized:**
- Run: `npx playwright install chromium`
- Check browser dependencies on Linux

### Job Browser

**Empty job list:**
- Run linkedin-scraper first to populate database
- Check `DATABASE_PATH` in `server/.env`
- Verify database file exists

**CORS errors:**
- Ensure server is running on port 3000
- Check CORS configuration in `server/.env`

**Filters not working:**
- Clear browser localStorage
- Check filter state in browser DevTools
- Verify API response includes filter options

## Performance

**LinkedIn Scraper:**
- ~4-6 jobs per minute
- ~150-200 MB memory
- ~1-2 KB per job in database

**Job Browser:**
- <50ms filter response time
- ~50-100 MB memory (server)
- ~200-300 KB client bundle (gzipped)

## Future Enhancements

**LinkedIn Scraper:**
- Email notifications for new jobs
- Scheduled scraping with cron
- ML-based job matching and recommendations
- Multi-platform support (Indeed, Glassdoor)
- Cloud deployment
- Enhanced ML patterns (neural networks for deeper pattern recognition)

**Job Browser:**
- Application tracking system
- Job analytics and trends visualization
- Resume keyword optimization
- Saved search filters
- Mobile app

## License

MIT License - Copyright (c) 2025 Mohamadmehdi Kharatizadeh
