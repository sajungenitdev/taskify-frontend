// app/(dashboard)/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Layout/Sidebar";
import Header from "@/components/Layout/Header";
import AssistantWizard from "@/components/Assistant/AssistantWizard";
import EnableNotificationsPage from "@/components/Assistant/EnableNotificationsPage";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }
  }, []);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const handleSidebarToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.collapsed !== undefined) {
        setIsCollapsed(customEvent.detail.collapsed);
      } else {
        const savedState = localStorage.getItem("sidebarCollapsed");
        if (savedState !== null) {
          setIsCollapsed(savedState === "true");
        }
      }
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    return () => window.removeEventListener("sidebarToggle", handleSidebarToggle);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const hasLoggedInBefore = localStorage.getItem("hasLoggedInBefore");
      const notificationsShown = localStorage.getItem("notificationsPageShown");

      if (!hasLoggedInBefore) {
        setShowNotifications(true);
        localStorage.setItem("hasLoggedInBefore", "true");
      } else if (!notificationsShown) {
        setShowNotifications(true);
      } else {
        const notificationsEnabled = localStorage.getItem("notificationsEnabled");
        if (!notificationsEnabled) {
          setShowNotifications(true);
        }
      }
    }
  }, [isLoading, isAuthenticated, user]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  /* ---------- Margin aligns with 72px (rail) or 256px (expanded) ---------- */
  const mainMarginClass = isCollapsed ? "lg:ml-[72px]" : "lg:ml-64";

  if (!isMounted) {
    return null;
  }

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
      {/* Sidebar Component */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onCollapseChange={(collapsed) => setIsCollapsed(collapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`
          flex-1 flex flex-col min-w-0
          transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          will-change-[margin]
          ${mainMarginClass}
        `}
      >
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <main className="pt-16 bg-gray-50 min-h-screen flex-1">
          <div className="w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden animate-fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <AssistantWizard />

      <EnableNotificationsPage
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          localStorage.setItem("notificationsPageShown", "true");
        }}
        onEnable={() => {
          localStorage.setItem("notificationsEnabled", "true");
          localStorage.setItem("notificationsPageShown", "true");
          setShowNotifications(false);
        }}
        onSkip={() => {
          localStorage.setItem("notificationsPageShown", "true");
          localStorage.setItem("notificationsSkipped", "true");
          setShowNotifications(false);
        }}
      />
    </div>
  );
}