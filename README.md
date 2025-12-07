# Resume Builder

Tools for building and managing resumes, including a LinkedIn job scraper to gather job postings data for resume optimization and job search.

## Project Structure

### `linkedin-scraper/`

A TypeScript CLI application for scraping LinkedIn job postings with advanced filtering capabilities and local database storage.

**Features:**
- 🔍 Advanced filtering (position, location, experience level, employment type, date posted)
- 💾 Local SQLite database storage
- 📊 Real-time progress tracking with terminal UI
- 🎯 Multi-strategy parsing (JSON-LD, HTML fallback)
- 🔄 Automatic retry logic with exponential backoff
- 📋 Export to JSON/CSV

**Tech Stack:** TypeScript, Node.js, Playwright, SQLite, Drizzle ORM

## Quick Start

### Prerequisites

- Node.js >= 18.0.0 (managed via fnm)
- npm or pnpm

### Installation

```bash
cd linkedin-scraper

# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Build the project
npm run build
```

### Usage

```bash
# Interactive mode (recommended)
npm run dev scrape --interactive

# CLI mode
npm run dev scrape \
  --position "Software Engineer" \
  --location "San Francisco, CA" \
  --limit 50

# List scraped jobs
npm run dev list --limit 20

# Export to JSON
npm run dev export --format json --output jobs.json
```

## Commands

- **`scrape`** - Scrape LinkedIn job postings with filters
- **`list`** - View scraped jobs in formatted table
- **`export`** - Export jobs to JSON or CSV
- **`clear`** - Clear database

See `linkedin-scraper/README.md` for detailed documentation.

## Documentation

- **CLAUDE.md** - Complete developer guide for working with this repository
- **linkedin-scraper/README.md** - User guide with examples
- **linkedin-scraper/SETUP.md** - Installation instructions
- **how-to-scrape-linkedin.md** - Research on LinkedIn scraping methods

## ⚠️ Legal Disclaimer

The LinkedIn scraper is for **educational purposes only**. LinkedIn's Terms of Service prohibit automated scraping. Users are responsible for ensuring compliance with:

- LinkedIn's Terms of Service
- Local data protection laws (GDPR, CCPA, etc.)
- Computer Fraud and Abuse Act (CFAA)
- Website scraping regulations in their jurisdiction

For production use, consider using official LinkedIn APIs or licensed third-party data providers.

## Development

### Node.js Version Management

This project uses **fnm** (Fast Node Manager):
```bash
# fnm automatically loads Node.js v24.11.1 when entering linkedin-scraper/
cd linkedin-scraper
node --version  # v24.11.1
```

### Testing

Start with small limits to avoid rate limiting:
```bash
npm run dev scrape --position "Test" --limit 10
```

Monitor logs at `linkedin-scraper/logs/scraper.log` for errors.

## License

MIT License - Copyright (c) 2025 Mohamadmehdi Kharatizadeh
