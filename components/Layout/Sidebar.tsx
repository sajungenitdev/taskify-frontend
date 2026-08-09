"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useBadges } from "@/hooks/useBadges";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  CheckSquare,
  ChevronRight as ChevronRightIcon,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  PERSONAL_ITEMS,
  MAIN_ITEMS,
  SUB_ITEMS,
  getSubMenuItems,
  hasSubMenuItems,
  hasAccess,
  hasDynamicBadge,
  hasAnyBadge,
  getMenuItemsForRole,
  getMenuItemsGroupedBySection,
  getSectionConfig,
  SECTIONS,
  type BadgeKey,
  type NavItem,
  type SubNavItem,
  type UserRole,
  type SectionId,
} from "@/lib/menuItems";

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

// Enhanced Mandala Pattern with primary color
const MandalaPattern = ({ primaryColor = "#0f2444" }) => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.08]"
    viewBox="0 0 800 800"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer petals */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * 360;
      const x1 = 400 + Math.cos((angle - 15) * (Math.PI / 180)) * 380;
      const y1 = 400 + Math.sin((angle - 15) * (Math.PI / 180)) * 380;
      const x2 = 400 + Math.cos((angle + 15) * (Math.PI / 180)) * 380;
      const y2 = 400 + Math.sin((angle + 15) * (Math.PI / 180)) * 380;
      return (
        <path
          key={`outer-${i}`}
          d={`M400 400 L${x1} ${y1} A 80 80 0 0 1 ${x2} ${y2} Z`}
          fill={primaryColor}
          opacity="0.4"
        />
      );
    })}

    {/* Inner petals */}
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * 360 + 22.5;
      const x1 = 400 + Math.cos((angle - 20) * (Math.PI / 180)) * 250;
      const y1 = 400 + Math.sin((angle - 20) * (Math.PI / 180)) * 250;
      const x2 = 400 + Math.cos((angle + 20) * (Math.PI / 180)) * 250;
      const y2 = 400 + Math.sin((angle + 20) * (Math.PI / 180)) * 250;
      return (
        <path
          key={`inner-${i}`}
          d={`M400 400 L${x1} ${y1} A 60 60 0 0 1 ${x2} ${y2} Z`}
          fill={primaryColor}
          opacity="0.3"
        />
      );
    })}

    {/* Concentric circles */}
    <circle cx="400" cy="400" r="350" stroke={primaryColor} strokeWidth="1.5" opacity="0.2" />
    <circle cx="400" cy="400" r="300" stroke={primaryColor} strokeWidth="1" opacity="0.15" />
    <circle cx="400" cy="400" r="220" stroke={primaryColor} strokeWidth="1.5" opacity="0.18" />
    <circle cx="400" cy="400" r="150" stroke={primaryColor} strokeWidth="1" opacity="0.12" />
    <circle cx="400" cy="400" r="80" stroke={primaryColor} strokeWidth="1.5" opacity="0.15" />

    {/* Inner star */}
    {Array.from({ length: 6 }).map((_, i) => {
      const angle1 = (i / 6) * 360;
      const angle2 = ((i + 0.5) / 6) * 360;
      const r1 = 60;
      const r2 = 30;
      const x1 = 400 + Math.cos(angle1 * (Math.PI / 180)) * r1;
      const y1 = 400 + Math.sin(angle1 * (Math.PI / 180)) * r1;
      const x2 = 400 + Math.cos(angle2 * (Math.PI / 180)) * r2;
      const y2 = 400 + Math.sin(angle2 * (Math.PI / 180)) * r2;
      const x3 = 400 + Math.cos((angle1 + 30) * (Math.PI / 180)) * r1;
      const y3 = 400 + Math.sin((angle1 + 30) * (Math.PI / 180)) * r1;
      return (
        <polygon
          key={`star-${i}`}
          points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
          fill={primaryColor}
          opacity="0.2"
        />
      );
    })}

    {/* Decorative dots */}
    {Array.from({ length: 24 }).map((_, i) => {
      const angle = (i / 24) * 360;
      const x = 400 + Math.cos(angle * (Math.PI / 180)) * 280;
      const y = 400 + Math.sin(angle * (Math.PI / 180)) * 280;
      return (
        <circle key={`dot-${i}`} cx={x} cy={y} r="3" fill={primaryColor} opacity="0.2" />
      );
    })}

    {/* Outer decorative elements */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * 360 + 15;
      const x = 400 + Math.cos(angle * (Math.PI / 180)) * 390;
      const y = 400 + Math.sin(angle * (Math.PI / 180)) * 390;
      return (
        <circle key={`outer-dot-${i}`} cx={x} cy={y} r="4" fill={primaryColor} opacity="0.15" />
      );
    })}

    {/* Diamond shapes */}
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * 360 + 11.25;
      const x = 400 + Math.cos(angle * (Math.PI / 180)) * 320;
      const y = 400 + Math.sin(angle * (Math.PI / 180)) * 320;
      const size = 12;
      return (
        <polygon
          key={`diamond-${i}`}
          points={`${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`}
          fill={primaryColor}
          opacity="0.1"
        />
      );
    })}
  </svg>
);

