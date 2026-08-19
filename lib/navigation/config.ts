// @/lib/navigation/config.ts - Add this helper function

import { NavItem } from "../menuItems";

/**
 * Get the employee KPI URL with the user's ID
 */
export const getEmployeeKPIUrl = (userId: string): string => {
    return `/kpi/employee/${userId}`;
};

/**
 * Check if a navigation item requires dynamic routing
 */
export const isDynamicNavItem = (item: NavItem): boolean => {
    return item.id === "my-kpi";
};

/**
 * Get the actual href for a navigation item
 */
export const getNavItemHref = (item: NavItem, userId?: string): string => {
    if (item.id === "my-kpi" && userId) {
        return getEmployeeKPIUrl(userId);
    }
    return item.href;
};