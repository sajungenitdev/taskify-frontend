"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Layout/Sidebar";
import Header from "@/components/Layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle navigation loading state
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300); // Reduced from 500ms for better UX

    return () => clearTimeout(timer);
  }, [pathname]);

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      if (event.detail?.collapsed !== undefined) {
        setIsCollapsed(event.detail.collapsed);
      } else {
        const savedState = localStorage.getItem("sidebarCollapsed");
        if (savedState !== null) {
          setIsCollapsed(savedState === "true");
        }
      }
    };

    window.addEventListener(
      "sidebarToggle",
      handleSidebarToggle as EventListener
    );
    
    // Load initial state
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }

    return () =>
      window.removeEventListener(
        "sidebarToggle",
        handleSidebarToggle as EventListener
      );
  }, []);

  // Handle authentication redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Memoized collapse class to prevent recalculation
  const mainMarginClass = isCollapsed ? "lg:ml-20" : "lg:ml-80";

  // Don't render anything during initial load to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Show nothing while checking authentication
  if (isLoading || isNavigating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onCollapseChange={(collapsed) => setIsCollapsed(collapsed)}
      />

      {/* Main content area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainMarginClass}`}
      >
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
        
        {/* Main content */}
        <main className="pt-[73px] bg-gray-50 min-h-screen">
          {/* Content wrapper with max-width and padding */}
          <div className="px-0 md:px-0 lg:px-0 py-0 w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
}