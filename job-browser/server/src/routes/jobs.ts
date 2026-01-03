import express from 'express';
import { JobService } from '../services/JobService.js';
import type { JobsQueryParams } from '../../../shared/types.js';

const router = express.Router();
const jobService = new JobService();

// GET /api/jobs
router.get('/', async (req, res, next) => {
  try {
    // Parse query parameters
    const params: JobsQueryParams = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      search: req.query.search as string,
      company: req.query.company ? (Array.isArray(req.query.company) ? req.query.company as string[] : [req.query.company as string]) : undefined,
      location: req.query.location ? (Array.isArray(req.query.location) ? req.query.location as string[] : [req.query.location as string]) : undefined,
      employmentType: req.query.employmentType ? (Array.isArray(req.query.employmentType) ? req.query.employmentType as string[] : [req.query.employmentType as string]) : undefined,
      seniorityLevel: req.query.seniorityLevel ? (Array.isArray(req.query.seniorityLevel) ? req.query.seniorityLevel as string[] : [req.query.seniorityLevel as string]) : undefined,
      industry: req.query.industry ? (Array.isArray(req.query.industry) ? req.query.industry as string[] : [req.query.industry as string]) : undefined,
      salaryMin: req.query.salaryMin ? Number(req.query.salaryMin) : undefined,
      salaryMax: req.query.salaryMax ? Number(req.query.salaryMax) : undefined,
      postedAfter: req.query.postedAfter as string,
      scrapedAfter: req.query.scrapedAfter as string,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any
    };

    const result = await jobService.getJobs(params);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const job = await jobService.getJobById(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ data: job });
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs/:id/html
router.get('/:id/html', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const htmlData = await jobService.getJobHTML(id);

    if (!htmlData) {
      return res.status(404).json({ error: 'HTML not found for this job' });
    }

    res.json(htmlData);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/jobs/:jobId - Delete a single job by job_id
router.delete('/:jobId', async (req, res, next) => {
  try {
    const jobId = req.params.jobId;

    if (!jobId || jobId.trim() === '') {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    await jobService.deleteJob(jobId);

    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

// DELETE /api/jobs - Bulk delete jobs by job_ids
router.delete('/', async (req, res, next) => {
  try {
    const { jobIds } = req.body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request: jobIds array required' });
    }

    // Validate all jobIds are strings
    if (!jobIds.every(id => typeof id === 'string' && id.trim() !== '')) {
      return res.status(400).json({ error: 'Invalid request: all jobIds must be non-empty strings' });
    }

    const result = await jobService.deleteBulk(jobIds);

    res.status(200).json({
      success: true,
      deleted: result.deleted,
      failed: result.failed,
      message: `Successfully deleted ${result.deleted} job(s)${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`
    });
  } catch (error) {
    next(error);
  }
});

export default router;
