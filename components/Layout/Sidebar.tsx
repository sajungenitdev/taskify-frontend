"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  X,
  Zap,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  menuItems,
  sectionTitles,
  sectionIcons,
  subMenuItems,
} from "@/lib/menuItems";

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function Sidebar({
  isMobileOpen,
  onClose,
  onCollapseChange,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {},
  );

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    const initialState = savedState === "true";
    setIsCollapsed(initialState);
    onCollapseChange?.(initialState);
  }, [onCollapseChange]);

  // Save collapsed state and notify parent
  const toggleCollapse = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
    onCollapseChange?.(newState);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("sidebarToggle"));
    }
  }, [isCollapsed, onCollapseChange]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "from-purple-600 to-pink-600";
      case "admin":
        return "from-blue-600 to-cyan-600";
      case "hr_manager":
        return "from-emerald-600 to-teal-600";
      case "dept_manager":
        return "from-orange-600 to-red-600";
      case "project_manager":
        return "from-cyan-600 to-blue-600";
      case "line_manager":
        return "from-indigo-600 to-purple-600";
      default:
        return "from-slate-600 to-slate-700";
    }
  };

  const filteredItems = menuItems.filter((item) => {
    if (item.roles.includes("all")) return true;
    return hasRole(item.roles);
  });

  // Group items by section
  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      const section = item.section || "main";
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, typeof menuItems>,
  );

  // Get submenu items for a parent
  const getSubItems = (parentName: string) => {
    return subMenuItems.filter(
      (item) => item.parent === parentName && hasRole(item.roles),
    );
  };

  const sidebarContent = (
    <aside
      className={`relative bg-gradient-to-b from-slate-900 to-slate-950 min-h-screen flex flex-col shadow-2xl transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Header - Fixed */}
      <div
        className={`p-4 border-b border-slate-800/80 transition-all duration-300 sticky top-0 z-10 ${
          scrolled ? "bg-slate-900/95 backdrop-blur-md" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center gap-3 ${isCollapsed ? "justify-center w-full" : ""}`}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur-md opacity-50" />
              <div className="relative w-9 h-9 bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">
                  Taskify
                </h1>
                <p className="text-slate-500 text-[9px] font-medium uppercase tracking-wider">
                  Enterprise Suite
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-500 transition-all duration-200 z-50 shadow-lg"
      >
        {isCollapsed ? (
          <ChevronRight size={12} className="text-slate-400" />
        ) : (
          <ChevronLeft size={12} className="text-slate-400" />
        )}
      </button>

      {/* User Profile Card - Fixed */}
      <div className="sticky top-[73px] z-10 mx-3 mt-4 p-2 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
        <div
          className={`flex items-center gap-2 ${isCollapsed ? "flex-col" : ""}`}
        >
          <div
            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getRoleBadgeColor(
              user?.role || "employee",
            )} flex items-center justify-center shadow-lg shrink-0`}
          >
            <span className="text-white text-xs font-bold">
              {user?.fullName?.charAt(0) || "U"}
            </span>
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">
                  {user?.fullName || "User"}
                </p>
                <p className="text-slate-400 text-[9px] font-medium uppercase">
                  {user?.role?.replace(/_/g, " ") || "Employee"}
                </p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 shrink-0" />
            </>
          )}
        </div>
      </div>

      {/* Navigation - Scrollable Area */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-3 space-y-4 custom-scrollbar"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {Object.entries(groupedItems).map(([section, items]) => {
          const SectionIcon = sectionIcons[section];
          return (
            <div key={section}>
              {!isCollapsed && (
                <div className="px-2 mb-2 flex items-center gap-2">
                  {SectionIcon && (
                    <SectionIcon size={10} className="text-indigo-400" />
                  )}
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    {sectionTitles[section] || section.toUpperCase()}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  const subItems = getSubItems(item.name);
                  const isExpanded = expandedMenus[item.name];
                  const hasSubmenu = subItems.length > 0;

                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          if (hasSubmenu) {
                            e.preventDefault();
                            toggleSubmenu(item.name);
                          } else {
                            onClose?.();
                          }
                        }}
                        className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200 group relative ${
                          isCollapsed ? "justify-center" : ""
                        } ${
                          isActive && !hasSubmenu
                            ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-400 border border-indigo-500/30"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                        title={isCollapsed ? item.name : ""}
                      >
                        <div className="relative">
                          <Icon
                            size={18}
                            className={`transition-all duration-200 ${
                              isActive
                                ? "text-indigo-400"
                                : "text-slate-500 group-hover:text-slate-300"
                            }`}
                          />
                          {item.badge && !isCollapsed && (
                            <span
                              className={`absolute -top-1 -right-2 w-4 h-4 rounded-full ${item.badgeColor || "bg-indigo-500"} text-white text-[8px] font-bold flex items-center justify-center`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {!isCollapsed && (
                          <>
                            <span className="text-sm font-medium flex-1">
                              {item.name}
                            </span>
                            {hasSubmenu && (
                              <div className="text-slate-500">
                                {isExpanded ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </div>
                            )}
                            {item.badge && !hasSubmenu && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full ${item.badgeColor || "bg-indigo-500/20"} text-${item.badgeColor?.replace("bg-", "").replace("500", "400") || "indigo-400"} font-medium`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {isActive && !isCollapsed && !hasSubmenu && (
                          <div className="w-1 h-6 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50 absolute right-0" />
                        )}
                      </Link>

                      {/* Submenu Items */}
                      {!isCollapsed && hasSubmenu && isExpanded && (
                        <div className="ml-6 mt-1 space-y-1 border-l border-slate-800/50 pl-2">
                          {subItems.map((subItem) => {
                            const isSubActive = pathname === subItem.href;
                            const SubIcon = subItem.icon;
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                onClick={onClose}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 group ${
                                  isSubActive
                                    ? "bg-gradient-to-r from-indigo-600/15 to-purple-600/15 text-indigo-400"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                                }`}
                              >
                                <SubIcon size={14} />
                                <span className="text-[11px] font-medium">
                                  {subItem.name}
                                </span>
                                {subItem.badge && (
                                  <span
                                    className={`text-[8px] px-1 py-0.5 rounded-full ${subItem.badgeColor || "bg-indigo-500/20"} text-${subItem.badgeColor?.replace("bg-", "").replace("500", "400") || "indigo-400"}`}
                                  >
                                    {subItem.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer - Fixed at bottom */}
      <div className="sticky bottom-0 p-3 border-t border-slate-800/80 bg-gradient-to-b from-transparent to-slate-950">
        {/* {!isCollapsed && (
          <div className="mb-2 p-2 rounded-lg bg-slate-800/30 border border-slate-800/50">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-500" />
              <p className="text-[9px] text-slate-500 font-medium">
                System: <span className="text-emerald-400">Operational</span>
              </p>
            </div>
          </div>
        )} */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/10 transition-all duration-200 group ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut size={16} className="group-hover:text-red-400" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
        {!isCollapsed && (
          <p className="text-[8px] text-slate-600 text-center mt-2">
            v2.0.0 • © 2026 Taskify
          </p>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full z-20">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={onClose}
          />
          <div className="fixed left-0 top-0 h-full z-40 lg:hidden animate-slide-in-right">
            {sidebarContent}
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.6);
        }
      `}</style>
    </>
  );
}
