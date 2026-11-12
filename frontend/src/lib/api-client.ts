import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for injecting JWT
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear storage and redirect on unauthorized (skip if already on /login or calling login endpoint)
      if (typeof window !== 'undefined') {
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        if (!isLoginRequest) {
          localStorage.removeItem('auth_token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error: any, fallback: string = 'Operation failed'): string {
  const detail = error?.response?.data?.detail;
  if (!detail) {
    return error?.message || fallback;
  }
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item: any) => (typeof item === 'object' && item?.msg ? item.msg : String(item)))
      .join(', ');
  }
  if (typeof detail === 'object') {
    return detail.msg || JSON.stringify(detail);
  }
  return String(detail);
}

export default api;
