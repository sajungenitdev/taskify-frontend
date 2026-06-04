import axios from "axios";
import toast from "react-hot-toast";

const getBaseUrl = () => {
  // In production, use the full Render URL
  if (process.env.NODE_ENV === "production") {
    return "https://taskify-server-5gat.onrender.com/api/v1";
  }
  // In development, use localhost
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const publicEndpoints = [
      "/auth/login",
      "/auth/active-users",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/refresh-token",
    ];
    
    const isPublic = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint),
    );

    if (!isPublic) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log responses in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`API Response [${response.config.url}]:`, response.data);
    }
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/login")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      toast.error("Session expired. Please login again.");
    }
    return Promise.reject(error);
  },
);

export default api;