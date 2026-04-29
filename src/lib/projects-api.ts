import { api } from './api';

export interface BackendProject {
  id: string;
  title: string;
  description?: string;
  aspectRatio: string;
  duration?: number;
  thumbnailUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsListResponse {
  data: BackendProject[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const projectsApi = {
  list(page = 1, limit = 50): Promise<ProjectsListResponse> {
    return api.get(`/videos?page=${page}&limit=${limit}`);
  },

  get(id: string): Promise<BackendProject> {
    return api.get(`/videos/${id}`);
  },

  create(data: { title: string; description?: string; aspectRatio?: string }): Promise<BackendProject> {
    return api.post('/videos', data);
  },

  update(id: string, data: { title?: string; description?: string; aspectRatio?: string }): Promise<BackendProject> {
    return api.patch(`/videos/${id}`, data);
  },

  delete(id: string): Promise<{ success: boolean }> {
    return api.delete(`/videos/${id}`);
  },

  saveState(id: string, state: Record<string, unknown>, thumbnailUrl?: string): Promise<{ success: boolean; version: number }> {
    return api.post(`/videos/${id}/state`, { state, thumbnailUrl });
  },

  loadState(id: string): Promise<{ project: BackendProject; state: Record<string, unknown>; version: number }> {
    return api.get(`/videos/${id}/state`);
  },
};