// Subtle animated gradient overlay with primary color
const AnimatedGradientOverlay = ({ primaryColor = "#0f2444" }) => (
  <div className="absolute inset-0 opacity-30 pointer-events-none">
    <div
      className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl animate-pulse"
      style={{
        backgroundColor: `${primaryColor}40`,
        animationDuration: "8s",
      }}
    />
    <div
      className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl animate-pulse"
      style={{
        backgroundColor: `${primaryColor}30`,
        animationDuration: "6s",
        animationDelay: "2s",
      }}
    />
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse"
      style={{
        backgroundColor: `${primaryColor}20`,
        animationDuration: "10s",
        animationDelay: "4s",
      }}
    />
  </div>
);

export default function Sidebar({
  isMobileOpen,
  onClose,
  onCollapseChange,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { getBadgeCount, refreshBadges } = useBadges();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Primary color
  const primaryColor = "#0f2444";

  // Get user role with proper typing
  const userRole = (user?.role || "employee") as UserRole;

  // Get personal items (Dashboard only)
  const personalItems = Object.values(PERSONAL_ITEMS).filter((item) =>
    hasAccess(userRole, item.roles),
  );

  // Get main menu items, EXCLUDING the Dashboard (since it's in personal items)
  const mainItems = Object.values(MAIN_ITEMS).filter(
    (item) => hasAccess(userRole, item.roles) && item.id !== "dashboard",
  );

  // Group main items by section
  const groupedMainItems = mainItems.reduce(
    (acc, item) => {
      const section = item.section || "main";
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(item);
      return acc;
    },
    {} as Record<SectionId, NavItem[]>,
  );

  // Get all main items for submenu checking
  const allMainItems = Object.values(MAIN_ITEMS);

  // Refresh badges when user logs in or changes
  useEffect(() => {
    if (user) {
      const initBadges = async () => {
        try {
          await refreshBadges();
        } catch (error) {
          // Silently fail - badges will show 0
        }
      };
      initBadges();
    }
  }, [user, refreshBadges]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    const initialState = savedState === "true";
    setIsCollapsed(initialState);
    onCollapseChange?.(initialState);

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

    if (leftPos + dropdownWidth > window.innerWidth) {
      leftPos = rect.left - dropdownWidth - 12;
    }

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

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isParentActive = (parentName: string) => {
    const subItems = getSubMenuItems(parentName, userRole);
    return subItems.some((subItem) => isActive(subItem.href));
  };

  /**
   * Check if a URL is external
   */
  const isExternalLink = (href: string): boolean => {
    return href.startsWith("http://") || href.startsWith("https://");
  };

  /**
   * Get badge display for an item
   * Supports both static and dynamic badges
   */
  const getBadgeDisplay = (
    item: NavItem | SubNavItem,
  ): { text: string; isDynamic: boolean } => {
    if (item.badge) {
      return { text: item.badge, isDynamic: false };
    }

    if (item.badgeKey) {
      const count = getBadgeCount(item.badgeKey as BadgeKey);
      if (count > 0) {
        return { text: count > 99 ? "99+" : count.toString(), isDynamic: true };
      }
      return { text: "", isDynamic: true };
    }

    return { text: "", isDynamic: false };
  };

  /**
   * Check if item should show a badge
   */
  const shouldShowBadge = (item: NavItem | SubNavItem): boolean => {
    if (item.badge) return true;
    if (item.badgeKey) {
      const count = getBadgeCount(item.badgeKey as BadgeKey);
      return count > 0;
    }
    return false;
  };

  // Section order for consistent display
  const sectionOrder: SectionId[] = [
    "main",
    "kpi",
    "projects",
    "tasks",
    "team",
    "hr",
    "reports",
    "system",
    "support",
  ];

  const renderDropdownMenu = (parentName: string, items: SubNavItem[]) => {
    if (hoveredItem !== parentName) return null;

    const parentItem = allMainItems.find((item) => item.name === parentName);
    const isParentActiveFlag = isParentActive(parentName);

    return (
      <div
        ref={dropdownRef}
        className="fixed z-50 min-w-70 overflow-hidden bg-[#122645] rounded-xl shadow-2xl border border-white/10"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          maxHeight: "400px",
        }}
        onMouseEnter={handleDropdownMouseEnter}
        onMouseLeave={handleDropdownMouseLeave}
      >
        <div className="relative px-4 py-3 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shadow-md">
              {parentItem?.icon && (
                <parentItem.icon size={14} className="text-white" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-white">
                {parentName}
              </span>
              {isParentActiveFlag && (
                <div className="text-[9px] text-indigo-300 font-medium">
                  Active
                </div>
              )}
            </div>
            {isParentActiveFlag && (
              <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-300" />
            )}
          </div>
        </div>

        <div className="py-2 max-h-85 overflow-y-auto custom-scrollbar">
          {items.map((subItem) => {
            const isSubActive = isActive(subItem.href);
            const SubIcon = subItem.icon;
            const badgeInfo = getBadgeDisplay(subItem);
            const showBadge = shouldShowBadge(subItem);
            const isExternal = isExternalLink(subItem.href);

            // For external links, use <a> tag
            if (isExternal) {
              return (
                <a
                  key={subItem.id}
                  href={subItem.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setHoveredItem(null);
                    onClose?.();
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 mx-1 rounded-lg transition-all duration-200 group ${isSubActive
                      ? "bg-linear-to-r from-indigo-500/20 to-purple-500/20 text-white"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${isSubActive
                        ? "bg-indigo-500/30"
                        : "bg-white/10 group-hover:bg-white/20"
                      }`}
                  >
                    <SubIcon
                      size={14}
                      className={
                        isSubActive
                          ? "text-indigo-300"
                          : "text-gray-400 group-hover:text-white"
                      }
                    />
                  </div>
                  <span className="text-sm font-medium flex-1">
                    {subItem.name}
                  </span>
                  <ExternalLink size={12} className="text-gray-400" />
                  {showBadge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all duration-300 ${badgeInfo.isDynamic
                          ? "bg-red-500/30 text-red-300 animate-pulse"
                          : subItem.badgeColor ||
                          "bg-indigo-500/30 text-indigo-300"
                        }`}
                    >
                      {badgeInfo.text}
                    </span>
                  )}
                  {isSubActive && (
                    <div className="w-1 h-6 rounded-full bg-linear-to-b from-indigo-400 to-purple-400" />
                  )}
                </a>
              );
            }

            // Internal links with Next.js Link
            return (
              <Link
                key={subItem.id}
                href={subItem.href}
                onClick={() => {
                  setHoveredItem(null);
                  onClose?.();
                }}
                className={`flex items-center gap-3 px-4 py-2.5 mx-1 rounded-lg transition-all duration-200 group ${isSubActive
                    ? "bg-linear-to-r from-indigo-500/20 to-purple-500/20 text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${isSubActive
                      ? "bg-indigo-500/30"
                      : "bg-white/10 group-hover:bg-white/20"
                    }`}
                >
                  <SubIcon
                    size={14}
                    className={
                      isSubActive
                        ? "text-indigo-300"
                        : "text-gray-400 group-hover:text-white"
                    }
                  />
                </div>
                <span className="text-sm font-medium flex-1">
                  {subItem.name}
                </span>
                {showBadge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all duration-300 ${badgeInfo.isDynamic
                        ? "bg-red-500/30 text-red-300 animate-pulse"
                        : subItem.badgeColor ||
                        "bg-indigo-500/30 text-indigo-300"
                      }`}
                  >
                    {badgeInfo.text}
                  </span>
                )}
                {isSubActive && (
                  <div className="w-1 h-6 rounded-full bg-linear-to-b from-indigo-400 to-purple-400" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="px-4 py-2 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>{items.length} menu items</span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-gray-400" />
              Click to navigate
            </span>
          </div>
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <aside
      className={`relative bg-[#0f2444] min-h-screen flex flex-col shadow-2xl transition-all duration-300 overflow-visible ${isCollapsed ? "w-20" : "w-80"
        } sidebar-layout`}
      style={{
        borderRight: "1px solid rgba(255, 255, 255, 0.05)",
        height: "100vh",
        maxHeight: "100vh",
      }}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 pointer-events-none main-sidebar">
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-[#0f2444]/80 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-linear-to-br from-[#0f2444]/60 via-[#0f2444]/40 to-transparent" />
      </div>

      {/* Mandala Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <MandalaPattern primaryColor={primaryColor} />
        <AnimatedGradientOverlay primaryColor={primaryColor} />

        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />
      </div>

      {/* Animated gradient border */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-indigo-400 to-purple-400 via-50% to-transparent animate-shimmer z-10" />

      {/* Content - Flex column with proper height management */}
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {/* Header with Toggle Button - Fixed height */}
        <div
          className={`shrink-0 px-4 py-[12px] bg-transparent transition-all duration-300 sticky top-0 z-10 ${scrolled
              ? "bg-[#0f2444]/90 backdrop-blur-md"
              : "bg-[#0f2444]/60 backdrop-blur-sm"
            }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center gap-3 ${isCollapsed ? "justify-center w-full" : ""
                }`}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-linear-to-r from-indigo-400 to-purple-400 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
                <div className="relative w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-md">
                  <CheckSquare className="w-5 h-5 text-white group-hover:text-indigo-300" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    Task Flow
                  </h1>
                  <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">
                    Enterprise Suite
                  </p>
                </div>
              )}
            </div>
            {!isCollapsed && onClose && (
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex fixed top-1/12 -translate-y-1/2 z-[999] w-7 h-7 bg-[#0f2444] 
          hover:bg-linear-to-r hover:from-indigo-500 hover:to-purple-500 border-2 border-white/20 
          hover:border-transparent rounded-full items-center justify-center transition-all duration-300 shadow-xl group"
        >
          {isCollapsed ? (
            <ChevronRight
              size={12}
              className="text-white/60 group-hover:text-white transition-colors"
            />
          ) : (
            <ChevronLeft
              size={12}
              className="text-white/60 group-hover:text-white transition-colors"
            />
          )}
        </button>

        {/* Navigation - Scrollable area with flex-1 */}
        <nav
          className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar main-sidebar"
          style={{
            maxHeight: "calc(100vh - 160px)",
            minHeight: 0,
          }}
        >
          {/* Personal Items - Dashboard only */}
          {personalItems.length > 0 && (
            <div className="space-y-1">
              {personalItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const badgeInfo = getBadgeDisplay(item);
                const showBadge = shouldShowBadge(item);
                const isExternal = isExternalLink(item.href);

                // For external links in personal items
                if (isExternal) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isCollapsed ? "justify-center" : ""
                        } ${active
                          ? "bg-linear-to-r from-indigo-500/20 to-purple-500/20 text-white backdrop-blur-sm border border-white/10"
                          : "text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                        }`}
                      title={isCollapsed ? item.name : ""}
                    >
                      <div className="relative">
                        <Icon
                          size={18}
                          className={`transition-all duration-200 ${active
                              ? "text-indigo-300"
                              : "text-gray-400 group-hover:text-white"
                            }`}
                        />
                        {isCollapsed && showBadge && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/30" />
                        )}
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className="text-sm font-medium flex-1">
                            {item.name}
                          </span>
                          <ExternalLink size={14} className="text-gray-400" />
                          {showBadge && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all duration-300 ${badgeInfo.isDynamic
                                  ? "bg-red-500/30 text-red-300 animate-pulse"
                                  : item.badgeColor ||
                                  "bg-indigo-500/30 text-indigo-300"
                                }`}
                            >
                              {badgeInfo.text}
                            </span>
                          )}
                        </>
                      )}
                      {active && !isCollapsed && (
                        <div className="w-1 h-6 rounded-full bg-linear-to-b from-indigo-400 to-purple-400 absolute right-0" />
                      )}
                    </a>
                  );
                }

                // Internal links with Next.js Link
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isCollapsed ? "justify-center" : ""
                      } ${active
                        ? "bg-linear-to-r from-indigo-500/20 to-purple-500/20 text-white backdrop-blur-sm border border-white/10"
                        : "text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                      }`}
                    title={isCollapsed ? item.name : ""}
                  >
                    <div className="relative">
                      <Icon
                        size={18}
                        className={`transition-all duration-200 ${active
                            ? "text-indigo-300"
                            : "text-gray-400 group-hover:text-white"
                          }`}
                      />
                      {isCollapsed && showBadge && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/30" />
                      )}
                    </div>
                    {!isCollapsed && (
                      <>
                        <span className="text-sm font-medium flex-1">
                          {item.name}
                        </span>
                        {showBadge && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all duration-300 ${badgeInfo.isDynamic
                                ? "bg-red-500/30 text-red-300 animate-pulse"
                                : item.badgeColor ||
                                "bg-indigo-500/30 text-indigo-300"
                              }`}
                          >
                            {badgeInfo.text}
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

          {/* Main Menu Items - Grouped by Section */}
          {sectionOrder.map((sectionId) => {
            const items = groupedMainItems[sectionId];
            if (!items || items.length === 0) return null;

            const sectionConfig = getSectionConfig(sectionId);
            const SectionIcon = sectionConfig?.icon;

            return (
              <div key={sectionId} className="space-y-1">
                {/* Section Title */}
                {!isCollapsed && SectionIcon && (
                  <div className="flex items-center gap-2 px-3 py-2 mt-2">
                    <SectionIcon className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                      {sectionConfig?.title || sectionId.toUpperCase()}
                    </span>
                  </div>
                )}
                {items.map((item) => {
                  const Icon = item.icon;
                  const subItems = getSubMenuItems(item.name, userRole);
                  const hasSubmenu = subItems.length > 0;
                  const isParentActiveFlag = isParentActive(item.name);
                  const isHovered = hoveredItem === item.name;
                  const badgeInfo = getBadgeDisplay(item);
                  const showBadge = shouldShowBadge(item);
                  const isExternal = isExternalLink(item.href);

                  // If item has submenu, render with dropdown
                  if (hasSubmenu) {
                    return (
                      <div
                        key={item.id}
                        onMouseEnter={(e) => {
                          handleMouseEnter(item.name, e);
                        }}
                        onMouseLeave={() => {
                          handleMouseLeave();
                        }}
                      >
                        <div
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative cursor-pointer ${isCollapsed ? "justify-center" : ""
                            } ${isParentActiveFlag || (isHovered && hasSubmenu)
                              ? "bg-linear-to-r from-indigo-500/20 to-purple-500/20 text-white backdrop-blur-sm"
                              : "text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                            }`}
                          title={isCollapsed ? item.name : ""}
                        >
                          <div className="relative">
                            <Icon
                              size={18}
                              className={`transition-all duration-200 ${isParentActiveFlag || (isHovered && hasSubmenu)
                                  ? "text-indigo-300"
                                  : "text-gray-400 group-hover:text-white"
                                }`}
                            />
                            {isCollapsed && showBadge && !hasSubmenu && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/30" />
                            )}
                          </div>
                          {!isCollapsed && (
                            <>
                              <span className="text-sm font-medium flex-1 text-left">
                                {item.name}
                              </span>
                              <ChevronRightIcon
                                size={14}
                                className={`transition-all duration-300 ${isHovered
                                    ? "translate-x-1 text-indigo-300"
                                    : "text-gray-400 group-hover:text-white"
                                  }`}
                              />
                              {showBadge && !hasSubmenu && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all duration-300 ${badgeInfo.isDynamic
                                      ? "bg-red-500/30 text-red-300 animate-pulse"
                                      : item.badgeColor ||
                                      "bg-indigo-500/30 text-indigo-300"
                                    }`}
                                >
                                  {badgeInfo.text}
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
                  }

                  // For items without submenu
                  // External links
                  if (isExternal) {
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative cursor-pointer ${isCollapsed ? "justify-center" : ""
                          } ${isActive(item.href)
                            ? "bg-linear-to-r from-indigo-500/20 to-purple-500/20 text-white backdrop-blur-sm"
                            : "text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                          }`}
                        title={isCollapsed ? item.name : ""}
                      >
                        <div className="relative">
                          <Icon
                            size={18}
                            className={`transition-all duration-200 ${isActive(item.href)
                                ? "text-indigo-300"
                                : "text-gray-400 group-hover:text-white"
                              }`}
                          />
                          {isCollapsed && showBadge && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/30" />
                          )}
                        </div>
                        {!isCollapsed && (
                          <>
                            <span className="text-sm font-medium flex-1 text-left">
                              {item.name}
                            </span>
                            <ExternalLink size={14} className="text-gray-400" />
                            {showBadge && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all duration-300 ${badgeInfo.isDynamic
                                    ? "bg-red-500/30 text-red-300 animate-pulse"
                                    : item.badgeColor ||
                                    "bg-indigo-500/30 text-indigo-300"
                                  }`}
                              >
                                {badgeInfo.text}
                              </span>
                            )}
                          </>
                        )}
                        {isActive(item.href) && !isCollapsed && (
                          <div className="w-1 h-6 rounded-full bg-linear-to-b from-indigo-400 to-purple-400 absolute right-0" />
                        )}
                      </a>
                    );
                  }

                  // Internal links
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={onClose}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative cursor-pointer ${isCollapsed ? "justify-center" : ""
                        } ${isActive(item.href)
                          ? "bg-linear-to-r from-indigo-500/20 to-purple-500/20 text-white backdrop-blur-sm"
                          : "text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                        }`}
                      title={isCollapsed ? item.name : ""}
                    >
                      <div className="relative">
                        <Icon
                          size={18}
                          className={`transition-all duration-200 ${isActive(item.href)
                              ? "text-indigo-300"
                              : "text-gray-400 group-hover:text-white"
                            }`}
                        />
                        {isCollapsed && showBadge && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/30" />
                        )}
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className="text-sm font-medium flex-1 text-left">
                            {item.name}
                          </span>
                          {showBadge && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all duration-300 ${badgeInfo.isDynamic
                                  ? "bg-red-500/30 text-red-300 animate-pulse"
                                  : item.badgeColor ||
                                  "bg-indigo-500/30 text-indigo-300"
                                }`}
                            >
                              {badgeInfo.text}
                            </span>
                          )}
                        </>
                      )}
                      {isActive(item.href) && !isCollapsed && (
                        <div className="w-1 h-6 rounded-full bg-linear-to-b from-indigo-400 to-purple-400 absolute right-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer - Fixed at bottom */}
        <div className="shrink-0 p-4 border-t border-white/10 bg-linear-to-t from-[#0f2444]/90 via-[#0f2444]/60 to-transparent backdrop-blur-sm">
          <button
            onClick={logout}
            className={`group cursor-pointer relative w-full overflow-hidden rounded-xl transition-all duration-300 ${isCollapsed ? "px-2 py-2.5" : "px-4 py-2.5"
              }`}
            title={isCollapsed ? "Logout" : ""}
          >
            <div className="absolute inset-0 bg-linear-to-r from-red-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-linear-to-r from-red-500/5 to-rose-500/5 rounded-xl" />
            <div className="absolute inset-0 rounded-xl border border-red-500/20 group-hover:border-red-400/40 transition-all duration-300" />

            <div
              className={`relative flex items-center gap-3 transition-all duration-300 ${isCollapsed ? "justify-center" : "justify-center"
                }`}
            >
              <div
                className={`relative transition-all duration-300 ${isCollapsed ? "" : "group-hover:scale-110"
                  }`}
              >
                <LogOut
                  size={18}
                  className="text-red-400/60 group-hover:text-red-400 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-full bg-red-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </div>

              {!isCollapsed && (
                <span className="text-sm font-medium text-red-400/80 group-hover:text-red-400 transition-all duration-300">
                  Sign Out
                </span>
              )}

              {!isCollapsed && (
                <ArrowRight
                  size={14}
                  className="text-red-400/40 group-hover:text-red-400 group-hover:translate-x-1 transition-all duration-300 opacity-0 group-hover:opacity-100"
                />
              )}
            </div>
          </button>

          {!isCollapsed && (
            <div className="mt-4 text-center">
              <p className="text-[9px] text-white/30 font-medium tracking-wider">
                Version 2.0.0
              </p>
              <p className="text-[9px] text-white/20 font-medium mt-0.5">
                © 2026 TaskFlow Enterprise Suite
              </p>
            </div>
          )}
        </div>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={onClose}
          />
          <div className="fixed left-0 top-0 h-full z-40 lg:hidden animate-slide-in-right">
            {sidebarContent}
          </div>
        </>
      )}

      <style jsx global>{`
        .main-sidebar {
          background-image: url(/images/sidebar-bg-1.png);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

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
          background: rgba(255, 255, 255, 0.05);
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