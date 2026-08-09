// components/ui/MenuItemWithBadge.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DynamicBadge } from "./DynamicBadge";
import { useBadges } from "@/hooks/useBadges";
import { NavItem, SubNavItem } from "@/lib/menuItems";

interface MenuItemWithBadgeProps {
  item: NavItem | SubNavItem;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

/**
 * Menu Item Component with Dynamic Badge Support
 * Automatically displays badge counts from the badge service
 */
export function MenuItemWithBadge({
  item,
  isActive = false,
  isCollapsed = false,
  onClick,
}: MenuItemWithBadgeProps) {
  const pathname = usePathname();
  const { getBadgeCount } = useBadges();

  // Get dynamic badge count if badgeKey is provided
  const badgeCount = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;

  // Determine if item has a badge (static or dynamic)
  const hasBadge =
    item.badge !== undefined || (item.badgeKey !== undefined && badgeCount > 0);

  // Get badge display text
  const getBadgeText = () => {
    if (item.badge) return item.badge; // Static badge
    if (item.badgeKey) {
      return badgeCount > 99 ? "99+" : badgeCount.toString();
    }
    return "";
  };

  // Get badge color
  const getBadgeColor = () => {
    if (item.badgeColor) return item.badgeColor;
    if ("isNew" in item && item.isNew)
      return "bg-linear-to-r from-indigo-500 to-purple-500";
    return "bg-red-500"; // Default color
  };

  // Check if item is active
  const isItemActive =
    isActive ||
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-200 relative
        ${
          isItemActive
            ? "bg-indigo-50 text-indigo-700 shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }
        ${isCollapsed ? "justify-center" : ""}
      `}
    >
      {/* Icon */}
      <item.icon
        className={`
          w-5 h-5 shrink-0
          ${isItemActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}
          transition-colors duration-200
        `}
      />

      {/* Label */}
      {!isCollapsed && (
        <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
      )}

      {/* Badge */}
      {hasBadge && !isCollapsed && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <DynamicBadge
            count={badgeCount}
            className={getBadgeColor()}
            size="sm"
          />
        </motion.div>
      )}

      {/* Collapsed badge indicator */}
      {hasBadge && isCollapsed && (
        <div
          className={`
          absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full
          ${getBadgeColor()}
          animate-pulse
        `}
        />
      )}
    </Link>
  );
}
