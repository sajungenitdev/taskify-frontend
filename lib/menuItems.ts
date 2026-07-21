import {
  // Navigation & Layout
  LayoutDashboard,
  User,
  Users,
  UserCog,
  UserPlus,
  UserX,
  UserMinus,
  UserCheck,
  Users2,
  UsersRound,
  CheckSquare,
  Briefcase,
  Kanban,
  GanttChart,
  ListTodo,
  ClipboardList,
  ListChecks,
  Calendar,
  CalendarRange,
  FileText,
  FileCheck,
  FileSpreadsheet,

  // Communication
  Bell,
  MessageSquare,

  // Analytics & Reports
  TrendingUp,
  BarChart3,
  ChartNoAxesCombined,
  Activity,

  // Settings & System
  Settings,
  ShieldCheck,
  Key,
  DatabaseBackup,
  Network,
  GitBranch,
  Code2,
  Layers,
  Workflow,

  // Financial
  DollarSign,

  // Documents & Files
  Download,
  DownloadCloud,
  Upload,

  // Support
  HelpCircle,
  LifeBuoy,
  BookOpen,
  GraduationCap,

  // Common Actions
  CheckCircle,
  Sparkles,
  Rocket,

  // Miscellaneous
  HandHelping,
  Building2,
} from "lucide-react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Badge Keys - Defines all available badge types
 */
export type BadgeKey =
  | "notifications"
  | "pendingLeaves"
  | "pendingApprovals"
  | "myTasks"
  | "messages"
  | "pendingReviews"
  | "upcomingEvents";

/**
 * Navigation Item Interface
 * Represents a main navigation item that can have submenus
 */
export interface NavItem {
  /** Display name of the navigation item */
  name: string;
  /** URL path for the navigation item */
  href: string;
  /** Icon component from lucide-react */
  icon: React.ElementType;
  /** Array of roles that can access this item */
  roles: string[];
  /** Section grouping for the sidebar */
  section?: string;
  /** Optional static badge text (e.g., "New") */
  badge?: string;
  /** Dynamic badge key for fetching real-time counts */
  badgeKey?: BadgeKey;
  /** Optional badge color class */
  badgeColor?: string;
  /** Optional description for tooltips */
  description?: string;
  /** Flag to indicate if this is a new feature */
  isNew?: boolean;
}

/**
 * Sub Navigation Item Interface
 * Represents a child item under a parent navigation item
 */
export interface SubNavItem {
  /** Display name of the submenu item */
  name: string;
  /** URL path for the submenu item */
  href: string;
  /** Icon component from lucide-react */
  icon: React.ElementType;
  /** Parent menu item name this submenu belongs to */
  parent: string;
  /** Array of roles that can access this item */
  roles: string[];
  /** Optional static badge text */
  badge?: string;
  /** Dynamic badge key for fetching real-time counts */
  badgeKey?: BadgeKey;
  /** Optional badge color class */
  badgeColor?: string;
  /** Optional description for tooltips */
  description?: string;
}

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

/**
 * User Roles
 * Defines all available roles in the system
 */
export const ROLES = {
  /** Super Admin - Full system access */
  SUPER_ADMIN: "super_admin",
  /** Admin - Administrative access */
  ADMIN: "admin",
  /** HR Manager - Human Resources management */
  HR_MANAGER: "hr_manager",
  /** Department Manager - Department-level management */
  DEPT_MANAGER: "dept_manager",
  /** Project Manager - Project-level management */
  PROJECT_MANAGER: "project_manager",
  /** Line Manager - Team/Line management */
  LINE_MANAGER: "line_manager",
  /** Employee - Basic user access */
  EMPLOYEE: "employee",
} as const;

// ============================================================================
// ACCESS CONTROL UTILITY
// ============================================================================

/**
 * Check if a user role has access to a menu item
 *
 * @param userRole - The role of the current user
 * @param allowedRoles - Array of roles allowed to access the item
 * @returns boolean indicating if user has access
 *
 * @example
 * ```ts
 * hasAccess('admin', ['admin', 'hr_manager']) // returns true
 * hasAccess('employee', ['admin']) // returns false
 * ```
 */
export const hasAccess = (
  userRole: string,
  allowedRoles: string[],
): boolean => {
  // "all" allows any role to access
  if (allowedRoles.includes("all")) return true;

  // Super Admin has access to everything
  if (userRole === ROLES.SUPER_ADMIN) return true;

  // Check if user's role is in the allowed roles
  return allowedRoles.includes(userRole);
};

