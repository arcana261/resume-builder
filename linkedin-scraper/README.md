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

### Option 2: Use Shell Script Wrapper

```bash
# Make the wrapper executable (already done)
chmod +x linkedin-scraper.sh

# Run directly - it will auto-build if needed
./linkedin-scraper.sh --help
./linkedin-scraper.sh scrape --interactive
```

The shell script wrapper (`linkedin-scraper.sh`) automatically:
- Checks Node.js version
- Installs dependencies if missing
- Builds TypeScript code if needed
- Passes all arguments to the compiled application

**Special flags:**
- `--rebuild` - Force rebuild even if build exists

### Option 3: Install Globally

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
# Using npm
npm run dev scrape --interactive

# Using shell wrapper
./linkedin-scraper.sh scrape --interactive
```

This will guide you through all available options with prompts.

### Command-Line Mode

```bash
# Using npm
npm run dev scrape \
  --position "Software Engineer" \
  --location "San Francisco, CA" \
  --limit 50

# Using shell wrapper
./linkedin-scraper.sh scrape \
  --position "Software Engineer" \
  --location "San Francisco, CA" \
  --limit 50

# Advanced scrape with filters
./linkedin-scraper.sh scrape \
  --position "Data Scientist" \
  --location "Remote" \
  --experience-level "Mid-Senior" "Director" \
  --employment-type "Full-time" "Contract" \
  --date-posted "Past Week" \
  --limit 100
```

## LinkedIn Login

To scrape as an authenticated LinkedIn user, you can save your session and reuse it across scrapes.

### Why Login?

- Access more job listings
- Bypass rate limits for anonymous users
- See full job descriptions without interruption

### ⚠️ Security Warning

**Session data is stored in plain text** in `data/linkedin-session.json`. This file contains:
- Authentication cookies
- Browser localStorage/sessionStorage
- User agent and viewport info

**Recommendations:**
- ✅ Use a separate LinkedIn account for scraping
- ✅ Limit scraping volume (< 50 jobs/day)
- ✅ Never commit session files to version control (.gitignore included)
- ✅ Never share your session file
- ⚠️ LinkedIn may ban accounts that scrape aggressively

### First-Time Setup

1. **Login to LinkedIn:**

```bash
npm run dev login
```

This command will:
- Open a browser window to LinkedIn's login page
- Wait for you to manually log in (handles 2FA and CAPTCHA)
- Save your session to `data/linkedin-session.json`
- Close the browser

2. **Scrape jobs** (session will be automatically restored):

```bash
npm run dev scrape --position "Software Engineer" --location "NYC"
```

The scraper will automatically detect and use your saved session.

### Session Management

**Check session status:**
```bash
npm run dev session
```

Shows:
- Session status (Active/Expired)
- Session age (days, hours, minutes)
- File location
- Expiry warning (if > 24 hours old)

**Logout (clear session):**
```bash
npm run dev logout
```

Deletes the session file from disk.

**Re-login (if session expired):**
```bash
npm run dev login
```

### Session Behavior

- **Auto-restore**: Session is automatically loaded when launching browser
- **Expiry**: Sessions expire after 24 hours (configurable in `.env`)
- **Validation**: Session validity is not checked during scraping (assumes LinkedIn's TTL)
- **Storage**: Plain text JSON file in project directory

### Configuration

Edit `.env` to customize session settings:

```bash
SESSION_PATH=./data/linkedin-session.json  # Session file location
SESSION_TIMEOUT=86400000                    # 24 hours in milliseconds
LOGIN_TIMEOUT=300000                        # 5 minutes (time to complete login)
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

### `login` - Login to LinkedIn

Open a browser window to login to LinkedIn and save your session for authenticated scraping.

**Features:**
- Always runs in headed mode
- Handles 2FA and CAPTCHA
- Saves cookies, localStorage, and sessionStorage
- 5-minute timeout for login completion
- Displays security warning before execution

**Examples:**

```bash
# Login to LinkedIn
npm run dev login

# The command will:
# 1. Show security warning (5 second delay)
# 2. Open browser to LinkedIn login page
# 3. Wait for you to manually log in
# 4. Save session to data/linkedin-session.json
# 5. Close browser automatically
```

### `logout` - Clear Session

Delete the saved LinkedIn session from disk.

**Examples:**

```bash
# Clear saved session
npm run dev logout

# This will delete data/linkedin-session.json
```

### `session` - View Session Status

Display information about your current LinkedIn session.

**Examples:**

```bash
# Check session status
npm run dev session

# Shows:
# - Session status (Active/Expired)
# - Session age (days, hours, minutes)
# - File location
# - Expiry warning if > 24 hours old
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

### Testing

The project includes comprehensive unit tests covering all parsing and database functionality:

```bash
npm test              # Run all tests (119 tests)
npm run test:watch    # Watch mode for development
npm run test:ui       # Interactive test UI
npm run test:coverage # Generate coverage report
```

**Test Coverage:**
- **Parser Tests (26)**: Job extraction, count parsing, pagination
- **Repository Tests (58)**: CRUD operations, filtering, search lifecycle
- **Filter Tests (35)**: URL building, parameter mapping

All tests use real LinkedIn HTML fixtures and in-memory SQLite for fast execution.

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
3. Check `./logs/` for auto-saved debug artifacts (screenshots + HTML)
4. Analyze the saved HTML to identify new selectors
5. Update selectors in `src/scraper/core/Parser.ts`
6. Run tests: `npm test` to verify fixes
7. Try updating dependencies: `npm update`
8. Report the issue with log details

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
