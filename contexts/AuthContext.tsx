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
  phoneNumber?: string;
  location?: string;
  position?: string;
  bio?: string;
  profilePhoto?: string;
  onboardingCompleted?: boolean;
  firstLogin?: boolean;
  workSettings?: any;
  notificationPreferences?: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>; // ← Change from Promise<void> to Promise<User>
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
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } catch (error) {
        console.error("Error parsing user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      if (response.data.success) {
        const { token, user: userData } = response.data.data;

        if (!token) {
          throw new Error("No token received from server");
        }

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(userData);

        toast.success(`Welcome back, ${userData.fullName}!`);
        return userData;
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    toast.success("Logged out successfully");
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

      // ✅ Update local state
      const updatedUser = { ...user, profilePhoto: photoUrl };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // ✅ Refresh from server
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
        isLoading,
        isAuthenticated: !!user,
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
