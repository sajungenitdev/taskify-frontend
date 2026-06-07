"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
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
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
}

// EXPORT THIS - so it can be imported in useAuth hook
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Set default authorization header
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

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(userData);

        toast.success(`Welcome back, ${userData.fullName}!`);
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
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    toast.success("Logged out successfully");
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;

    const roleList = Array.isArray(roles) ? roles : [roles];
    const userRole = user.role?.toLowerCase();

    // Super admin has all access
    if (userRole === "super_admin") return true;

    // Check if user has any of the required roles
    return roleList.some((role) => role.toLowerCase() === userRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// This is the hook - it will work now because AuthContext is exported
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
