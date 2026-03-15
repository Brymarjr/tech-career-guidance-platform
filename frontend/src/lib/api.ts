import axios from 'axios';

// 1. Use the environment variable, but fall back to localhost for local dev.
// Note: We add the /api/v1/ suffix here so it's consistent.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/` 
    : 'http://localhost:8000/api/v1/';

const api = axios.create({
  baseURL: BASE_URL,
});

// This interceptor remains the same (perfect for production)
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const toggleMilestone = async (milestoneId: number) => {
  const response = await api.post(`assessments/milestone/${milestoneId}/toggle/`);
  return response.data;
};

// --- New Mentor Task Endpoints ---
export const getTasks = () => api.get('users/tasks/');
export const createTask = (data: { student: string; title: string; description: string; xp_reward: number }) => 
  api.post('users/tasks/', data);
export const updateTaskStatus = (taskId: number, data: { status: string; mentor_feedback?: string }) => 
  api.patch(`users/tasks/${taskId}/update/`, data);

export default api;