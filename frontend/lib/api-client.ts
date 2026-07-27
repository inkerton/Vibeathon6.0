import axios from 'axios';
import { mockApiClient } from './mock-api-client';

const API_MODE = process.env.NEXT_PUBLIC_API_MODE || 'live';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

let apiClient: any;

// Use mock client in mock mode
if (API_MODE === 'mock') {
  console.log('🎭 Running in MOCK API mode');
  apiClient = mockApiClient;
} else {
  console.log('🌐 Running in LIVE API mode');
  
  apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  });

  // Request interceptor to add auth token
  apiClient.interceptors.request.use(
    (config: any) => {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token refresh
  apiClient.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      const originalRequest = error.config;

      // Only attempt to refresh if the error is 401, we haven't retried,
      // and there was a token in the first place.
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

      if (token && error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          // TODO: Implement token refresh endpoint
          // const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          // const { accessToken } = response.data;
          // localStorage.setItem('accessToken', accessToken);
          // originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          // return apiClient(originalRequest);

          // For now, just redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}

export { apiClient };
export default apiClient;
