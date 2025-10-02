import axios, { AxiosInstance, AxiosError } from "axios";
import { toast } from "react-hot-toast";

// Get API URL from environment variable or use default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        // Try to refresh the token
        const refreshResponse = await axios.post(`${API_BASE_URL}/v1/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = refreshResponse.data;
        localStorage.setItem("access_token", access);

        // Update cookie
        document.cookie = `auth-token=${access}; path=/; max-age=3600; SameSite=Strict`;

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        // Only redirect if we're in the browser
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth/")) {
          window.location.href = "/auth/login";
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 500) {
      toast.error("Server Error: Something went wrong. Please try again later.");
    }

    return Promise.reject(error);
  }
);

// Wrapper class to match the existing API interface
class ApiClient {
  async get(url: string, options?: any) {
    const response = await axiosInstance.get(url, options);
    return response;
  }

  async post(url: string, data?: any, options?: any) {
    const response = await axiosInstance.post(url, data, options);
    return response;
  }

  async put(url: string, data?: any, options?: any) {
    const response = await axiosInstance.put(url, data, options);
    return response;
  }

  async patch(url: string, data?: any, options?: any) {
    const response = await axiosInstance.patch(url, data, options);
    return response;
  }

  async delete(url: string, options?: any) {
    const response = await axiosInstance.delete(url, options);
    return response;
  }
}

export const apiClient = new ApiClient();
export { axiosInstance };
