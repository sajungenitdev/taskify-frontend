"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useBadges } from "@/hooks/useBadges";
import {
  ChevronLeft,
  ChevronDown,
  LogOut,
  CheckSquare,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  PERSONAL_ITEMS,
  MAIN_ITEMS,
  getSubMenuItems,
  hasAccess,
  getSectionConfig,
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

export default function Sidebar({
  isMobileOpen,
  onClose,
  onCollapseChange,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { getBadgeCount, refreshBadges } = useBadges();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const userRole = (user?.role || "employee") as UserRole;

  const personalItems = Object.values(PERSONAL_ITEMS).filter((item) =>
    hasAccess(userRole, item.roles),
  );
  const mainItems = Object.values(MAIN_ITEMS).filter(
    (item) => hasAccess(userRole, item.roles) && item.id !== "dashboard",
  );
  const groupedMainItems = mainItems.reduce(
    (acc, item) => {
      const section = item.section || "main";
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    },
    {} as Record<SectionId, NavItem[]>,
  );

  /* ---------- Refresh badges ---------- */
  useEffect(() => {
    if (user) {
      refreshBadges().catch(() => { });
    }
  }, [user, refreshBadges]);

  /* ---------- Initial mount load ---------- */
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      const initialState = savedState === "true";
      setIsCollapsed(initialState);
      onCollapseChange?.(initialState);
    }
  }, [onCollapseChange]);

  /* ---------- Collapse toggle (outside reducer) ---------- */
  const toggleCollapse = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
    onCollapseChange?.(newState);

    window.dispatchEvent(
      new CustomEvent("sidebarToggle", { detail: { collapsed: newState } })
    );

    if (newState) {
      setExpandedItems(new Set());
    }
  }, [isCollapsed, onCollapseChange]);

  /* ---------- Auto-expand active routes ---------- */
  useEffect(() => {
    if (isCollapsed) return;
    const next = new Set(expandedItems);
    mainItems.forEach((item) => {
      const subs = getSubMenuItems(item.name, userRole);
      if (
        subs.some(
          (s) => pathname === s.href || pathname.startsWith(`${s.href}/`),
        )
      ) {
        next.add(item.name);
      }
    });
    setExpandedItems(next);
  }, [pathname, isCollapsed]);

  const toggleAccordion = (name: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      onCollapseChange?.(false);
      setExpandedItems(new Set([name]));
      return;
    }
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    if (pathname === href) return true;
    const indexRoutes = ["/tenders", "/crm", "/projects", "/tasks", "/hr"];
    if (indexRoutes.includes(href)) return false;
    return pathname.startsWith(`${href}/`);
  };

  const isParentActive = (parentName: string) => {
    const subItems = getSubMenuItems(parentName, userRole);
    return subItems.some((subItem) => isActive(subItem.href));
  };

  const isExternalLink = (href: string) =>
    href.startsWith("http://") || href.startsWith("https://");

  const getBadgeDisplay = (item: NavItem | SubNavItem) => {
    if (item.badge) return { text: item.badge, isDynamic: false };
    if (item.badgeKey) {
      const count = getBadgeCount(item.badgeKey as BadgeKey);
      if (count > 0) {
        return { text: count > 99 ? "99+" : count.toString(), isDynamic: true };
      }
    }
    return { text: "", isDynamic: false };
  };

  const shouldShowBadge = (item: NavItem | SubNavItem) => {
    if (item.badge) return true;
    if (item.badgeKey) return getBadgeCount(item.badgeKey as BadgeKey) > 0;
    return false;
  };

  const sectionOrder: SectionId[] = [
    "main",
    "kpi",
    "crm",
    "tender",
    "projects",
    "tasks",
    "team",
    "hr",
    "reports",
    "system",
    "support",
  ];

  /* ============================================================
   * Sidebar Visual Content
   * ============================================================ */
  const sidebarContent = (
    <aside
      className={`
        relative bg-[#0b1b2d] h-screen flex flex-col select-none
        border-r border-white/10 shadow-2xl transition-[width] duration-300
        ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width]
        ${isCollapsed ? "w-[72px]" : "w-64"}
      `}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-20 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-20 w-60 h-60 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-black/20" />
      </div>

      {/* ======================== Header ======================== */}
      <div className="relative shrink-0 h-16 flex items-center px-3 border-b border-white/[0.07] z-20">
        {isCollapsed ? (
          /* Collapsed Header: Centers the toggle chevron cleanly */
          <div className="w-full flex items-center justify-center">
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Expand sidebar"
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 hover:text-white border border-white/10 transition-colors shadow-sm"
            >
              <ChevronLeft size={16} className="rotate-180" />
            </button>
          </div>
        ) : (
          /* Expanded Header: Logo, titles, and collapse arrow */
          <div className="w-full flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-px shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-[#0b1b2d]/60 backdrop-blur-md rounded-[11px] flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-indigo-200" />
                </div>
              </div>
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <h1 className="text-sm font-semibold tracking-wide text-white truncate">
                  Task Flow
                </h1>
                <span className="text-[10px] font-medium tracking-wider text-indigo-300/60 uppercase truncate">
                  Enterprise Suite
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Collapse sidebar"
              className="shrink-0 w-7 h-7 cursor-pointer rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.09] text-gray-400 hover:text-white border border-white/10 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ======================== Navigation ======================== */}
      <nav
        ref={navRef}
        className={`flex-1 overflow-y-auto py-3 space-y-1 custom-scrollbar z-10 ${isCollapsed ? "px-2" : "px-3"
          }`}
      >
        {/* Personal Items */}
        {personalItems.length > 0 && (
          <div className="space-y-1">
            {personalItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              const badgeInfo = getBadgeDisplay(item);
              const showBadge = shouldShowBadge(item);
              const isExternal = isExternalLink(item.href);

              const navLink = (
                <div
                  onMouseEnter={() => isCollapsed && setHoveredTooltip(item.name)}
                  onMouseLeave={() => isCollapsed && setHoveredTooltip(null)}
                  className={`
                    group relative flex items-center h-10 rounded-xl transition-all duration-200 font-medium text-sm
                    ${isCollapsed ? "justify-center px-0 w-full" : "px-2.5"}
                    ${active
                      ? "bg-indigo-600/20 text-indigo-200 ring-1 ring-indigo-500/40 shadow-sm"
                      : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                    }
                  `}
                >
                  <div className="shrink-0 flex items-center justify-center w-6 h-6">
                    <Icon
                      size={18}
                      className={`transition-colors duration-200 ${active ? "text-indigo-400" : "text-gray-400 group-hover:text-white"
                        }`}
                    />
                  </div>

                  {/* Dot badge on collapsed mode */}
                  {isCollapsed && showBadge && (
                    <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0b1b2d]" />
                  )}

                  {/* Expanded text content */}
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between ml-3 min-w-0 pr-1">
                      <span className="truncate">{item.name}</span>
                      <div className="flex items-center gap-1.5 ml-auto pl-2">
                        {isExternal && (
                          <ExternalLink size={12} className="text-gray-500 shrink-0" />
                        )}
                        {showBadge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${badgeInfo.isDynamic
                                ? "bg-rose-500/20 text-rose-300"
                                : item.badgeColor || "bg-indigo-500/20 text-indigo-300"
                              }`}
                          >
                            {badgeInfo.text}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tooltip on collapsed rail */}
                  {isCollapsed && hoveredTooltip === item.name && (
                    <div className="fixed left-[78px] z-50 px-2.5 py-1.5 bg-[#152538] text-white text-xs font-medium rounded-lg shadow-xl border border-white/10 whitespace-nowrap">
                      {item.name}
                    </div>
                  )}
                </div>
              );

              return isExternal ? (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="block"
                >
                  {navLink}
                </a>
              ) : (
                <Link key={item.id} href={item.href} onClick={onClose} className="block">
                  {navLink}
                </Link>
              );
            })}
          </div>
        )}

        {/* Section Groups */}
        {sectionOrder.map((sectionId) => {
          const items = groupedMainItems[sectionId];
          if (!items || items.length === 0) return null;

          const sectionConfig = getSectionConfig(sectionId);
          const SectionIcon = sectionConfig?.icon;

          return (
            <div key={sectionId} className="pt-2">
              {!isCollapsed && SectionIcon && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 mb-0.5">
                  <SectionIcon className="w-3 h-3 text-indigo-300/40 shrink-0" />
                  <span className="text-[10px] font-semibold text-gray-400/60 uppercase tracking-widest truncate">
                    {sectionConfig?.title || sectionId}
                  </span>
                </div>
              )}

              {isCollapsed && (
                <div className="my-2 mx-auto w-7 h-px bg-white/[0.08]" />
              )}

              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const subItems = getSubMenuItems(item.name, userRole);
                  const hasSubmenu = subItems.length > 0;
                  const isParent = isParentActive(item.name);
                  const isExpanded = expandedItems.has(item.name);
                  const badgeInfo = getBadgeDisplay(item);
                  const showBadge = shouldShowBadge(item);
                  const isExternal = isExternalLink(item.href);

                  if (hasSubmenu) {
                    return (
                      <div key={item.id} className="relative">
                        <button
                          type="button"
                          onClick={() => toggleAccordion(item.name)}
                          onMouseEnter={() =>
                            isCollapsed && setHoveredTooltip(item.name)
                          }
                          onMouseLeave={() =>
                            isCollapsed && setHoveredTooltip(null)
                          }
                          className={`
                            group w-full relative cursor-pointer flex items-center h-10 rounded-xl transition-all duration-200 font-medium text-sm
                            ${isCollapsed ? "justify-center px-0" : "px-2.5"}
                            ${isParent || isExpanded
                              ? "bg-white/[0.08] text-white"
                              : "text-gray-300 hover:text-white hover:bg-white/[0.05]"
                            }
                          `}
                        >
                          <div className="shrink-0 flex items-center justify-center w-6 h-6">
                            <Icon
                              size={18}
                              className={`transition-colors duration-200 ${isParent || isExpanded
                                  ? "text-indigo-400"
                                  : "text-gray-400 group-hover:text-white"
                                }`}
                            />
                          </div>

                          {!isCollapsed && (
                            <div className="flex-1 flex items-center justify-between ml-3 min-w-0 pr-1">
                              <span className="truncate">{item.name}</span>
                              <div className="flex items-center gap-1.5 ml-auto">
                                {showBadge && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300">
                                    {badgeInfo.text}
                                  </span>
                                )}
                                <ChevronDown
                                  size={14}
                                  className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180 text-white" : ""
                                    }`}
                                />
                              </div>
                            </div>
                          )}

                          {isCollapsed && hoveredTooltip === item.name && (
                            <div className="fixed left-[78px] z-50 px-2.5 py-1.5 bg-[#152538] text-white text-xs font-medium rounded-lg shadow-xl border border-white/10 whitespace-nowrap">
                              {item.name}
                            </div>
                          )}
                        </button>

                        {/* Accordion Sub-list */}
                        {!isCollapsed && (
                          <div
                            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isExpanded
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                              }`}
                          >
                            <ul className="overflow-hidden ml-5 pl-3 border-l border-white/10 space-y-0.5 my-1">
                              {subItems.map((sub) => {
                                const subActive = isActive(sub.href);
                                const SubIcon = sub.icon;
                                const subBadge = getBadgeDisplay(sub);
                                const showSubBadge = shouldShowBadge(sub);

                                return (
                                  <li key={sub.id}>
                                    <Link
                                      href={sub.href}
                                      onClick={onClose}
                                      className={`
                                        flex items-center gap-2.5 h-8 px-2 rounded-lg text-xs font-medium transition-colors duration-150
                                        ${subActive
                                          ? "bg-indigo-500/20 text-indigo-200 font-semibold"
                                          : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                                        }
                                      `}
                                    >
                                      <SubIcon size={14} className="shrink-0 opacity-70" />
                                      <span className="truncate flex-1">{sub.name}</span>
                                      {showSubBadge && (
                                        <span className="text-[9px] px-1 py-0.2 rounded-full bg-indigo-500/30 text-indigo-200">
                                          {subBadge.text}
                                        </span>
                                      )}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  }

                  /* Plain nav link */
                  const isItemActive = isActive(item.href);
                  const singleLink = (
                    <div
                      onMouseEnter={() =>
                        isCollapsed && setHoveredTooltip(item.name)
                      }
                      onMouseLeave={() =>
                        isCollapsed && setHoveredTooltip(null)
                      }
                      className={`
                        group relative flex items-center h-10 rounded-xl transition-all duration-200 font-medium text-sm
                        ${isCollapsed ? "justify-center px-0 w-full" : "px-2.5"}
                        ${isItemActive
                          ? "bg-indigo-600/20 text-indigo-200 ring-1 ring-indigo-500/40 shadow-sm"
                          : "text-gray-300 hover:text-white hover:bg-white/[0.05]"
                        }
                      `}
                    >
                      <div className="shrink-0 flex items-center justify-center w-6 h-6">
                        <Icon
                          size={18}
                          className={`transition-colors duration-200 ${isItemActive
                              ? "text-indigo-400"
                              : "text-gray-400 group-hover:text-white"
                            }`}
                        />
                      </div>

                      {isCollapsed && showBadge && (
                        <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0b1b2d]" />
                      )}

                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between ml-3 min-w-0 pr-1">
                          <span className="truncate">{item.name}</span>
                          <div className="flex items-center gap-1.5 ml-auto">
                            {isExternal && (
                              <ExternalLink size={12} className="text-gray-500 shrink-0" />
                            )}
                            {showBadge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300">
                                {badgeInfo.text}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {isCollapsed && hoveredTooltip === item.name && (
                        <div className="fixed left-[78px] z-50 px-2.5 py-1.5 bg-[#152538] text-white text-xs font-medium rounded-lg shadow-xl border border-white/10 whitespace-nowrap">
                          {item.name}
                        </div>
                      )}
                    </div>
                  );

                  return isExternal ? (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose}
                      className="block"
                    >
                      {singleLink}
                    </a>
                  ) : (
                    <Link key={item.id} href={item.href} onClick={onClose} className="block">
                      {singleLink}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ======================== Footer ======================== */}
      <div className="relative shrink-0 p-2.5 border-t border-white/[0.08] bg-[#091524]/70 backdrop-blur-md z-20">
        <button
          type="button"
          onClick={logout}
          onMouseEnter={() => isCollapsed && setHoveredTooltip("Sign Out")}
          onMouseLeave={() => isCollapsed && setHoveredTooltip(null)}
          className={`
            group relative w-full flex cursor-pointer items-center h-10 rounded-xl text-gray-300 hover:text-rose-300 hover:bg-rose-500/10 transition-colors duration-200
            ${isCollapsed ? "justify-center px-0" : "px-2.5"}
          `}
        >
          <div className="shrink-0 flex items-center justify-center w-6 h-6">
            <LogOut size={16} className="text-gray-400 group-hover:text-rose-400 transition-colors" />
          </div>

          {!isCollapsed && (
            <div className="flex-1 flex items-center justify-between ml-3 min-w-0 pr-1">
              <span className="text-sm font-medium">Sign Out</span>
              <ArrowRight
                size={14}
                className="text-gray-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all"
              />
            </div>
          )}

          {isCollapsed && hoveredTooltip === "Sign Out" && (
            <div className="fixed left-[78px] cursor-pointer z-50 px-2.5 py-1.5 bg-[#152538] text-rose-300 text-xs font-medium rounded-lg shadow-xl border border-white/10 whitespace-nowrap">
              Sign Out
            </div>
          )}
        </button>

        {!isCollapsed && (
          <div className="mt-2 text-center">
            <p className="text-[10px] text-white/30 font-medium tracking-wide">
              v2.0.0 • © 2026 TaskFlow
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={onClose}
          />
          <div className="fixed left-0 top-0 h-full z-40 lg:hidden shadow-2xl">
            {sidebarContent}
          </div>
        </>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </>
  );
}