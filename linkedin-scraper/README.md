# LinkedIn Job Scraper

A TypeScript-based CLI tool for scraping LinkedIn job postings with advanced filtering capabilities, local database storage, and real-time progress tracking.

## ⚠️ Legal Disclaimer

**IMPORTANT**: This tool is for educational and personal use only. Web scraping LinkedIn violates their Terms of Service. Users are responsible for ensuring their use complies with:

- LinkedIn's Terms of Service
- Local data protection laws (GDPR, CCPA, etc.)
- Computer Fraud and Abuse Act (CFAA)
- Website scraping regulations in their jurisdiction

The developers assume no liability for misuse of this software. For production use, consider using official LinkedIn APIs or licensed third-party data providers.

## Features

- 🔍 **Advanced Filtering**: Search by job title, location, experience level, employment type, and more
- 💾 **Local Database**: SQLite storage for all scraped jobs
- 📊 **Real-time Progress**: Terminal-based UI with progress bars and live statistics
- 🎯 **Multi-Strategy Parsing**: JSON-LD, HTML, and API extraction methods
- 🔄 **Retry Logic**: Automatic retries with exponential backoff
- 📋 **Export Capabilities**: Export to JSON or CSV
- 🎨 **Beautiful CLI**: Interactive prompts and formatted table output
- 🔐 **Anti-Detection**: Stealth mode, user-agent rotation, and realistic delays

## Prerequisites

- Node.js 18.0.0 or higher
- npm or pnpm

## Installation

### Option 1: Install Dependencies and Build

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run locally
npm run dev
```

### Option 2: Install Globally

```bash
# Build and link
npm run build
npm link

# Now you can use the command anywhere
linkedin-scraper --help
```

## Quick Start

### Interactive Mode (Recommended for First-Time Users)

```bash
linkedin-scraper scrape --interactive
```

This will guide you through all available options with prompts.

### Command-Line Mode

```bash
# Basic scrape
linkedin-scraper scrape \
  --position "Software Engineer" \
  --location "San Francisco, CA" \
  --limit 50

# Advanced scrape with filters
linkedin-scraper scrape \
  --position "Data Scientist" \
  --location "Remote" \
  --experience-level "Mid-Senior" "Director" \
  --employment-type "Full-time" "Contract" \
  --date-posted "Past Week" \
  --limit 100
```

## Commands

### `scrape` - Scrape LinkedIn Jobs

Scrape job postings from LinkedIn with various filters.

**Options:**

```
-p, --position <position>           Job position/title
-l, --location <location>           Location
-e, --experience-level <levels...>  Experience levels (multiple)
-t, --employment-type <types...>    Employment types (multiple)
-d, --date-posted <date>            Date posted filter
-n, --limit <number>                Maximum jobs to scrape (default: 50, max: 1000)
-i, --interactive                   Interactive mode with prompts
```

**Experience Levels:**
- Internship
- Entry Level
- Associate
- Mid-Senior
- Director
- Executive

**Employment Types:**
- Full-time
- Part-time
- Contract
- Temporary
- Volunteer
- Internship

**Date Posted Options:**
- Past 24 hours
- Past Week
- Past Month
- Any time

**Examples:**

```bash
# Interactive mode
linkedin-scraper scrape --interactive

# Scrape entry-level software engineering jobs
linkedin-scraper scrape \
  --position "Software Engineer" \
  --experience-level "Entry Level" \
  --limit 100

# Scrape remote full-time positions
linkedin-scraper scrape \
  --position "Product Manager" \
  --location "Remote" \
  --employment-type "Full-time" \
  --limit 50

# Recent postings only
linkedin-scraper scrape \
  --position "UX Designer" \
  --date-posted "Past 24 hours" \
  --limit 25
```

### `list` - View Scraped Jobs

Display scraped jobs in a formatted table.

**Options:**

```
-s, --search-id <id>        Filter by search ID
-c, --company <name>        Filter by company name
-l, --location <location>   Filter by location
-f, --date-from <date>      Filter by date (YYYY-MM-DD)
-n, --limit <number>        Limit number of results (default: 20)
```

**Examples:**

```bash
# List all jobs (last 20)
linkedin-scraper list

# List jobs from a specific search
linkedin-scraper list --search-id 5

# Filter by company
linkedin-scraper list --company "Google" --limit 10

# Filter by location and date
linkedin-scraper list \
  --location "New York" \
  --date-from "2025-01-01" \
  --limit 50
```

### `export` - Export Jobs

Export scraped jobs to JSON or CSV format.

**Options:**

```
-s, --search-id <id>     Search ID to export
-f, --format <format>    Export format: json or csv (default: json)
-o, --output <file>      Output file path
```

**Examples:**

```bash
# Export all jobs to JSON
linkedin-scraper export --format json --output jobs.json

# Export specific search to CSV
linkedin-scraper export \
  --search-id 5 \
  --format csv \
  --output search-5.csv

# Auto-generated filename
linkedin-scraper export
```

### `clear` - Clear Database

Delete all scraped data from the database.

**Options:**

```
-y, --yes    Skip confirmation prompt
```

**Examples:**

```bash
# With confirmation
linkedin-scraper clear

