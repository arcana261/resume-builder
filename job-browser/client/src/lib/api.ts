import axios from 'axios';
import type {
  JobsQueryParams,
  JobsResponse,
  JobDetailResponse,
  JobHTMLResponse,
  SearchesResponse
} from '@shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

export async function fetchJobs(params: JobsQueryParams): Promise<JobsResponse> {
  const { data } = await api.get('/jobs', { params });
  return data;
}

export async function fetchJob(id: number): Promise<JobDetailResponse> {
  const { data } = await api.get(`/jobs/${id}`);
  return data;
}

export async function fetchJobHTML(id: number): Promise<JobHTMLResponse> {
  const { data } = await api.get(`/jobs/${id}/html`);
  return data;
}

export async function fetchSearches(): Promise<SearchesResponse> {
  const { data } = await api.get('/searches');
  return data;
}
