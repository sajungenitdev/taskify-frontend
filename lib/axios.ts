// lib/axios.ts
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
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// ============ CREATE AXIOS INSTANCE ============
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
  timeout: 30000,
});

// ============ TOKEN INTERCEPTOR - FIXED ============
// This runs BEFORE every request and ensures the token is always sent
api.interceptors.request.use(
  (config) => {
    // Get the latest token from localStorage
    const token = localStorage.getItem("token");
    
    // ALWAYS set the token if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Log for debugging
      console.log(`🔑 Token attached to request: ${config.url}`);
    } else {
      console.log(`⚠️ No token for request: ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============ RETRY CONFIGURATION ============
const MAX_RETRIES = 3;
let retryCount = 0;
const RETRYABLE_STATUSES = [408, 429, 500, 502, 503, 504];
const RETRYABLE_ERRORS = ["ECONNABORTED", "ERR_NETWORK", "ETIMEDOUT"];

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

// ============ CHECK IF ERROR IS RETRYABLE ============
const isRetryableError = (error: AxiosError): boolean => {
  if (error.code && RETRYABLE_ERRORS.includes(error.code)) {
    return true;
  }
  if (
    error.response?.status &&
    RETRYABLE_STATUSES.includes(error.response.status)
  ) {
    return true;
  }
  if (
    error.message?.includes("timeout") ||
    error.message?.includes("exceeded")
  ) {
    return true;
  }
  return false;
};

// ============ REQUEST INTERCEPTOR (with logging) ============
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const requestId = Math.random().toString(36).substring(2, 10);
    config.headers["X-Request-ID"] = requestId;

    // Double-check token is set
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Increase timeout for specific endpoints
    if (config.url?.includes("/tasks") && config.method === "post") {
      config.timeout = 120000;
    }

    // For multipart/form-data (file uploads)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      config.timeout = 180000;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `📤 [${requestId}] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
        config.data instanceof FormData ? "FormData" : config.data || "",
      );
    }

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

    if (
      typeof response.data === "string" &&
      response.data.includes("<!DOCTYPE")
    ) {
      console.warn(`⚠️ [${requestId}] Received HTML response instead of JSON`);
    }

    retryCount = 0;

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

    // Network errors
    if (!error.response) {
      console.error(`🌐 [${requestId}] Network Error:`, error.message);

      if (isRetryableError(error) && retryCount < MAX_RETRIES && error.config) {
        retryCount++;
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
        console.log(
          `🔄 [${requestId}] Retry ${retryCount}/${MAX_RETRIES} for ${error.config.url} (delay: ${delay}ms)`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api.request(error.config);
      }
      retryCount = 0;

      return Promise.reject({
        success: false,
        message: "Network error - Please check your internet connection",
        code: error.code,
        originalError: error,
      });
    }

    const { response } = error;
    const status = response.status;
    const data = response.data as any;

    // Retry on retryable status codes
    if (isRetryableError(error) && retryCount < MAX_RETRIES && error.config) {
      retryCount++;
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
      console.log(
        `🔄 [${requestId}] Retry ${retryCount}/${MAX_RETRIES} for ${error.config.url} (status: ${status}, delay: ${delay}ms)`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api.request(error.config);
    }
    retryCount = 0;

    console.error(`❌ [${requestId}] API Error:`, {
      status,
      data: data,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Handle specific status codes
    switch (status) {
      case 400:
        console.error("❌ Bad Request:", data?.message || "Invalid request");
        break;

      case 401: {
        console.error("❌ Unauthorized - Token expired or invalid");

        const originalRequest = error.config as any;
        if (
          !originalRequest._retry &&
          !window.location.pathname.includes("/login")
        ) {
          originalRequest._retry = true;

          if (isRefreshing) {
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
              clearSession();
              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
              return Promise.reject(refreshError);
            } finally {
              isRefreshing = false;
            }
          } else {
            clearSession();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }
        }
        break;
      }

      case 403:
        console.error("❌ Forbidden:", data?.message);
        break;

      case 404:
        console.error("❌ Not Found:", data?.message);
        break;

      case 409:
        console.error("❌ Conflict:", data?.message);
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

export const setAuthToken = (token: string): void => {
  localStorage.setItem("token", token);
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem("refreshToken", token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("refreshToken");
  delete api.defaults.headers.common["Authorization"];
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken");
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const getCurrentUser = <T = any>(): T | null => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: any): void => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearSession = (): void => {
  removeAuthToken();
  localStorage.removeItem("user");
  localStorage.removeItem("refreshToken");
  delete api.defaults.headers.common["Authorization"];
};

export const logout = (): void => {
  clearSession();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};

// ============ GENERIC API METHODS ============

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

  logout: (): void => {
    clearSession();
  },

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

  getProfile: async (): Promise<ApiResponse<any>> => {
    return apiService.get("/auth/me");
  },
};

export default api;