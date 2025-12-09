import { useQuery } from '@tanstack/react-query';
import { fetchJobs, fetchJob, fetchJobHTML } from '../lib/api';
import type { JobsQueryParams } from '@shared/types';

export function useJobs(params: JobsQueryParams) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => fetchJobs(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => fetchJob(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id
  });
}

export function useJobHTML(id: number) {
  return useQuery({
    queryKey: ['job-html', id],
    queryFn: () => fetchJobHTML(id),
    staleTime: Infinity,
    enabled: !!id
  });
}
