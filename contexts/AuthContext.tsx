"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User, AuthContextType } from "@/types";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error parsing stored user:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Handle page navigation - revalidate token on route change
  useEffect(() => {
    const handleRouteChange = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser && !user) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error restoring session:", error);
        }
      }
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [user]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.post("/auth/login", { email, password });

      if (response.data.success) {
        const { user, accessToken } = response.data.data;

        setUser(user);
        setToken(accessToken);
        localStorage.setItem("token", accessToken);
        localStorage.setItem("user", JSON.stringify(user));

        toast.success(`Welcome back, ${user.fullName}!`);
      } else {
        toast.error(response.data.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear any cached data
    sessionStorage.clear();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
