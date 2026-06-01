import axios from "axios";
import toast from "react-hot-toast";

// Use window.location.origin to get the current origin
const getBaseUrl = () => {
  // For development, use localhost:5000
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:5000/api/v1";
  }
  return "/api/v1";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true, // Important for CORS
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
    console.error("Request Error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Log full error for debugging
    console.error("Full Error Object:", {
      message: error.message,
      code: error.code,
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        headers: error.config?.headers,
      },
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
          }
        : null,
    });

    // Handle specific errors
    if (error.code === "ERR_NETWORK") {
      toast.error(
        "Cannot connect to backend server. Please make sure it's running on port 5000.",
      );
    } else if (error.code === "ECONNREFUSED") {
      toast.error("Connection refused. Backend server is not running.");
    } else if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      toast.error("Session expired. Please login again.");
    } else if (error.response?.status === 403) {
      toast.error(error.response?.data?.message || "Access denied");
    } else if (error.response?.status === 404) {
      toast.error(`API endpoint not found: ${error.config?.url}`);
    } else if (error.response?.status === 429) {
      toast.error("Too many requests. Please wait a moment.");
    } else {
      toast.error(error.response?.data?.message || "An error occurred");
    }

    return Promise.reject(error);
  },
);

export default api;
