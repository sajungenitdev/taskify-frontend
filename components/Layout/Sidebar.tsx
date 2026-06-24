"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  CheckSquare,
  ChevronRight as ChevronRightIcon,
  ArrowRight,
} from "lucide-react";
import {
  personalItems,
  menuItems,
  subMenuItems,
  hasAccess,
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
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    const initialState = savedState === "true";
    setIsCollapsed(initialState);
    onCollapseChange?.(initialState);

    // Dispatch event for header to listen
    window.dispatchEvent(
      new CustomEvent("sidebarToggle", { detail: { collapsed: initialState } }),
    );
  }, [onCollapseChange]);

  const toggleCollapse = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
    onCollapseChange?.(newState);

    window.dispatchEvent(
      new CustomEvent("sidebarToggle", { detail: { collapsed: newState } }),
    );

    if (newState) {
      setHoveredItem(null);
    }
  }, [isCollapsed, onCollapseChange]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = (itemName: string, event: React.MouseEvent) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    let leftPos = rect.right + 12;
    const dropdownWidth = 280;

    // Prevent dropdown from going off-screen right
    if (leftPos + dropdownWidth > window.innerWidth) {
      leftPos = rect.left - dropdownWidth - 12;
    }

    // Calculate top position ensuring dropdown stays within viewport
    let topPos = rect.top - 12;
    const dropdownHeight = Math.min(400, window.innerHeight - 40);

    if (topPos + dropdownHeight > window.innerHeight - 20) {
      topPos = window.innerHeight - dropdownHeight - 20;
    }
    if (topPos < 10) {
      topPos = 10;
    }

    setDropdownPosition({
      top: topPos,
      left: leftPos,
    });
    setHoveredItem(itemName);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 200);
  };

  const handleDropdownMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleDropdownMouseLeave = () => {
    setHoveredItem(null);
  };

  const userRole = user?.role || "employee";

  const filteredPersonalItems = personalItems.filter((item) =>
    hasAccess(userRole, item.roles),
  );

  const filteredParentItems = menuItems.filter((item) =>
    hasAccess(userRole, item.roles),
  );

  const groupedParentItems = filteredParentItems.reduce(
    (acc, item) => {
      const section = item.section || "main";
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, typeof menuItems>,
  );

  const getSubItems = (parentName: string) => {
    return subMenuItems.filter(
      (item) => item.parent === parentName && hasAccess(userRole, item.roles),
    );
  };

  const isParentActive = (parentName: string) => {
    const subItems = getSubItems(parentName);
    return subItems.some((subItem) => isActive(subItem.href));
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const sectionOrder = [
    "main",
    "projects",
    "tasks",
    "team",
    "hr",
    "reports",
    "system",
    "support",
  ];

  const renderDropdownMenu = (parentName: string, items: any[]) => {
    if (hoveredItem !== parentName) return null;

    const parentItem = menuItems.find((item) => item.name === parentName);
    const isParentActiveFlag = isParentActive(parentName);

    return (
      <div
        ref={dropdownRef}
        className="fixed z-50 min-w-70 bg-white rounded-xl shadow-2xl border border-gray-200/80 overflow-hidden"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          maxHeight: "400px",
        }}
        onMouseEnter={handleDropdownMouseEnter}
        onMouseLeave={handleDropdownMouseLeave}
      >
        <div className="relative px-4 py-3 bg-linear-to-r from-gray-50 to-white border-b border-gray-200/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
              {parentItem?.icon && (
                <parentItem.icon size={14} className="text-white" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-800">
                {parentName}
              </span>
              {isParentActiveFlag && (
                <div className="text-[9px] text-indigo-600 font-medium">
                  Active
                </div>
              )}
            </div>
            {isParentActiveFlag && (
              <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-300" />
            )}
          </div>
        </div>

        <div className="py-2 max-h-85 overflow-y-auto custom-scrollbar">
          {items.map((subItem) => {
            const isSubActive = isActive(subItem.href);
            const SubIcon = subItem.icon;
            return (
              <Link
                key={subItem.href}
                href={subItem.href}
                onClick={() => {
                  setHoveredItem(null);
                  onClose?.();
                }}
                className={`flex items-center gap-3 px-4 py-2.5 mx-1 rounded-lg transition-all duration-200 group ${
                  isSubActive
                    ? "bg-linear-to-r from-indigo-50 to-purple-50 text-indigo-600"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isSubActive
                      ? "bg-indigo-100"
                      : "bg-gray-100 group-hover:bg-indigo-50"
                  }`}
                >
                  <SubIcon
                    size={14}
                    className={
                      isSubActive
                        ? "text-indigo-600"
                        : "text-gray-500 group-hover:text-indigo-600"
                    }
                  />
                </div>
                <span className="text-sm font-medium flex-1">
                  {subItem.name}
                </span>
                {subItem.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      subItem.badgeColor || "bg-indigo-100 text-indigo-600"
                    } font-medium`}
                  >
                    {subItem.badge}
                  </span>
                )}
                {isSubActive && (
                  <div className="w-1 h-6 rounded-full bg-linear-to-b from-indigo-400 to-purple-400" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="px-4 py-2 border-t border-gray-200/60 bg-gray-50/50">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>{items.length} menu items</span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              Click to navigate
            </span>
          </div>
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <aside
      className={`relative bg-white min-h-screen flex flex-col shadow-xl transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-80"
      }`}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-indigo-400 to-purple-400 via-50% to-transparent animate-shimmer" />

      {/* Header with Toggle Button */}
      <div
        className={`px-4 py-[12px] border-b border-gray-200/80 transition-all duration-300 sticky top-0 z-10 ${
          scrolled ? "bg-white/95 backdrop-blur-md" : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center gap-3 ${
              isCollapsed ? "justify-center w-full" : ""
            }`}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-r from-indigo-400 to-purple-400 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
              <div className="relative w-10 h-10 bg-white border border-indigo-200 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-md">
                <CheckSquare className="w-5 h-5 text-indigo-600 group-hover:text-indigo-500" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                  Taskify
                </h1>
                <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                  Enterprise Suite
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Toggle Button - Positioned at top right of sidebar */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-linear-to-r hover:from-indigo-500 hover:to-purple-500 hover:border-transparent hover:text-white transition-all duration-200 z-50 shadow-lg group"
      >
        {isCollapsed ? (
          <ChevronRight
            size={12}
            className="text-gray-400 group-hover:text-white transition-colors"
          />
        ) : (
          <ChevronLeft
            size={12}
            className="text-gray-400 group-hover:text-white transition-colors"
          />
        )}
      </button>

      {/* Navigation - No Section Titles, Scrollable */}
      <nav
        className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar"
        style={{ maxHeight: "calc(100vh - 80px)" }}
      >
        {/* Personal Items */}
        {filteredPersonalItems.length > 0 && (
          <div className="space-y-1">
            {filteredPersonalItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                    isCollapsed ? "justify-center" : ""
                  } ${
                    active
                      ? "bg-linear-to-r from-indigo-50 to-purple-50 text-indigo-600"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                  title={isCollapsed ? item.name : ""}
                >
                  <div className="relative">
                    <Icon
                      size={18}
                      className={`transition-all duration-200 ${
                        active
                          ? "text-indigo-600"
                          : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    />
                    {item.badge && !isCollapsed && (
                      <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-linear-to-r from-red-500 to-rose-500 text-white text-[8px] font-bold flex items-center justify-center animate-pulse shadow-lg shadow-red-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className="text-sm font-medium flex-1">
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {active && !isCollapsed && (
                    <div className="w-1 h-6 rounded-full bg-linear-to-b from-indigo-400 to-purple-400 absolute right-0" />
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Divider between personal items and main menu */}
        {filteredPersonalItems.length > 0 &&
          filteredParentItems.length > 0 &&
          !isCollapsed && <div className="h-px bg-gray-200/60 my-2" />}

        {/* Parent Menu Items - No Section Titles */}
        {sectionOrder.map((section) => {
          const items = groupedParentItems[section];
          if (!items || items.length === 0) return null;

          return (
            <div key={section} className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const subItems = getSubItems(item.name);
                const hasSubmenu = subItems.length > 0;
                const isParentActiveFlag = isParentActive(item.name);
                const isHovered = hoveredItem === item.name;

                return (
                  <div
                    key={item.name}
                    onMouseEnter={(e) => {
                      if (hasSubmenu) handleMouseEnter(item.name, e);
                    }}
                    onMouseLeave={() => {
                      if (hasSubmenu) handleMouseLeave();
                    }}
                  >
                    <div
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative cursor-pointer ${
                        isCollapsed ? "justify-center" : ""
                      } ${
                        isParentActiveFlag || (isHovered && hasSubmenu)
                          ? "bg-linear-to-r from-indigo-50 to-purple-50 text-indigo-600"
                          : isActive(item.href) && !hasSubmenu
                            ? "bg-linear-to-r from-indigo-50 to-purple-50 text-indigo-600"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                      title={isCollapsed ? item.name : ""}
                    >
                      <Icon
                        size={18}
                        className={`transition-all duration-200 ${
                          isParentActiveFlag || (isHovered && hasSubmenu)
                            ? "text-indigo-600"
                            : isActive(item.href) && !hasSubmenu
                              ? "text-indigo-600"
                              : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="text-sm font-medium flex-1 text-left">
                            {item.name}
                          </span>
                          {hasSubmenu && (
                            <ChevronRightIcon
                              size={14}
                              className={`transition-all duration-300 ${
                                isHovered
                                  ? "translate-x-1 text-indigo-600"
                                  : "text-gray-400 group-hover:text-gray-600"
                              }`}
                            />
                          )}
                          {item.badge && !hasSubmenu && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-medium">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {(isParentActiveFlag ||
                        (isActive(item.href) && !hasSubmenu)) &&
                        !isCollapsed && (
                          <div className="w-1 h-6 rounded-full bg-linear-to-b from-indigo-400 to-purple-400 absolute right-0" />
                        )}
                    </div>

                    {hasSubmenu && renderDropdownMenu(item.name, subItems)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sticky bottom-0 p-4 border-t border-gray-200/80 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-sm">
        <button
          onClick={logout}
          className={`group cursor-pointer relative w-full overflow-hidden rounded-xl transition-all duration-300 ${
            isCollapsed ? "px-2 py-2.5" : "px-4 py-2.5"
          }`}
          title={isCollapsed ? "Logout" : ""}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-linear-to-r from-red-50 to-rose-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-linear-to-r from-red-500/5 to-rose-500/5 rounded-xl" />

          {/* Border glow effect */}
          <div className="absolute inset-0 rounded-xl border border-red-200 group-hover:border-red-300 transition-all duration-300" />

          {/* Content */}
          <div
            className={`relative flex items-center gap-3 transition-all duration-300 ${
              isCollapsed ? "justify-center" : "justify-center"
            }`}
          >
            <div
              className={`relative transition-all duration-300 ${
                isCollapsed ? "" : "group-hover:scale-110"
              }`}
            >
              <LogOut
                size={18}
                className="text-red-400 group-hover:text-red-500 transition-all duration-300"
              />
              {/* Glow behind icon */}
              <div className="absolute inset-0 rounded-full bg-red-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </div>

            {!isCollapsed && (
              <span className="text-sm font-medium text-red-500 group-hover:text-red-600 transition-all duration-300">
                Sign Out
              </span>
            )}

            {!isCollapsed && (
              <ArrowRight
                size={14}
                className="text-red-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all duration-300 opacity-0 group-hover:opacity-100"
              />
            )}
          </div>
        </button>

        {!isCollapsed && (
          <div className="mt-4 text-center">
            <p className="text-[9px] text-gray-400 font-medium tracking-wider">
              Version 2.0.0
            </p>
            <p className="text-[9px] text-gray-400 font-medium mt-0.5">
              © 2026 Taskify Enterprise Suite
            </p>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block fixed left-0 top-0 h-full z-20">
        {sidebarContent}
      </div>

      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
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
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </>
  );
}
