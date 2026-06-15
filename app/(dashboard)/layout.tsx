"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Layout/Sidebar";
import Header from "@/components/Layout/Header";
// import { Loader } from "@/components/UI/Loader";

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

  // Load collapsed state
  // useEffect(() => {
  //   const savedState = localStorage.getItem("sidebarCollapsed");
  //   if (savedState !== null) {
  //     setIsCollapsed(savedState === "true");
  //   }
  // }, []);

  // Handle navigation loading state
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = () => {
      const savedState = localStorage.getItem("sidebarCollapsed");
      if (savedState !== null) {
        setIsCollapsed(savedState === "true");
      }
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    return () =>
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // if (isLoading || isNavigating) {
  //   return <Loader />;
  // }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onCollapseChange={(collapsed) => setIsCollapsed(collapsed)}
      />
      <div
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-72"
        }`}
      >
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="pt-15  bg-slate-950 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
