import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// ============ TYPES ============
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  errors?: Record<string, string[]>;
}

// ============ ENVIRONMENT CONFIGURATION ============
const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL ||
  // "https://taskify-server-5gat.onrender.com/api/v1";
  "http://localhost:5000/api/v1";

// Development fallback
// const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// console.log("🚀 API Base URL:", API_BASE_URL);
// console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

// ============ CREATE AXIOS INSTANCE ============
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
  timeout: 30000, // 30 seconds timeout
});

// ============ RETRY CONFIGURATION ============
const MAX_RETRIES = 3;
let retryCount = 0;

// ============ TOKEN REFRESH ============
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ============ REQUEST INTERCEPTOR ============
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Generate request ID for tracing
    const requestId = Math.random().toString(36).substring(2, 10);
    config.headers["X-Request-ID"] = requestId;

    // Get token from localStorage
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    // if (process.env.NODE_ENV === "development") {
    //   console.log(
    //     `📤 [${requestId}] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    //     config.data || "",
    //   );
    // }

    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    console.error("❌ Request Interceptor Error:", error);
    return Promise.reject(error);
  },
);

// ============ RESPONSE INTERCEPTOR ============
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    const requestId = response.config.headers["X-Request-ID"] || "unknown";

    // Check if response is HTML (for debugging)
    if (
      typeof response.data === "string" &&
      response.data.includes("<!DOCTYPE")
    ) {
      console.warn(`⚠️ [${requestId}] Received HTML response instead of JSON`);
      console.warn("This usually means the endpoint is returning a 404 page");
    }

    // Log response in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `📥 [${requestId}] ${response.status} ${response.config.url}`,
        response.data?.message || "",
      );
    }

    return response;
  },
  async (error: AxiosError): Promise<any> => {
    const requestId =
      (error.config?.headers as any)?.["X-Request-ID"] || "unknown";

    // ============ NETWORK ERRORS ============
    if (!error.response) {
      console.error(`🌐 [${requestId}] Network Error:`, error.message);

      // Retry on network errors
      if (
        (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") &&
        retryCount < MAX_RETRIES &&
        error.config
      ) {
        retryCount++;
        console.log(
          `🔄 [${requestId}] Retry ${retryCount}/${MAX_RETRIES} for ${error.config.url}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
        return api.request(error.config);
      }
      retryCount = 0; // Reset retry count

      return Promise.reject({
        success: false,
        message: "Network error - Please check your internet connection",
        originalError: error,
      });
    }

    // ============ HTTP ERRORS ============
    const { response } = error;
    const status = response.status;
    const data = response.data as any;

    console.error(`❌ [${requestId}] API Error:`, {
      status,
      data: data,
      url: error.config?.url,
      method: error.config?.method,
    });

    // ============ HANDLE SPECIFIC STATUS CODES ============
    switch (status) {
      case 400:
        console.error("❌ Bad Request:", data?.message || "Invalid request");
        break;

      case 401: {
        console.error("❌ Unauthorized - Token expired or invalid");

        // Check if we should attempt token refresh
        const originalRequest = error.config as any;
        if (
          !originalRequest._retry &&
          !window.location.pathname.includes("/login")
        ) {
          originalRequest._retry = true;

          if (isRefreshing) {
            // Queue the request if refresh is in progress
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (token && originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return api.request(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          isRefreshing = true;

          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            try {
              const response = await api.post("/auth/refresh-token", {
                refreshToken,
              });
              const { token } = response.data.data;

              if (token) {
                localStorage.setItem("token", token);
                api.defaults.headers.common["Authorization"] =
                  `Bearer ${token}`;
                processQueue(null, token);

                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return api.request(originalRequest);
              }
            } catch (refreshError) {
              processQueue(refreshError, null);
              // Clear session on refresh failure
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              localStorage.removeItem("refreshToken");
              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
              return Promise.reject(refreshError);
            } finally {
              isRefreshing = false;
            }
          } else {
            // No refresh token, redirect to login
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("refreshToken");
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }
        } else {
          // Already retried, redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("refreshToken");
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.includes("/login")
          ) {
            window.location.href = "/login";
          }
        }
        break;
      }

      case 403:
        console.error(
          "❌ Forbidden - Insufficient permissions:",
          data?.message,
        );
        break;

      case 404:
        console.error("❌ Not Found:", data?.message || "Resource not found");
        break;

      case 409:
        console.error(
          "❌ Conflict:",
          data?.message || "Resource already exists",
        );
        break;

      case 422:
        console.error("❌ Validation Error:", data?.errors || data?.message);
        break;

      case 429:
        console.error("❌ Too Many Requests - Rate limited");
        break;

      case 500:
        console.error("❌ Internal Server Error:", data?.message);
        break;

      default:
        console.error(
          `❌ HTTP Error ${status}:`,
          data?.message || "An error occurred",
        );
    }

    // ============ RETURN STANDARDIZED ERROR ============
    return Promise.reject({
      success: false,
      status: status,
      message: data?.message || error.message || "An error occurred",
      errors: data?.errors || null,
      originalError: error,
    });
  },
);

// ============ UTILITY FUNCTIONS ============

/**
 * Set authentication token
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem("token", token);
};

/**
 * Set refresh token
 */
export const setRefreshToken = (token: string): void => {
  localStorage.setItem("refreshToken", token);
};

/**
 * Remove all authentication tokens
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("refreshToken");
  delete api.defaults.headers.common["Authorization"];
};

/**
 * Get authentication token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

/**
 * Get refresh token
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = <T = any>(): T | null => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/**
 * Set current user
 */
export const setCurrentUser = (user: any): void => {
  localStorage.setItem("user", JSON.stringify(user));
};

/**
 * Clear all session data
 */
export const clearSession = (): void => {
  removeAuthToken();
  localStorage.removeItem("user");
  localStorage.removeItem("refreshToken");
  delete api.defaults.headers.common["Authorization"];
};

/**
 * Handle logout
 */
export const logout = (): void => {
  clearSession();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// ============ GENERIC API METHODS ============

/**
 * Generic API service with type safety
 */
export const apiService = {
  get: <T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    return api.get(url, config).then((res) => res.data);
  },

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    return api.post(url, data, config).then((res) => res.data);
  },

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    return api.put(url, data, config).then((res) => res.data);
  },

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    return api.patch(url, data, config).then((res) => res.data);
  },

  delete: <T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    return api.delete(url, config).then((res) => res.data);
  },
};

// ============ AUTH SERVICE ============
export const authService = {
  /**
   * Login user
   */
  login: async (email: string, password: string): Promise<ApiResponse<any>> => {
    const response = await api.post("/auth/login", { email, password });
    const { token, user, refreshToken } = response.data.data;

    if (token) {
      setAuthToken(token);
      setCurrentUser(user);
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    return response.data;
  },

  /**
   * Logout user
   */
  logout: (): void => {
    clearSession();
  },

  /**
   * Refresh token
   */
  refreshToken: async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await api.post("/auth/refresh-token", { refreshToken });
      const { token } = response.data.data;
      if (token) {
        setAuthToken(token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        return token;
      }
      return null;
    } catch (error) {
      clearSession();
      return null;
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<ApiResponse<any>> => {
    return apiService.get("/auth/me");
  },
};

// ============ EXPORT DEFAULT ============
export default api;

// ============ EXPORT TYPES ============
export type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError };
