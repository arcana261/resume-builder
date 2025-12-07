# Setup Guide

## Prerequisites

Before you can run this LinkedIn scraper, you need to install:

### 1. Node.js (v18 or higher)

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS (using Homebrew):**
```bash
brew install node
```

**Windows:**
Download and install from [nodejs.org](https://nodejs.org/)

### 2. Verify Installation

```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

## Installation Steps

### Step 1: Install Dependencies

```bash
cd linkedin-scraper
npm install
```

This will install all required packages including:
- Playwright (browser automation)
- Drizzle ORM (database)
- Commander (CLI framework)
- And all other dependencies listed in package.json

### Step 2: Install Playwright Browsers

```bash
npx playwright install chromium
```

This downloads the Chromium browser that Playwright will use for scraping.

### Step 3: Build the Project

```bash
npm run build
```

This compiles the TypeScript code to JavaScript in the `dist/` directory.

### Step 4: Run the Tool

**Option A: Run locally**
```bash
npm run dev scrape --interactive
```

**Option B: Link globally**
```bash
npm link
linkedin-scraper scrape --interactive
```

## First Run

Try the interactive mode to scrape your first batch of jobs:

```bash
npm run dev scrape --interactive
```

Follow the prompts to:
1. Enter a job position (e.g., "Software Engineer")
2. Enter a location (e.g., "San Francisco, CA")
3. Select experience levels
4. Select employment types
5. Choose date filter
6. Set maximum jobs to scrape

The scraper will then:
- Launch a browser
- Navigate to LinkedIn
- Extract job listings
- Save them to the database
- Show real-time progress

## Verify It Works

After scraping, list the jobs:

```bash
npm run dev list --limit 10
```

## Common Issues

### "Cannot find module" errors

Make sure you've run:
```bash
npm install
npm run build
```

### "Browser not found" errors

Install Playwright browsers:
```bash
npx playwright install chromium
```

### Permission errors on Linux

If you get permission errors, you may need to install dependencies:
```bash
# Ubuntu/Debian
sudo apt-get install -y \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libdbus-1-3 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2
```

## Next Steps

1. Read the [README.md](README.md) for full documentation
2. Review the [architecture.md](../architecture.md) to understand the design
3. Check [how-to-scrape-linkedin.md](../how-to-scrape-linkedin.md) for scraping best practices
4. Customize the `.env` file for your needs

## Production Considerations

⚠️ **Important Legal Notice:**

This tool is for educational purposes only. LinkedIn's Terms of Service prohibit automated scraping. Before using this tool:

1. Review LinkedIn's [Terms of Service](https://www.linkedin.com/legal/user-agreement)
2. Consider legal implications in your jurisdiction
3. For production use, consider official APIs or licensed data providers
4. Use responsibly and respect rate limits

## Support

If you encounter issues:

1. Check the logs in `./logs/scraper.log`
2. Review the troubleshooting section in README.md
3. Ensure all prerequisites are installed
4. Try running with `HEADLESS=false` in .env to see what's happening
