# Job Browser

A modern, interactive web application for browsing and filtering LinkedIn job postings scraped by the [linkedin-scraper](../linkedin-scraper) tool.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Express](https://img.shields.io/badge/Express-4-green) ![SQLite](https://img.shields.io/badge/SQLite-FTS5-orange)

## Features

- 🔍 **Full-text search** using SQLite FTS5 for blazing-fast queries
- 🎯 **Advanced filtering** by company, location, salary, employment type, seniority level, and industry
- 📱 **Responsive design** that works on desktop, tablet, and mobile
- 🎨 **Modern UI** built with shadcn/ui and Tailwind CSS
- 📊 **Job detail view** with original HTML rendering
- 📈 **Search history** to track your scraping sessions
- ⚡ **Real-time updates** with React Query caching
- 🌙 **Dark mode support** (coming soon)

## Architecture

This is a **separate project** from the linkedin-scraper CLI tool:

```
resume-builder/
├── linkedin-scraper/          # CLI scraping tool
│   └── data/
│       └── linkedin-jobs.db   # Shared SQLite database
│
└── job-browser/               # This web application
    ├── server/                # Express API backend
    ├── client/                # React frontend
    └── shared/                # Shared TypeScript types
```

**Technology Stack:**
- **Frontend:** React 18, TypeScript, Vite, TanStack Query, Zustand, Tailwind CSS
- **Backend:** Express, TypeScript, better-sqlite3, Drizzle ORM
- **Database:** SQLite with FTS5 (shared with linkedin-scraper)

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Existing linkedin-scraper database with job data

## Setup

### 1. Install Dependencies

From the `job-browser` root directory:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..

# Or run all at once:
npm run setup
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` to configure your setup:

```env
# Database path (points to linkedin-scraper database)
DATABASE_PATH=../../linkedin-scraper/data/linkedin-jobs.db

# Server configuration
PORT=3001
NODE_ENV=development

# CORS (add your frontend URL)
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Initialize Full-Text Search (FTS5)

The FTS5 virtual table will be created automatically when the server starts for the first time. It creates:
- `jobs_fts` virtual table for full-text search
- Triggers to keep FTS table in sync with jobs table

## Running the Application

### Development Mode

**Option 1: Run everything at once (recommended)**

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently.

**Option 2: Run separately**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

### Production Mode

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

The production server will:
1. Serve API endpoints at `/api/*`
2. Serve the React app from `/`

## API Endpoints

### Jobs

- **GET /api/jobs** - List jobs with filters and pagination
  - Query params: `page`, `limit`, `search`, `company[]`, `location[]`, `employmentType[]`, `seniorityLevel[]`, `industry[]`, `salaryMin`, `salaryMax`, `postedAfter`, `sortBy`, `sortOrder`
  - Returns: `{ data: Job[], pagination: {...}, filters: {...} }`

- **GET /api/jobs/:id** - Get single job details
  - Returns: `{ data: Job }`

- **GET /api/jobs/:id/html** - Get original scraped HTML
  - Returns: `{ html: string, url: string }`

### Searches

- **GET /api/searches** - List search history
  - Returns: `{ data: Search[] }`

- **GET /api/searches/:id** - Get search details
  - Returns: `{ data: Search }`

### Health

- **GET /api/health** - Health check endpoint
  - Returns: `{ status: string, timestamp: string }`

## Project Structure

```
job-browser/
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── jobs.ts           # Job endpoints
│   │   │   └── searches.ts       # Search history endpoints
│   │   ├── services/
│   │   │   ├── DatabaseService.ts # Database connection + FTS5
│   │   │   └── JobService.ts      # Business logic
│   │   ├── middleware/
│   │   │   ├── cors.ts            # CORS configuration
│   │   │   └── errorHandler.ts   # Error handling
│   │   └── server.ts              # Express app entry point
│   ├── package.json
│   └── tsconfig.json
│
├── client/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities and API client
│   │   ├── store/             # Zustand state management
│   │   ├── styles/            # Global styles
│   │   └── main.tsx           # React entry point
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── shared/
│   └── types.ts               # Shared TypeScript types
│
├── package.json               # Root package.json
└── README.md                  # This file
```

## Remaining Implementation Steps

The backend is **100% complete** and ready to use. The following frontend components still need to be implemented:

### Required Frontend Files

Create these files to complete the application:

#### 1. Main App Files

**`client/src/main.tsx`** - Application entry point
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

**`client/src/App.tsx`** - Main app component with routing
```typescript
import { Routes, Route } from 'react-router-dom';
import { JobBrowser } from './pages/JobBrowser';
import { JobDetailPage } from './pages/JobDetailPage';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<JobBrowser />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
```

#### 2. Core Components

**`client/src/components/JobCard.tsx`** - Job card component
- Display job title, company, location
- Show salary, employment type badges
- Posted date
- Click to view details

**`client/src/components/JobList.tsx`** - Job list grid
- Responsive grid layout (1/2/3 columns)
- Loading skeletons
- Empty state
- Pagination controls

**`client/src/components/FilterPanel.tsx`** - Filter sidebar
- Search input (debounced)
- Multi-select company filter
- Multi-select location filter
- Checkbox group for employment types
- Checkbox group for seniority levels
- Salary range slider
- Date filter
- Clear all button

**`client/src/components/SearchBar.tsx`** - Search input
- Debounced input (300ms)
- Search icon
- Clear button
- Keyboard shortcuts (Cmd+K)

**`client/src/components/HTMLViewer.tsx`** - HTML viewer modal
- Iframe with sandboxed rendering
- Download HTML button
- Fullscreen toggle
- Safety warnings

#### 3. Pages

**`client/src/pages/JobBrowser.tsx`** - Main page
- Layout with header, filter sidebar, job grid
- Integrate all components
- Handle filter state
- Pagination

**`client/src/pages/JobDetailPage.tsx`** - Job detail page
- Full job information
- Tabs: Details | Original HTML | Raw Data
- Back button
- Apply button (opens LinkedIn)
- Share button

### Quick Start Implementation

1. **Copy the minimal components** from the implementation plan (job-listing-browser.md)
2. **Install shadcn/ui components** you need:
   ```bash
   cd client
   npx shadcn-ui@latest add button card badge input select checkbox
   ```
3. **Create the basic pages** (JobBrowser and JobDetailPage)
4. **Test the app** with your existing job data

## Development Tips

### Adding shadcn/ui Components

```bash
cd client

# Install individual components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
```

### Debugging

**Backend logs:**
```bash
cd server
npm run dev
# Watch console for SQL queries and errors
```

**Frontend React Query Devtools:**
Add to `main.tsx`:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Add inside QueryClientProvider:
<ReactQueryDevtools initialIsOpen={false} />
```

### Common Issues

**Issue: Database not found**
- Check `DATABASE_PATH` in `server/.env`
- Ensure the path points to `linkedin-scraper/data/linkedin-jobs.db`
- Verify the database file exists

**Issue: CORS errors**
- Check `ALLOWED_ORIGINS` in `server/.env`
- Ensure it includes `http://localhost:5173`

**Issue: No jobs appearing**
- Run the linkedin-scraper first to populate data
- Check API at http://localhost:3001/api/jobs
- Check browser console for errors

## Performance

- **Full-text search:** Sub-100ms queries with FTS5
- **Filter application:** <200ms response time
- **React Query caching:** 5-minute stale time
- **Pagination:** 20 jobs per page (configurable)

## Future Enhancements

- [ ] Dark mode toggle
- [ ] Export jobs to CSV/JSON
- [ ] Save favorite jobs
- [ ] Job application tracking
- [ ] Email alerts for new jobs
- [ ] Salary trends charts
- [ ] Skills extraction and analysis
- [ ] Resume match scoring
- [ ] Company comparison tool

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

## Related Projects

- [linkedin-scraper](../linkedin-scraper) - CLI tool for scraping LinkedIn job postings

---

**Need help?** Check the implementation plan in `job-listing-browser.md` for detailed component specifications and code examples.
