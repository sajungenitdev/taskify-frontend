import axios from "axios";
import toast from "react-hot-toast";

// Dynamically set base URL based on environment
const getBaseUrl = () => {
  // For production (Vercel), use relative URL
  if (process.env.NODE_ENV === "production") {
    return "/api/v1";
  }
  // For development, use localhost
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    );
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error("API Error:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshResponse = await api.post("/auth/refresh-token");
        if (refreshResponse.data.success) {
          const newToken = refreshResponse.data.data.accessToken;
          localStorage.setItem("token", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        toast.error("Session expired. Please login again.");
        return Promise.reject(error);
      }
    }

    // Handle 404 - Endpoint not found
    if (error.response?.status === 404) {
      console.error(`Endpoint not found: ${error.config?.url}`);
      // Don't show error for demo-users endpoint
      if (!error.config?.url?.includes("/demo-users")) {
        toast.error("Service unavailable. Please try again later.");
      }
    }

    // Handle network errors
    if (error.code === "ERR_NETWORK") {
      toast.error("Cannot connect to server. Please check your connection.");
    }

    return Promise.reject(error);
  },
);

export default api;