// ============================================================================
// SECTION CONFIGURATION
// ============================================================================

/**
 * Section Titles
 * Display names for each section in the sidebar
 */
export const sectionTitles: Record<string, string> = {
  main: "MAIN",
  projects: "PROJECTS",
  tasks: "TASKS",
  team: "TEAM",
  hr: "HUMAN RESOURCES",
  reports: "REPORTS & ANALYTICS",
  system: "SYSTEM ADMINISTRATION",
  support: "HELP & SUPPORT",
  kpi: "KPI Management",
};

/**
 * Section Icons
 * Icon components for each section header
 */
export const sectionIcons: Record<string, React.ElementType> = {
  main: LayoutDashboard,
  projects: Briefcase,
  tasks: CheckSquare,
  team: Users,
  hr: Users,
  reports: BarChart3,
  system: Settings,
  support: HelpCircle,
  kpi: BarChart3,
};

// ============================================================================
// PERSONAL ITEMS (Always visible, no submenu)
// ============================================================================

/**
 * Personal Navigation Items
 * These items are always visible to all authenticated users
 * They appear at the top of the sidebar and don't have submenus
 */
// Singel menus
export const personalItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["all"],
    section: "main",
    description: "Overview of your work and activities",
  },
];

// ============================================================================
// MAIN MENU ITEMS (Parent items with submenus)
// ============================================================================

/**
 * Main Navigation Items
 * These are the primary navigation items that appear in the sidebar
 * Each can have submenu items defined below
 */
export const menuItems: NavItem[] = [
  {
    name: "My Settings",
    href: "/users",
    icon: Users,
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    section: "main",
    description: "Manage all users in the system",
  },
  // --------------------------------------------------------------------------
  // USER MANAGEMENT
  // --------------------------------------------------------------------------
  {
    name: "User Management",
    href: "/users",
    icon: Users,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    section: "main",
    description: "Manage all users in the system",
  },

  // --------------------------------------------------------------------------
  // ROLE MANAGEMENT
  // --------------------------------------------------------------------------
  {
    name: "Role Management",
    href: "/roles",
    icon: UserCog,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    section: "main",
    description: "Manage roles and permissions",
  },

  // --------------------------------------------------------------------------
  // DEPARTMENT MANAGEMENT
  // --------------------------------------------------------------------------
  {
    name: "Department Management",
    href: "/departments",
    icon: Building2,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER],
    section: "main",
    description: "Manage departments and organizational structure",
  },
  // --------------------------------------------------------------------------
  // KPI
  // --------------------------------------------------------------------------
  {
    name: "KPI Management",
    href: "/kpi/management",
    icon: BarChart3,
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.HR_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
    section: "main",
    description: "Analytics and reporting",
  },
  // --------------------------------------------------------------------------
  // PROJECTS
  // --------------------------------------------------------------------------
  {
    name: "Projects",
    href: "/projects",
    icon: Briefcase,
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
    section: "projects",
    description: "Manage projects and portfolios",
  },

  // --------------------------------------------------------------------------
  // TASKS
  // --------------------------------------------------------------------------
  {
    name: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    roles: ["all"],
    section: "tasks",
    description: "Manage all tasks",
  },

  // --------------------------------------------------------------------------
  // TEAM
  // --------------------------------------------------------------------------
  {
    name: "Team",
    href: "/team",
    icon: Users,
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.LINE_MANAGER,
    ],
    section: "team",
    description: "Team collaboration and management",
  },

  // --------------------------------------------------------------------------
  // HUMAN RESOURCES (Employee Self-Service + HR Management)
  // --------------------------------------------------------------------------
  {
    name: "Human Resources",
    href: "/hr",
    icon: Users,
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.DEPT_MANAGER,
      ROLES.EMPLOYEE,
    ],
    section: "hr",
    description: "HR management and employee self-service",
  },

  // --------------------------------------------------------------------------
  // REPORTS
  // --------------------------------------------------------------------------
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.HR_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
    section: "reports",
    description: "Analytics and reporting",
  },

  // --------------------------------------------------------------------------
  // SYSTEM
  // --------------------------------------------------------------------------
  {
    name: "System",
    href: "/settings",
    icon: Settings,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    section: "system",
    description: "System administration and configuration",
  },

  // --------------------------------------------------------------------------
  // SUPPORT
  // --------------------------------------------------------------------------
  {
    name: "Support",
    href: "/support",
    icon: HelpCircle,
    roles: ["all"],
    section: "support",
    description: "Get help and support",
  },
];

