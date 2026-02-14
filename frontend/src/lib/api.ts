import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1/',
});

// This interceptor attaches the token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
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