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

    console.log("🔍 AuthProvider mounted");
    console.log("📝 Token in localStorage:", token ? "YES" : "NO");
    console.log("📝 User in localStorage:", storedUser ? "YES" : "NO");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("✅ User restored:", parsedUser.email);
      } catch (error) {
        console.error("Error parsing user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  // ============ LOGIN FUNCTION ============
  // contexts/AuthContext.tsx - Update the login function

  const login = async (email: string, password: string): Promise<User> => {
    try {
      console.log("========================================");
      console.log("🔐 LOGIN ATTEMPT");
      console.log("📧 Email:", email);
      console.log("🔑 Password length:", password?.length);
      console.log("========================================");

      if (!email || !password) {
        toast.error("Email and password are required");
        throw new Error("Email and password are required");
      }

      const response = await api.post("/auth/login", { email, password });

      console.log("📡 Response received:", response.status);
      console.log("📡 Response data:", response.data);

      if (response.data.success) {
        const { token, user: userData } = response.data.data;

        if (!token) {
          throw new Error("No token received from server");
        }

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        setUser(userData);

        console.log("✅ Login successful for:", userData.email);
        console.log("========================================");

        toast.success(`Welcome back, ${userData.fullName}!`);

        // ← Return the user data
        return userData; // ← Add this return
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error: any) {
      console.error("❌ Login error:", error);

      let errorMessage = "Login failed. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // ============ LOGOUT FUNCTION ============
  const logout = () => {
    console.log("🔴 Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    toast.success("Logged out successfully");
  };

  // ============ HAS ROLE FUNCTION ============
  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;

    const roleList = Array.isArray(roles) ? roles : [roles];
    const userRole = user.role?.toLowerCase();

    if (userRole === "super_admin") return true;

    return roleList.some((role) => role.toLowerCase() === userRole);
  };

  // ============ UPDATE USER FUNCTION ============
  const updateUser = (userData: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // ============ REFRESH USER FUNCTION ============
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

  // ============ UPDATE PROFILE PHOTO FUNCTION ============
  const updateProfilePhoto = useCallback(
    async (photoUrl: string) => {
      if (!user) return;

      const updatedUser = { ...user, profilePhoto: photoUrl };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      try {
        const response = await api.get("/auth/me");
        if (response.data.success) {
          const userData = response.data.data;
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } catch (error) {
        console.error("Error refreshing user after photo update:", error);
      }
    },
    [user],
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