// ============================================================================
// SUBMENU ITEMS
// ============================================================================

/**
 * Submenu Navigation Items
 * These items appear as dropdown items under their parent menu items
 * Organized by parent name for easy maintenance
 */
export const subMenuItems: SubNavItem[] = [
  {
    name: "Dashboard",
    href: "/kpi/dashboard",
    icon: BarChart3,
    parent: "KPI Management",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    description: "Manage your profile information",
  },
  {
    name: "KPI Management",
    href: "/kpi/management",
    icon: BarChart3,
    parent: "KPI Management",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    description: "Manage your profile information",
  },
  {
    name: "Leaderboard",
    href: "/kpi/leaderboard",
    icon: BarChart3,
    parent: "KPI Management",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    description: "Manage your profile information",
  },
  {
    name: "Reports",
    href: "/kpi/reports",
    icon: BarChart3,
    parent: "KPI Management",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    description: "Manage your profile information",
  },
  {
    name: "Analytics",
    href: "/kpi/analytics",
    icon: BarChart3,
    parent: "KPI Management",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    description: "Manage your profile information",
  },
  {
    name: "Trends",
    href: "/kpi/trends",
    icon: BarChart3,
    parent: "KPI Management",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    description: "Manage your profile information",
  },
  {
    name: "Update Profile",
    href: "/profile",
    icon: User,
    parent: "My Settings",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    description: "Manage your profile information",
  },
  {
    name: "Onboarding Setup",
    href: "/onboarding",
    icon: ClipboardList,
    parent: "My Settings",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    description: "Configure onboarding settings",
  },
  {
    name: "My Performance",
    href: "/performance/my",
    icon: ChartNoAxesCombined,
    parent: "My Settings",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    description: "View your performance reports",
  },
  {
    name: "All Notifications",
    href: "/notifications",
    icon: Bell,
    roles: ["all"],
    parent: "My Settings",
    badgeKey: "notifications", // ✅ Dynamic badge
    badgeColor: "bg-red-500",
    description: "View all your notifications",
  },
  {
    name: "AI Assistant",
    href: "/ai-assistant",
    icon: Sparkles,
    roles: ["all"],
    parent: "My Settings",
    badge: "New", // Static badge for new feature
    badgeColor: "bg-gradient-to-r from-indigo-500 to-purple-500",
    description: "Get help from your AI assistant",
    // isNew: true,
  },

  // --------------------------------------------------------------------------
  // USER MANAGEMENT SUBMENUS
  // --------------------------------------------------------------------------
  {
    name: "All Users",
    href: "/users/all",
    icon: Users,
    parent: "User Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    description: "View and manage all users",
  },
  {
    name: "Pending Approvals",
    href: "/users/pending",
    icon: UserPlus,
    parent: "User Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    badgeKey: "pendingApprovals", // ✅ Dynamic badge
    badgeColor: "bg-amber-500",
    description: "Review pending user approvals",
  },
  {
    name: "Inactive Users",
    href: "/users/inactive",
    icon: UserX,
    parent: "User Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    description: "View and manage inactive users",
  },
  {
    name: "Bulk Import",
    href: "/users/import",
    icon: FileSpreadsheet,
    parent: "User Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    description: "Import users in bulk",
  },
  {
    name: "Bulk Export",
    href: "/users/export",
    icon: Download,
    parent: "User Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    description: "Export user data",
  },

  // --------------------------------------------------------------------------
  // ROLE MANAGEMENT SUBMENUS
  // --------------------------------------------------------------------------
  {
    name: "All Roles",
    href: "/roles",
    icon: UserCog,
    parent: "Role Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    description: "View and manage all roles",
  },

  // --------------------------------------------------------------------------
  // DEPARTMENT MANAGEMENT SUBMENUS
  // --------------------------------------------------------------------------
  {
    name: "All Departments",
    href: "/departments/all",
    icon: Building2,
    parent: "Department Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER],
    description: "View and manage all departments",
  },
  {
    name: "Department Hierarchy",
    href: "/departments/hierarchy",
    icon: Network,
    parent: "Department Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER],
    description: "View organizational hierarchy",
  },
  {
    name: "Department Budget",
    href: "/departments/budget",
    icon: DollarSign,
    parent: "Department Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER],
    description: "Manage department budgets",
  },

  // --------------------------------------------------------------------------
  // PROJECTS SUBMENUS
  // --------------------------------------------------------------------------
  {
    name: "Projects Dashboard",
    href: "/projects/active",
    icon: Activity,
    parent: "Projects",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
    description: "View active projects",
  },
  {
    name: "Completed Projects",
    href: "/projects/completed",
    icon: CheckCircle,
    parent: "Projects",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
    description: "View completed projects",
  },
  {
    name: "Project Resources",
    href: "/projects/resources",
    icon: Users,
    parent: "Projects",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER],
    description: "Manage project resources",
  },
  {
    name: "Project Templates",
    href: "/projects/templates",
    icon: Layers,
    parent: "Projects",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER],
    description: "Manage project templates",
  },

  // --------------------------------------------------------------------------
  // TASKS SUBMENUS
  // --------------------------------------------------------------------------
  {
    name: "My Tasks",
    href: "/tasks/my",
    icon: CheckSquare,
    parent: "Tasks",
    roles: ["all"],
    badgeKey: "myTasks", // ✅ Dynamic badge
    badgeColor: "bg-blue-500",
    description: "View your assigned tasks",
  },
  {
    name: "All Employee Tasks",
    href: "/tasks/tasks-board",
    icon: Kanban,
    parent: "Tasks",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
    description: "View all tasks",
  },
  {
    name: "Task Kanban Board",
    href: "/tasks/kanban",
    icon: Kanban,
    parent: "Tasks",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.EMPLOYEE,
    ],
    description: "Kanban board view",
  },
  {
    name: "Task Workload",
    href: "/workload",
    icon: BarChart3,
    parent: "Tasks",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.EMPLOYEE,
    ],
    description: "View tasks on calendar",
  },
  {
    name: "Task Calendar",
    href: "/tasks/calendar",
    icon: ListTodo,
    parent: "Tasks",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.EMPLOYEE,
    ],
    description: "View tasks on calendar",
  },
  {
    name: "Gantt Chart",
    href: "/tasks/gantt",
    icon: GanttChart,
    parent: "Tasks",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER],
    description: "Gantt chart view",
  },
  {
    name: "Bulk Upload",
    href: "/tasks/bulk-upload",
    icon: Upload,
    parent: "Tasks",
    roles: ["all"],
    description: "Bulk upload tasks",
  },

  // --------------------------------------------------------------------------
  // TEAM SUBMENUS
  // --------------------------------------------------------------------------
  {
    name: "All Teams",
    href: "/teams",
    icon: UsersRound,
    parent: "Team",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.LINE_MANAGER,
      ROLES.EMPLOYEE,
    ],
    description: "View all teams",
  },
  {
    name: "My Teams",
    href: "/my-teams",
    icon: UsersRound,
    parent: "Team",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.LINE_MANAGER,
      ROLES.EMPLOYEE,
    ],
    description: "View your teams",
  },
  {
    name: "Team Tasks",
    href: "/teams/tasks",
    icon: ListChecks,
    parent: "Team",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.LINE_MANAGER,
      ROLES.EMPLOYEE,
    ],
    description: "View team tasks",
  },
  {
    name: "Team Calendar",
    href: "/teams/calendar",
    icon: CalendarRange,
    parent: "Team",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.EMPLOYEE,
    ],
    description: "View team calendar",
  },

  // --------------------------------------------------------------------------
  // HUMAN RESOURCES SUBMENUS
  // --------------------------------------------------------------------------
  // Employee Self-Service (accessible to all employees)
  {
    name: "All Leaves",
    href: "/hr/leaves",
    icon: FileCheck,
    parent: "Human Resources",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.DEPT_MANAGER,
    ],
    badgeKey: "pendingLeaves", // ✅ Dynamic badge
    badgeColor: "bg-indigo-500",
    description: "Manage all leave requests",
  },
  {
    name: "My Leaves",
    href: "/hr/leaves/my",
    icon: FileCheck,
    parent: "Human Resources",
    roles: [ROLES.EMPLOYEE, ROLES.DEPT_MANAGER],
    description: "View and manage your leave requests",
  },
  {
    name: "Leave Hostory",
    href: "/hr/leaves/history",
    icon: FileCheck,
    parent: "Human Resources",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.DEPT_MANAGER,
    ],
    description: "View and manage your leave requests",
  },
  {
    name: "My Attendance",
    href: "/hr/attendance/my",
    icon: Calendar,
    parent: "Human Resources",
    roles: [ROLES.EMPLOYEE],
    description: "View your attendance records",
  },

  // HR Management (accessible to HR and management)
  {
    name: "Employee Directory",
    href: "/hr/employees",
    icon: Users2,
    parent: "Human Resources",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.DEPT_MANAGER,
    ],
    description: "View all employees",
  },
  {
    name: "Attendance Records",
    href: "/hr/attendance",
    icon: Calendar,
    parent: "Human Resources",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.DEPT_MANAGER,
    ],
    description: "Manage attendance records",
  },
  {
    name: "Recruitment",
    href: "/recruitment",
    icon: UserPlus,
    parent: "Human Resources",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    description: "Manage recruitment",
  },
  {
    name: "Onboarding",
    href: "/onboarding",
    icon: HandHelping,
    parent: "Human Resources",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    description: "Manage employee onboarding",
  },
  {
    name: "Offboarding",
    href: "/offboarding",
    icon: UserMinus,
    parent: "Human Resources",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    description: "Manage employee offboarding",
  },
  {
    name: "Training",
    href: "/training",
    icon: GraduationCap,
    parent: "Human Resources",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    description: "Manage training programs",
  },
  {
    name: "Payroll",
    href: "/payroll",
    icon: DollarSign,
    parent: "Human Resources",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    description: "Manage payroll",
  },

  // --------------------------------------------------------------------------
  // REPORTS SUBMENUS
  // --------------------------------------------------------------------------
  {
    name: "Task Reports",
    href: "/reports/tasks",
    icon: CheckSquare,
    parent: "Reports",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
    description: "Task analytics and reports",
  },
  {
    name: "Project Reports",
    href: "/reports/projects",
    icon: Briefcase,
    parent: "Reports",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
    description: "Project analytics and reports",
  },
  {
    name: "Performance Reports",
    href: "/reports/performance",
    icon: TrendingUp,
    parent: "Reports",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.HR_MANAGER,
    ],
    description: "Performance analytics",
  },
  {
    name: "Attendance Reports",
    href: "/reports/attendance",
    icon: Calendar,
    parent: "Reports",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.DEPT_MANAGER,
    ],
    description: "Attendance analytics",
  },
  {
    name: "Leave Reports",
    href: "/reports/leaves",
    icon: FileText,
    parent: "Reports",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    description: "Leave analytics",
  },
  {
    name: "Financial Reports",
    href: "/reports/financial",
    icon: DollarSign,
    parent: "Reports",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    description: "Financial analytics",
  },
  {
    name: "Export Center",
    href: "/reports/export",
    icon: DownloadCloud,
    parent: "Reports",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.HR_MANAGER,
    ],
    description: "Export reports and data",
  },

  // --------------------------------------------------------------------------
  // SYSTEM SUBMENUS
  // --------------------------------------------------------------------------
  {
    name: "General Settings",
    href: "/settings/general",
    icon: Settings,
    parent: "System",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    description: "Configure system settings",
  },
  {
    name: "Profile Settings",
    href: "/settings/profile",
    icon: User,
    parent: "System",
    roles: ["all"],
    description: "Manage your profile settings",
  },
  {
    name: "Security Settings",
    href: "/settings/security",
    icon: ShieldCheck,
    parent: "System",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    description: "Configure security settings",
  },
  {
    name: "API Keys",
    href: "/api-keys",
    icon: Key,
    parent: "System",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    description: "Manage API keys",
  },
  {
    name: "Audit Logs",
    href: "/audit-logs",
    icon: Activity,
    parent: "System",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    description: "View system audit logs",
  },
  {
    name: "Workflow Builder",
    href: "/workflows",
    icon: Workflow,
    parent: "System",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    description: "Build and manage workflows",
  },
  {
    name: "Backup",
    href: "/backup",
    icon: DatabaseBackup,
    parent: "System",
    roles: [ROLES.SUPER_ADMIN],
    description: "Manage system backups",
  },

  // --------------------------------------------------------------------------
  // SUPPORT SUBMENUS
  // --------------------------------------------------------------------------
  {
    name: "Help Center",
    href: "/help",
    icon: HelpCircle,
    parent: "Support",
    roles: ["all"],
    description: "Browse help articles",
  },
  {
    name: "Documentation",
    href: "/docs",
    icon: BookOpen,
    parent: "Support",
    roles: ["all"],
    description: "Read documentation",
  },
  {
    name: "API Documentation",
    href: "/api-docs",
    icon: Code2,
    parent: "Support",
    roles: ["all"],
    description: "API reference documentation",
  },
  {
    name: "Support Tickets",
    href: "/support/tickets",
    icon: LifeBuoy,
    parent: "Support",
    roles: ["all"],
    description: "View and manage support tickets",
  },
  {
    name: "System Status",
    href: "/status",
    icon: Activity,
    parent: "Support",
    roles: ["all"],
    description: "Check system status",
  },
  {
    name: "Feedback",
    href: "/feedback",
    icon: MessageSquare,
    parent: "Support",
    roles: ["all"],
    description: "Submit feedback",
  },
  {
    name: "Changelog",
    href: "/changelog",
    icon: GitBranch,
    parent: "Support",
    roles: ["all"],
    description: "View system changes",
  },
  {
    name: "Roadmap",
    href: "/roadmap",
    icon: Rocket,
    parent: "Support",
    roles: ["all"],
    description: "View product roadmap",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all menu items (personal + main) for a specific user role
 *
 * @param userRole - The role of the current user
 * @returns Array of visible navigation items
 */
export const getMenuItemsForRole = (userRole: string): NavItem[] => {
  const allItems = [...personalItems, ...menuItems];
  return allItems.filter((item) => hasAccess(userRole, item.roles));
};

/**
 * Get submenu items for a specific parent and user role
 *
 * @param parentName - The name of the parent menu item
 * @param userRole - The role of the current user
 * @returns Array of visible submenu items
 */
export const getSubMenuItems = (
  parentName: string,
  userRole: string,
): SubNavItem[] => {
  return subMenuItems.filter(
    (item) => item.parent === parentName && hasAccess(userRole, item.roles),
  );
};

/**
 * Check if a menu item has any visible submenu items for a user
 *
 * @param parentName - The name of the parent menu item
 * @param userRole - The role of the current user
 * @returns boolean indicating if there are visible submenu items
 */
export const hasSubMenuItems = (
  parentName: string,
  userRole: string,
): boolean => {
  return subMenuItems.some(
    (item) => item.parent === parentName && hasAccess(userRole, item.roles),
  );
};

/**
 * Get all sections visible to a specific user role
 *
 * @param userRole - The role of the current user
 * @returns Set of visible section names
 */
export const getVisibleSections = (userRole: string): Set<string> => {
  const sections = new Set<string>();

  // Check main menu items
  menuItems.forEach((item) => {
    if (hasAccess(userRole, item.roles) && item.section) {
      sections.add(item.section);
    }
  });

  // Always include HR section for employees (for self-service)
  if (userRole === ROLES.EMPLOYEE) {
    sections.add("hr");
  }

  return sections;
};

/**
 * Get menu items grouped by section for a specific user role
 *
 * @param userRole - The role of the current user
 * @returns Object with section names as keys and arrays of items as values
 */
export const getMenuItemsGroupedBySection = (
  userRole: string,
): Record<string, NavItem[]> => {
  const grouped: Record<string, NavItem[]> = {};

  // Get all items accessible to the user
  const accessibleItems = getMenuItemsForRole(userRole);

  // Group by section
  accessibleItems.forEach((item) => {
    const section = item.section || "main";
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push(item);
  });

  return grouped;
};

/**
 * Get the appropriate icon for a section
 *
 * @param sectionName - The name of the section
 * @returns Icon component or LayoutDashboard as fallback
 */
export const getSectionIcon = (sectionName: string): React.ElementType => {
  return sectionIcons[sectionName] || LayoutDashboard;
};

/**
 * Get the display title for a section
 *
 * @param sectionName - The name of the section
 * @returns Display title or capitalized section name as fallback
 */
export const getSectionTitle = (sectionName: string): string => {
  return sectionTitles[sectionName] || sectionName.toUpperCase();
};

/**
 * Check if an item has a dynamic badge
 */
export const hasDynamicBadge = (item: NavItem | SubNavItem): boolean => {
  return !!item.badgeKey;
};

/**
 * Check if an item has any badge (static or dynamic)
 */
export const hasAnyBadge = (item: NavItem | SubNavItem): boolean => {
  return !!(item.badge || item.badgeKey);
};