# Skip confirmation
linkedin-scraper clear --yes
```

## Configuration

Configuration is managed through environment variables. Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

### Environment Variables

**Database:**
- `DATABASE_PATH`: Path to SQLite database file (default: `./data/linkedin-jobs.db`)

**Scraping:**
- `MAX_CONCURRENT_REQUESTS`: Maximum concurrent browser tabs (default: `2`)
- `REQUEST_DELAY_MIN`: Minimum delay between requests in ms (default: `3000`)
- `REQUEST_DELAY_MAX`: Maximum delay between requests in ms (default: `7000`)
- `MAX_PAGES_PER_SEARCH`: Maximum pages to scrape per search (default: `10`)
- `MAX_RETRIES`: Number of retry attempts for failed scrapes (default: `3`)

**Proxy (Optional):**
- `PROXY_ENABLED`: Enable proxy usage (default: `false`)
- `PROXY_HOST`: Proxy server host
- `PROXY_PORT`: Proxy server port
- `PROXY_USERNAME`: Proxy authentication username
- `PROXY_PASSWORD`: Proxy authentication password

**Logging:**
- `LOG_LEVEL`: Logging level: `error`, `warn`, `info`, `debug` (default: `info`)
- `LOG_FILE`: Path to log file (default: `./logs/scraper.log`)

**Browser:**
- `HEADLESS`: Run browser in headless mode (default: `true`)
- `BROWSER_TYPE`: Browser to use: `chromium`, `firefox`, or `webkit` (default: `chromium`)

## Project Structure

```
linkedin-scraper/
├── src/
│   ├── cli/              # CLI commands and UI
│   ├── scraper/          # Scraping logic
│   ├── database/         # Database schema and repositories
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript type definitions
├── data/                 # SQLite database storage
├── logs/                 # Application logs
└── config/               # Configuration files
```

## Development

### Build

```bash
npm run build
```

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Watch Mode

```bash
npm run watch
```

### Clean Build

```bash
npm run clean
npm run build
```

## Database Schema

The application uses SQLite with three main tables:

### `jobs` Table
Stores scraped job data including title, company, location, description, salary, and posting date.

### `searches` Table
Tracks search queries with metadata like filters, total results, and completion status.

### `scrape_errors` Table
Logs errors encountered during scraping for debugging.

## Anti-Detection Features

- **Stealth Mode**: Hides automation indicators
- **User-Agent Rotation**: Randomizes browser user agents
- **Realistic Delays**: Random delays between requests (3-7 seconds)
- **Request Throttling**: Limited concurrent requests
- **Browser Fingerprinting Prevention**: Removes WebDriver property

## Troubleshooting

### "Browser not initialized" Error

Make sure Playwright browsers are installed:

```bash
npx playwright install chromium
```

### Rate Limiting / IP Blocking

LinkedIn may block your IP if scraping too aggressively. To mitigate:

1. Increase `REQUEST_DELAY_MIN` and `REQUEST_DELAY_MAX` in `.env`
2. Reduce `MAX_CONCURRENT_REQUESTS`
3. Use a proxy server (configure in `.env`)
4. Add longer breaks between scraping sessions

### Parsing Errors

If job extraction fails:

1. LinkedIn may have changed their HTML structure
2. Check logs in `./logs/scraper.log` for details
3. Try updating dependencies: `npm update`
4. Report the issue with log details

### Database Errors

If you encounter database issues:

```bash
# Clear and reinitialize database
linkedin-scraper clear --yes
```

## Performance Tips

1. **Limit Concurrent Requests**: Start with `MAX_CONCURRENT_REQUESTS=1` and increase gradually
2. **Use Headless Mode**: Set `HEADLESS=true` for better performance
3. **Reasonable Limits**: Don't scrape more than 100-200 jobs per session
4. **Add Delays**: Increase delays if experiencing blocks
5. **Monitor Logs**: Check logs for errors and adjust settings

## Limitations

- **LinkedIn ToS**: Violates LinkedIn's Terms of Service
- **Rate Limiting**: LinkedIn may block aggressive scraping
- **Selector Changes**: LinkedIn may update their HTML structure
- **Authentication**: Does not support authenticated sessions
- **Data Completeness**: Some job details may not be available
- **Geographic Restrictions**: Results depend on LinkedIn's availability

## Future Enhancements

- [ ] Email notifications for new job postings
- [ ] ML-based job matching and recommendations
- [ ] Company insights and ratings integration
- [ ] Application tracking functionality
- [ ] Resume keyword optimization suggestions
- [ ] Advanced deduplication with ML similarity
- [ ] Web dashboard for browsing jobs
- [ ] Cloud deployment options

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Check existing issues for solutions
- Review logs in `./logs/` for debugging

## Acknowledgments

- Built with [Playwright](https://playwright.dev/)
- CLI powered by [Commander.js](https://github.com/tj/commander.js)
- UI components from [Inquirer](https://github.com/SBoudrias/Inquirer.js), [Ora](https://github.com/sindresorhus/ora), and [cli-progress](https://github.com/npkgz/cli-progress)
- Database management with [Drizzle ORM](https://orm.drizzle.team/)
