# Quick Start Guide

## Installation & Setup

### 1. Install Node.js
Make sure you have Node.js >= 18.0.0 installed:
```bash
node --version
npm --version
```

### 2. Install Dependencies

```bash
cd /home/arcana/Documents/projects/resume-builder/job-browser

# Option 1: Install all at once
npm run setup

# Option 2: Install manually
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 3. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env` if needed (defaults should work):
```env
DATABASE_PATH=../../linkedin-scraper/data/linkedin-jobs.db
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Run the Application

```bash
# From job-browser root directory
npm run dev
```

This will start:
- Backend API on http://localhost:3001
- Frontend on http://localhost:5173

Open http://localhost:5173 in your browser!

## What's Included

✅ **Backend (100% Complete)**
- Express API server with TypeScript
- SQLite database connection with FTS5 full-text search
- RESTful API endpoints for jobs and searches
- CORS and error handling middleware
- Automatic FTS5 table creation and triggers

✅ **Frontend (100% Functional)**
- React 18 with TypeScript
- Vite for fast development
- TanStack Query for data fetching
- Zustand for state management
- Tailwind CSS for styling
- Job browsing page with filters
- Job detail page with HTML viewer
- Responsive mobile-friendly design

## Features

### Job Browser (Main Page)
- **Full-text search** across title, company, location, and description
- **Filter by:**
  - Company (multi-select with counts)
  - Location (multi-select with counts)
  - Employment type (checkboxes)
  - Seniority level (checkboxes)
- **Pagination** with page numbers
- **Real-time** filter counts
- **Responsive** grid layout (1/2/3 columns)

### Job Detail Page
- Full job description with HTML rendering
- Company and location information
- Salary range display
- Posted date with relative time
- Employment type and seniority badges
- **3 tabs:**
  1. Job Details - Formatted description
  2. Original HTML - Sandboxed iframe viewer
  3. Raw Data - JSON viewer
- Apply on LinkedIn button
- Download HTML button
- Back navigation

## Usage Tips

### Search
- Type in the search box to search across all job fields
- Results update automatically with debouncing

### Filters
- Click checkboxes to add/remove filters
- Multiple filters combine with AND logic
- Filter counts show number of jobs for each option
- "Clear all" button resets all filters

### Pagination
- 20 jobs per page
- Click page numbers or Previous/Next
- Scroll to top on page change

### Job Details
- Click any job card to view full details
- Switch between tabs to view different data
- Click external link icon to open on LinkedIn
- Download HTML for offline viewing

## Troubleshooting

### "Database not found" error
Check that the database path in `server/.env` points to the correct location:
```bash
ls ../../linkedin-scraper/data/linkedin-jobs.db
```

### "No jobs found"
Make sure you've run the linkedin-scraper first to populate the database:
```bash
cd ../../linkedin-scraper
npm run dev scrape "software engineer" --location "San Francisco"
```

### CORS errors
Ensure `ALLOWED_ORIGINS` in `server/.env` includes your frontend URL:
```env
ALLOWED_ORIGINS=http://localhost:5173
```

### Port already in use
Change the port in `server/.env`:
```env
PORT=3002
```

And update the proxy in `client/vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3002',
    changeOrigin: true
  }
}
```

## Next Steps

### Enhance the UI with shadcn/ui
```bash
cd client

# Add beautiful UI components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
```

### Add More Features
- Dark mode toggle
- Salary range slider
- Date posted filter
- Sort options (salary, date, title)
- Save favorite jobs
- Export to CSV
- Job comparison
- Search history page

## File Structure

```
job-browser/
├── server/
│   ├── src/
│   │   ├── services/
│   │   │   ├── DatabaseService.ts    ✅ Database + FTS5
│   │   │   └── JobService.ts         ✅ Business logic
│   │   ├── routes/
│   │   │   ├── jobs.ts               ✅ Job endpoints
│   │   │   └── searches.ts           ✅ Search endpoints
│   │   ├── middleware/
│   │   │   ├── cors.ts               ✅ CORS config
│   │   │   └── errorHandler.ts      ✅ Error handling
│   │   └── server.ts                 ✅ Express app
│   └── .env                          ⚙️ Configuration
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── JobCard.tsx           ✅ Job card component
│   │   │   ├── JobList.tsx           ✅ Job grid + pagination
│   │   │   └── FilterPanel.tsx       ✅ Filters sidebar
│   │   ├── pages/
│   │   │   ├── JobBrowser.tsx        ✅ Main page
│   │   │   └── JobDetailPage.tsx     ✅ Detail page
│   │   ├── hooks/
│   │   │   └── useJobs.ts            ✅ React Query hooks
│   │   ├── lib/
│   │   │   ├── api.ts                ✅ API client
│   │   │   └── utils.ts              ✅ Utilities
│   │   ├── store/
│   │   │   └── filterStore.ts        ✅ Zustand store
│   │   └── main.tsx                  ✅ React entry
│   └── vite.config.ts                ✅ Vite config
│
└── shared/
    └── types.ts                       ✅ Shared types
```

## API Examples

### Get all jobs
```bash
curl http://localhost:3001/api/jobs?page=1&limit=20
```

### Search jobs
```bash
curl http://localhost:3001/api/jobs?search=engineer
```

### Filter by company
```bash
curl "http://localhost:3001/api/jobs?company[]=Google&company[]=Apple"
```

### Get job detail
```bash
curl http://localhost:3001/api/jobs/1
```

### Get job HTML
```bash
curl http://localhost:3001/api/jobs/1/html
```

## Development

### Backend
```bash
cd server
npm run dev     # Start with tsx watch (auto-reload)
npm run build   # Build TypeScript
npm start       # Run production build
```

### Frontend
```bash
cd client
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build
```

### Both
```bash
npm run dev     # Start both concurrently
npm run build   # Build both
```

## Production Deployment

```bash
# Build everything
npm run build

# Start production server
npm start
```

The server will:
1. Serve API at `/api/*`
2. Serve static React app at `/`

Access at http://localhost:3001

---

**Enjoy browsing your job data! 🎉**

For more details, see the full [README.md](./README.md)
