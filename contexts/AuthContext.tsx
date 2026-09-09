// contexts/AuthContext.tsx

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId?: string;
  departmentId?: any;
  department?: any;
  phoneNumber?: string;
  location?: string;
  position?: string;
  bio?: string;
  profilePhoto?: string;
  onboardingCompleted?: boolean;
  firstLogin?: boolean;
  workSettings?: any;
  notificationPreferences?: any;
  trial?: {
    isActive: boolean;
    startDate: string;
    endDate: string;
    daysLeft: number;
    plan: string;
    billingCycle: string;
    price: number;
    currency: string;
    period: string;
  };
  subscription?: {
    status: string;
    plan: string;
    billingCycle: string;
    price: number;
    currency: string;
    startDate: string;
    trialEndDate: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null; // ✅ ADD THIS
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  updateProfilePhoto: (photoUrl: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // ✅ ADD THIS
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    console.log("🔐 [AUTH] Loading from localStorage:", {
      hasToken: !!storedToken,
      hasUser: !!storedUser,
    });

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken); // ✅ SET TOKEN
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        console.log("✅ [AUTH] User and token loaded successfully");
      } catch (error) {
        console.error("❌ [AUTH] Error parsing user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      }
    } else {
      console.log("⚠️ [AUTH] No token or user found in localStorage");
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data;

        if (!newToken) {
          throw new Error("No token received from server");
        }

        console.log("✅ [AUTH] Login successful, setting token and user");

        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        setToken(newToken); // ✅ SET TOKEN
        setUser(userData);

        // toast.success(`Welcome back, ${userData.fullName}!`);
        return userData;
      } else {
        throw new Error(response.data.message || "Invalid Credentials");
      }
    } catch (error: any) {
      console.error("❌ [AUTH] Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    console.log("🔐 [AUTH] Logging out, clearing token and user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    delete api.defaults.headers.common["Authorization"];
    setToken(null); // ✅ CLEAR TOKEN
    setUser(null);
    // toast.success("Logged out successfully");
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    const userRole = user.role?.toLowerCase();
    if (userRole === "super_admin") return true;
    return roleList.some((role) => role.toLowerCase() === userRole);
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      throw error;
    }
  };

  const updateProfilePhoto = useCallback(
    async (photoUrl: string) => {
      if (!user) return;

      const updatedUser = { ...user, profilePhoto: photoUrl };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      try {
        await refreshUser();
      } catch (error) {
        console.error("Error refreshing user after photo update:", error);
      }
    },
    [user, refreshUser],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token, // ✅ EXPOSE TOKEN
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        hasRole,
        updateUser,
        refreshUser,
        updateProfilePhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}