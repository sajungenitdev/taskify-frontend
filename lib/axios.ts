import axios from "axios";
import toast from "react-hot-toast";

const getBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return "/api/v1";
  }
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
  (response) => response,
  (error) => {
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
