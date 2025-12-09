import express from 'express';
import { DatabaseService } from '../services/DatabaseService.js';
import type { Search } from '../../../shared/types.js';

const router = express.Router();
const db = DatabaseService.getInstance().getDatabase();

// GET /api/searches
router.get('/', async (req, res, next) => {
  try {
    const searches = db.prepare(`
      SELECT
        id, query, location, filters,
        total_results, successful_scrapes, failed_scrapes,
        started_at, completed_at, status, created_at
      FROM searches
      ORDER BY created_at DESC
      LIMIT 100
    `).all() as Search[];

    // Convert timestamps to ISO strings
    const formattedSearches = searches.map(search => ({
      ...search,
      started_at: new Date((search.started_at as any) * 1000).toISOString(),
      completed_at: search.completed_at ? new Date((search.completed_at as any) * 1000).toISOString() : undefined,
      created_at: new Date((search.created_at as any) * 1000).toISOString()
    }));

    res.json({ data: formattedSearches });
  } catch (error) {
    next(error);
  }
});

// GET /api/searches/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid search ID' });
    }

    const search = db.prepare(`
      SELECT
        id, query, location, filters,
        total_results, successful_scrapes, failed_scrapes,
        started_at, completed_at, status, created_at
      FROM searches
      WHERE id = ?
    `).get(id) as Search | undefined;

    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    // Convert timestamps to ISO strings
    const formattedSearch = {
      ...search,
      started_at: new Date((search.started_at as any) * 1000).toISOString(),
      completed_at: search.completed_at ? new Date((search.completed_at as any) * 1000).toISOString() : undefined,
      created_at: new Date((search.created_at as any) * 1000).toISOString()
    };

    res.json({ data: formattedSearch });
  } catch (error) {
    next(error);
  }
});

export default router;
