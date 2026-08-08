// @/lib/navigation/config.ts

import TimerLogPage from "@/app/(dashboard)/tasks/timerlog/page";
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
  // Additional Icons
  Clock,
  CalendarDays,
  BarChart4,
  PieChart,
  LineChart,
  UsersIcon,
  UserRound,
  Settings2,
  LifeBuoyIcon,
  MessageCircle,
  Newspaper,
  Star,
  Award,
  Trophy,
  Target,
  Flag,
  Zap,
  Heart,
  Smile,
  ThumbsUp,
  Share2,
  Bookmark,
  FolderOpen,
  FolderKanban,
  GitPullRequest,
  GitCommit,
  GitMerge,
  GitBranch as GitBranchIcon,
  CreditCard,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type BadgeKey =
  | "notifications"
  | "pendingLeaves"
  | "pendingApprovals"
  | "myTasks"
  | "messages"
  | "pendingReviews"
  | "upcomingEvents";

export type UserRole =
  | "super_admin"
  | "admin"
  | "hr_manager"
  | "dept_manager"
  | "project_manager"
  | "line_manager"
  | "employee"
  | "all";

export interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  section?: SectionId;
  badge?: string;
  badgeKey?: BadgeKey;
  badgeColor?: string;
  description?: string;
  isNew?: boolean;
  requiresFeature?: string;
}

export interface SubNavItem extends Omit<NavItem, "section"> {
  parent: string;
  target?: string; // ✅ Add this
  rel?: string;    // ✅ Add this
}

export interface SectionConfig {
  id: SectionId;
  title: string;
  icon: LucideIcon;
  priority: number;
}

export type SectionId =
  | "main"
  | "projects"
  | "tasks"
  | "team"
  | "hr"
  | "reports"
  | "system"
  | "support"
  | "kpi";

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  HR_MANAGER: "hr_manager",
  DEPT_MANAGER: "dept_manager",
  PROJECT_MANAGER: "project_manager",
  LINE_MANAGER: "line_manager",
  EMPLOYEE: "employee",
  ALL: "all",
} as const;

export const ROLE_PRIORITY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 80,
  hr_manager: 70,
  dept_manager: 60,
  project_manager: 50,
  line_manager: 40,
  employee: 10,
  all: 0,
};

// ============================================================================
// SECTION CONFIGURATION
// ============================================================================

export const SECTIONS: Record<SectionId, SectionConfig> = {
  main: {
    id: "main",
    title: "MAIN MENU",
    icon: LayoutDashboard,
    priority: 0,
  },
  kpi: {
    id: "kpi",
    title: "PERFORMANCE & KPI",
    icon: Trophy,
    priority: 5,
  },
  projects: {
    id: "projects",
    title: "PROJECT MANAGEMENT",
    icon: FolderKanban,
    priority: 10,
  },
  tasks: {
    id: "tasks",
    title: "TASK MANAGEMENT",
    icon: ClipboardList,
    priority: 20,
  },
  team: {
    id: "team",
    title: "TEAM COLLABORATION",
    icon: UsersRound,
    priority: 30,
  },
  hr: {
    id: "hr",
    title: "HUMAN RESOURCES",
    icon: Users2,
    priority: 40,
  },
  reports: {
    id: "reports",
    title: "REPORTS & ANALYTICS",
    icon: BarChart4,
    priority: 50,
  },
  system: {
    id: "system",
    title: "SYSTEM ADMINISTRATION",
    icon: Settings2,
    priority: 60,
  },
  support: {
    id: "support",
    title: "HELP & SUPPORT",
    icon: LifeBuoyIcon,
    priority: 70,
  },
};

// ============================================================================
// NAVIGATION ITEMS BUILDER
// ============================================================================

const createNavItem = (
  id: string,
  name: string,
  href: string,
  icon: LucideIcon,
  roles: UserRole[],
  options: Partial<
    Pick<
      NavItem,
      | "section"
      | "badge"
      | "badgeKey"
      | "badgeColor"
      | "description"
      | "isNew"
      | "requiresFeature"
    >
  > = {},
): NavItem => ({
  id,
  name,
  href,
  icon,
  roles,
  section: options.section || "main",
  ...options,
});

const createSubNavItem = (
  id: string,
  name: string,
  href: string,
  icon: LucideIcon,
  parent: string,
  roles: UserRole[],
  options: Partial<
    Pick<
      SubNavItem,
      | "badge"
      | "badgeKey"
      | "badgeColor"
      | "description"
      | "isNew"
      | "requiresFeature"
      | "target"
      | "rel"
    >
  > = {},
): SubNavItem => ({
  id,
  name,
  href,
  icon,
  parent,
  roles,
  target: options.target || "_self",
  rel: options.rel || "",
  ...options,
});

// ============================================================================
// NAVIGATION ITEMS - ALL WITH USER-FRIENDLY NAMES & UPDATED ICONS
// ============================================================================

// Personal Items (always visible)
export const PERSONAL_ITEMS = {
  dashboard: createNavItem(
    "dashboard",
    "Dashboard",
    "/dashboard",
    LayoutDashboard,
    [ROLES.ALL],
    { section: "main", description: "Your personalized work overview" },
  ),
} as const;

// Main Navigation Items
export const MAIN_ITEMS = {
  // Profile & Settings
  mySettings: createNavItem(
    "my-settings",
    "My Profile",
    "/settings/profile",
    UserRound,
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    { section: "main", description: "Manage your profile and preferences" },
  ),

  // User Management
  userManagement: createNavItem(
    "user-management",
    "User Management",
    "/users",
    Users,
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    { section: "main", description: "Manage system users and their access" },
  ),

  // Role Management
  roleManagement: createNavItem(
    "role-management",
    "Roles & Permissions",
    "/roles",
    ShieldCheck,
    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    { section: "main", description: "Define and manage user roles and permissions" },
  ),

  // Department Management
  departmentManagement: createNavItem(
    "department-management",
    "Departments",
    "/departments",
    Building2,
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER],
    {
      section: "main",
      description: "Manage departments and organizational structure",
    },
  ),

  // KPI Management
  kpiManagement: createNavItem(
    "kpi-management",
    "KPI Dashboard",
    "/kpi/management",
    Trophy,
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.HR_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
    { section: "kpi", description: "Define and track Key Performance Indicators" },
  ),

  // Projects
  projects: createNavItem(
    "projects",
    "Projects",
    "/projects",
    FolderKanban,
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER],
    { section: "projects", description: "Manage projects, portfolios, and deliverables" },
  ),

  // Tasks
  tasks: createNavItem(
    "tasks",
    "Tasks",
    "/tasks",
    ClipboardList,
    [ROLES.ALL],
    {
      section: "tasks",
      description: "Manage and track all your tasks",
    },
  ),


  // Team
  team: createNavItem(
    "team",
    "Team",
    "/team",
    UsersRound,
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.LINE_MANAGER,
    ],
    { section: "team", description: "Collaborate with your team members" },
  ),

  // Human Resources
  humanResources: createNavItem(
    "human-resources",
    "HR Management",
    "/hr",
    Users2,
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.DEPT_MANAGER,
      ROLES.EMPLOYEE,
    ],
    { section: "hr", description: "HR management and employee self-service" },
  ),

  // Reports
  reports: createNavItem(
    "reports",
    "Reports",
    "/reports",
    BarChart4,
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.HR_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
    { section: "reports", description: "Analytics, insights, and business reports" },
  ),

  // System
  system: createNavItem(
    "system",
    "System Settings",
    "/settings",
    Settings2,
    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    {
      section: "system",
      description: "System administration and configuration",
    },
  ),

  // Support
  support: createNavItem(
    "support",
    "Help & Support",
    "/support",
    LifeBuoyIcon,
    [ROLES.ALL],
    { section: "support", description: "Get help, documentation, and support" },
  ),
} as const;

// ============================================================================
// SUB-NAVIGATION ITEMS - ALL WITH USER-FRIENDLY NAMES & UPDATED ICONS
// ============================================================================

export const SUB_ITEMS = {
  // My Profile Sub-items
  editProfile: createSubNavItem(
    "edit-profile",
    "Edit Profile",
    "/profile",
    User,
    "My Profile",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    { description: "Update your personal information" },
  ),
  accountSettings: createSubNavItem(
    "account-settings",
    "Account Settings",
    "/settings/account",
    Settings,
    "My Profile",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    { description: "Manage your account preferences" },
  ),
  // securitySettings: createSubNavItem(
  //   "security-settings",
  //   "Security",
  //   "/settings/security",
  //   ShieldCheck,
  //   "My Profile",
  //   [
  //     ROLES.SUPER_ADMIN,
  //     ROLES.ADMIN,
  //     ROLES.HR_MANAGER,
  //     ROLES.EMPLOYEE,
  //     ROLES.DEPT_MANAGER,
  //   ],
  //   { description: "Manage your security settings" },
  // ),
  onboarding: createSubNavItem(
    "onboarding",
    "Onboarding",
    "/onboarding",
    UserPlus,
    "My Profile",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    { description: "View your performance metrics and reviews" },
  ),
  performance: createSubNavItem(
    "performance",
    "My Performance",
    "/performance/my",
    TrendingUp,
    "My Profile",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
    ],
    { description: "View your performance metrics and reviews" },
  ),
  notifications: createSubNavItem(
    "notifications",
    "Notifications",
    "/notifications",
    Bell,
    "My Profile",
    [ROLES.ALL],
    {
      badgeKey: "notifications",
      badgeColor: "bg-red-500",
      description: "View all your notifications and alerts",
    },
  ),
  aiAssistant: createSubNavItem(
    "ai-assistant",
    "AI Assistant",
    "/ai-assistant",
    Sparkles,
    "My Profile",
    [ROLES.ALL],
    {
      badge: "New",
      badgeColor: "bg-gradient-to-r from-indigo-500 to-purple-500",
      description: "Get intelligent assistance from AI",
    },
  ),


  // KPI Dashboard Sub-items
  kpiOverview: createSubNavItem(
    "kpi-overview",
    "KPI Overview",
    "/kpi/dashboard",
    LayoutDashboard,
    "KPI Dashboard",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.EMPLOYEE
    ],
    { description: "View KPI performance overview" },
  ),
  kpiConfiguration: createSubNavItem(
    "kpi-configuration",
    "KPI Configuration",
    "/kpi/management",
    Settings,
    "KPI Dashboard",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.EMPLOYEE
    ],
    { description: "Configure and manage KPIs" },
  ),
  kpiLeaderboard: createSubNavItem(
    "kpi-leaderboard",
    "Leaderboard",
    "/kpi/leaderboard",
    Award,
    "KPI Dashboard",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.EMPLOYEE
    ],
    { description: "View performance rankings and achievements" },
  ),
  kpiReports: createSubNavItem(
    "kpi-reports",
    "KPI Reports",
    "/kpi/reports",
    FileText,
    "KPI Dashboard",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.EMPLOYEE
    ],
    { description: "Generate and export KPI reports" },
  ),
  kpiAnalytics: createSubNavItem(
    "kpi-analytics",
    "KPI Analytics",
    "/kpi/analytics",
    BarChart3,
    "KPI Dashboard",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
    { description: "Advanced analytics for KPIs" },
  ),
  kpiTrends: createSubNavItem(
    "kpi-trends",
    "KPI Trends",
    "/kpi/trends",
    TrendingUp,
    "KPI Dashboard",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.EMPLOYEE,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
    { description: "Track KPI trends over time" },
  ),

  // User Management Sub-items
  allUsers: createSubNavItem(
    "all-users",
    "All Users",
    "/users/all",
    Users,
    "User Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    { description: "View and manage all system users" },
  ),
  pendingApprovals: createSubNavItem(
    "pending-approvals",
    "Pending Approvals",
    "/users/pending",
    UserPlus,
    "User Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    {
      badgeKey: "pendingApprovals",
      badgeColor: "bg-amber-500",
      description: "Review and approve pending user requests",
    },
  ),
  inactiveUsers: createSubNavItem(
    "inactive-users",
    "Inactive Users",
    "/users/inactive",
    UserX,
    "User Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    { description: "View and manage inactive user accounts" },
  ),
  bulkImport: createSubNavItem(
    "bulk-import",
    "Bulk Import",
    "/users/import",
    FileSpreadsheet,
    "User Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    { description: "Import users in bulk from CSV" },
  ),
  bulkExport: createSubNavItem(
    "bulk-export",
    "Bulk Export",
    "/users/export",
    Download,
    "User Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    { description: "Export user data to CSV" },
  ),

  // Roles & Permissions Sub-items
  allRoles: createSubNavItem(
    "all-roles",
    "All Roles",
    "/roles",
    UserCog,
    "Roles & Permissions",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    { description: "View and manage all system roles" },
  ),
  permissions: createSubNavItem(
    "permissions",
    "Permissions",
    "/permissions",
    ShieldCheck,
    "Roles & Permissions",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    { description: "Manage permissions for each role" },
  ),

  // Departments Sub-items
  allDepartments: createSubNavItem(
    "all-departments",
    "All Departments",
    "/departments/all",
    Building2,
    "Departments",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER],
    { description: "View and manage all departments" },
  ),
  departmentHierarchy: createSubNavItem(
    "department-hierarchy",
    "Department Hierarchy",
    "/departments/hierarchy",
    Network,
    "Departments",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER],
    { description: "View organizational hierarchy structure" },
  ),
  departmentBudgets: createSubNavItem(
    "department-budgets",
    "Department Budgets",
    "/departments/budget",
    DollarSign,
    "Departments",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER],
    { description: "Manage and track department budgets" },
  ),

  // Projects Sub-items
  activeProjects: createSubNavItem(
    "active-projects",
    "All Active Projects",
    "/projects/active",
    FolderOpen,
    "Projects",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER],
    { description: "View and manage active projects" },
  ),
  completedProjects: createSubNavItem(
    "completed-projects",
    "Completed Projects",
    "/projects/completed",
    CheckCircle,
    "Projects",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER],
    { description: "View completed and archived projects" },
  ),
  projectResources: createSubNavItem(
    "project-resources",
    "Project Resources",
    "/projects/resources",
    Users,
    "Projects",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER],
    { description: "Manage project resources and allocation" },
  ),
  projectTemplates: createSubNavItem(
    "project-templates",
    "Project Templates",
    "/projects/templates",
    Layers,
    "Projects",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER],
    { description: "Manage and reuse project templates" },
  ),

  // Tasks Sub-items
  myTasks: createSubNavItem(
    "my-tasks",
    "My Tasks",
    "/tasks/my",
    CheckSquare,
    "Tasks",
    [ROLES.ALL],
    {
      badgeKey: "myTasks",
      badgeColor: "bg-blue-500",
      description: "View your assigned tasks",
    },
  ),
  allTasks: createSubNavItem(
    "all-tasks",
    "All Tasks",
    "/tasks/tasks-board",
    ListTodo,
    "Tasks",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER],
    { description: "View all tasks across the organization" },
  ),
  kanbanBoard: createSubNavItem(
    "kanban-board",
    "Kanban Board",
    "/tasks/kanban",
    Kanban,
    "Tasks",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.EMPLOYEE,
    ],
    { description: "Visual task management with Kanban board" },
  ),
  taskWorkload: createSubNavItem(
    "task-workload",
    "Task Workload",
    "/workload",
    BarChart3,
    "Tasks",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.EMPLOYEE,
    ],
    { description: "View task workload distribution" },
  ),
  taskCalendar: createSubNavItem(
    "task-calendar",
    "Task Calendar",
    "/tasks/calendar",
    CalendarDays,
    "Tasks",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.EMPLOYEE,
    ],
    { description: "View tasks on a calendar timeline" },
  ),
  ganttChart: createSubNavItem(
    "gantt-chart",
    "Gantt Chart",
    "/tasks/gantt",
    GanttChart,
    "Tasks",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER],
    { description: "Project timeline visualization with Gantt chart" },
  ),
  bulkUpload: createSubNavItem(
    "bulk-upload",
    "Bulk Upload",
    "/tasks/bulk-upload",
    Upload,
    "Tasks",
    [ROLES.ALL],
    { description: "Upload multiple tasks in bulk" },
  ),
  timerLog: createSubNavItem(
    "timer-log",
    "Timer Log",
    "/tasks/timerlog",
    Clock,
    "Tasks",
    [ROLES.ALL],
    { description: "View and manage your timer logs" },
  ),

  // Team Sub-items
  allTeams: createSubNavItem(
    "all-teams",
    "All Teams",
    "/teams",
    UsersRound,
    "Team",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.LINE_MANAGER,
      ROLES.EMPLOYEE,
    ],
    { description: "View and manage all teams" },
  ),
  myTeams: createSubNavItem(
    "my-teams",
    "My Teams",
    "/my-teams",
    Users,
    "Team",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.LINE_MANAGER,
      ROLES.EMPLOYEE,
    ],
    { description: "View your teams and team members" },
  ),
  teamTasks: createSubNavItem(
    "team-tasks",
    "Team Tasks",
    "/teams/tasks",
    ListChecks,
    "Team",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.LINE_MANAGER,
      ROLES.EMPLOYEE,
    ],
    { description: "View and manage team tasks" },
  ),
  teamCalendar: createSubNavItem(
    "team-calendar",
    "Team Calendar",
    "/teams/calendar",
    CalendarRange,
    "Team",
    [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.EMPLOYEE,
    ],
    { description: "View team calendar and schedules" },
  ),

  // HR Management Sub-items
  leaveManagement: createSubNavItem(
    "leave-management",
    "Leave Management",
    "/hr/leaves",
    FileCheck,
    "HR Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.DEPT_MANAGER],
    {
      badgeKey: "pendingLeaves",
      badgeColor: "bg-indigo-500",
      description: "Manage all leave requests",
    },
  ),
  myLeaves: createSubNavItem(
    "my-leaves",
    "My Leaves",
    "/hr/leaves/my",
    Calendar,
    "HR Management",
    [ROLES.EMPLOYEE, ROLES.DEPT_MANAGER],
    { description: "View and manage your leave requests" },
  ),
  leaveHistory: createSubNavItem(
    "leave-history",
    "Leave History",
    "/hr/leaves/history",
    Clock,
    "HR Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.DEPT_MANAGER],
    { description: "View complete leave history" },
  ),
  myAttendance: createSubNavItem(
    "my-attendance",
    "My Attendance",
    "/hr/attendance/my",
    CalendarRange,
    "HR Management",
    [ROLES.EMPLOYEE],
    { description: "View your attendance records" },
  ),
  employeeDirectory: createSubNavItem(
    "employee-directory",
    "Employee Directory",
    "/hr/employees",
    Users2,
    "HR Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.DEPT_MANAGER],
    { description: "Browse and search employee directory" },
  ),
  attendanceManagement: createSubNavItem(
    "attendance-management",
    "Attendance Management",
    "/hr/attendance",
    Clock,
    "HR Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.DEPT_MANAGER],
    { description: "Manage employee attendance records" },
  ),
  recruitment: createSubNavItem(
    "recruitment",
    "Recruitment",
    "/recruitment",
    UserPlus,
    "HR Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    { description: "Manage recruitment and hiring process" },
  ),
  employeeOnboarding: createSubNavItem(
    "employee-onboarding",
    "Employee Onboarding",
    "/onboarding",
    HandHelping,
    "HR Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    { description: "Manage new employee onboarding" },
  ),
  // employeeOffboarding: createSubNavItem(
  //   "employee-offboarding",
  //   "Employee Offboarding",
  //   "/offboarding",
  //   UserMinus,
  //   "HR Management",
  //   [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  //   { description: "Manage employee offboarding process" },
  // ),
  trainingPrograms: createSubNavItem(
    "training-programs",
    "Training Programs",
    "/training",
    GraduationCap,
    "HR Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    { description: "Manage employee training programs" },
  ),
  payrollManagement: createSubNavItem(
    "payroll-management",
    "Payroll Management",
    "/payroll",
    DollarSign,
    "HR Management",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    { description: "Manage payroll and compensation" },
  ),

  // Reports Sub-items
  taskReports: createSubNavItem(
    "task-reports",
    "Task Reports",
    "/reports/tasks",
    CheckSquare,
    "Reports",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER],
    { description: "Generate task analytics and reports" },
  ),
  projectReports: createSubNavItem(
    "project-reports",
    "Project Reports",
    "/reports/projects",
    FolderKanban,
    "Reports",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.PROJECT_MANAGER],
    { description: "Generate project analytics and reports" },
  ),
  performanceReports: createSubNavItem(
    "performance-reports",
    "Performance Reports",
    "/reports/performance",
    TrendingUp,
    "Reports",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.HR_MANAGER],
    { description: "Generate performance analytics and reports" },
  ),
  attendanceReports: createSubNavItem(
    "attendance-reports",
    "Attendance Reports",
    "/reports/attendance",
    Calendar,
    "Reports",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.DEPT_MANAGER],
    { description: "Generate attendance analytics and reports" },
  ),
  leaveReports: createSubNavItem(
    "leave-reports",
    "Leave Reports",
    "/reports/leaves",
    FileText,
    "Reports",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    { description: "Generate leave analytics and reports" },
  ),
  financialReports: createSubNavItem(
    "financial-reports",
    "Financial Reports",
    "/reports/financial",
    DollarSign,
    "Reports",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    { description: "Generate financial analytics and reports" },
  ),
  exportCenter: createSubNavItem(
    "export-center",
    "Export Center",
    "/reports/export",
    DownloadCloud,
    "Reports",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER, ROLES.HR_MANAGER],
    { description: "Export reports and data" },
  ),

  // System Settings Sub-items
  generalSettings: createSubNavItem(
    "general-settings",
    "General Settings",
    "/settings/general",
    Settings,
    "System Settings",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    { description: "Configure general system settings" },
  ),
  emailSettings: createSubNavItem(
    "email-settings",
    "Email Settings",
    "/settings/email",
    MessageSquare,
    "System Settings",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    { description: "Configure email settings and templates" },
  ),
  securityConfig: createSubNavItem(
    "security-config",
    "Security Settings",
    "/settings/security",
    ShieldCheck,
    "System Settings",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    { description: "Configure security settings and policies" },
  ),
  auditLogs: createSubNavItem(
    "audit-logs",
    "Audit Logs",
    "/settings/audit-logs",
    Activity,
    "System Settings",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    { description: "View system audit logs and activity" },
  ),
  billing: createSubNavItem(
    "billing",
    "Billing",
    "/settings/billing",
    CreditCard,
    "System Settings",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN,ROLES.EMPLOYEE],
    { description: "Manage billing, invoices, and subscriptions" },
  ),
  pricingPlans: createSubNavItem(
    "pricing-plans",
    "Pricing Plans",
    "/settings/pricing",
    DollarSign,
    "System Settings",
    [ROLES.SUPER_ADMIN, ROLES.ADMIN,ROLES.EMPLOYEE],
    { description: "Manage billing, invoices, and subscriptions" },
  ),
  backupManagement: createSubNavItem(
    "backup-management",
    "Backup Management",
    "/settings/backup",
    DatabaseBackup,
    "System Settings",
    [ROLES.SUPER_ADMIN],
    { description: "Manage system backups and restore" },
  ),

  // Help & Support Sub-items
  helpCenter: createSubNavItem(
    "help-center",
    "Help Center",
    "/help/support",
    HelpCircle,
    "Help & Support",
    [ROLES.ALL],
    { description: "Browse help articles and guides" },
  ),
  documentation: createSubNavItem(
    "documentation",
    "Documentation",
    "https://sajungenitdev.github.io/task-documentation/",
    BookOpen,
    "Help & Support",
    [ROLES.ALL],
    {
      description: "Read full system documentation",
      target: "_blank",      
      rel: "noopener noreferrer" 
    },
  ),
  apiDocs: createSubNavItem(
    "api-docs",
    "API Documentation",
    "/help/api-docs",
    Code2,
    "Help & Support",
    [ROLES.ALL],
    { description: "API reference and integration guides" },
  ),
  supportTickets: createSubNavItem(
    "support-tickets",
    "Support Tickets",
    "/help/support/tickets",
    LifeBuoy,
    "Help & Support",
    [ROLES.ALL],
    { description: "View and manage support tickets" },
  ),
  systemStatus: createSubNavItem(
    "system-status",
    "System Status",
    "/help/system-status",
    Activity,
    "Help & Support",
    [ROLES.ALL],
    { description: "Check system health and status" },
  ),
  submitFeedback: createSubNavItem(
    "submit-feedback",
    "Submit Feedback",
    "/feedback",
    MessageCircle,
    "Help & Support",
    [ROLES.ALL],
    { description: "Submit feedback and suggestions" },
  ),
  releaseNotes: createSubNavItem(
    "release-notes",
    "Release Notes",
    "/help/changelog",
    Newspaper,
    "Help & Support",
    [ROLES.ALL],
    { description: "View system changes and updates" },
  ),
  productRoadmap: createSubNavItem(
    "product-roadmap",
    "Product Roadmap",
    "/help/product-roadmap",
    Rocket,
    "Help & Support",
    [ROLES.ALL],
    { description: "View product development roadmap" },
  ),
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a user role has access to a menu item
 */
export const hasAccess = (
  userRole: string,
  allowedRoles: UserRole[],
): boolean => {
  if (allowedRoles.includes(ROLES.ALL)) return true;
  if (userRole === ROLES.SUPER_ADMIN) return true;
  return allowedRoles.includes(userRole as UserRole);
};

/**
 * Get all personal items for a user
 */
export const getPersonalItems = (userRole: string): NavItem[] => {
  return Object.values(PERSONAL_ITEMS).filter((item) =>
    hasAccess(userRole, item.roles),
  );
};

/**
 * Get all main menu items for a user
 */
export const getMainItems = (userRole: string): NavItem[] => {
  return Object.values(MAIN_ITEMS).filter((item) =>
    hasAccess(userRole, item.roles),
  );
};

/**
 * Get all menu items for a user (personal + main)
 */
export const getMenuItemsForRole = (userRole: string): NavItem[] => {
  return [...getPersonalItems(userRole), ...getMainItems(userRole)];
};

/**
 * Get submenu items for a specific parent and user role
 */
export const getSubMenuItems = (
  parentName: string,
  userRole: string,
): SubNavItem[] => {
  return Object.values(SUB_ITEMS).filter(
    (item) => item.parent === parentName && hasAccess(userRole, item.roles),
  );
};

/**
 * Check if a menu item has any visible submenu items for a user
 */
export const hasSubMenuItems = (
  parentName: string,
  userRole: string,
): boolean => {
  return Object.values(SUB_ITEMS).some(
    (item) => item.parent === parentName && hasAccess(userRole, item.roles),
  );
};

/**
 * Get all sections visible to a user
 */
export const getVisibleSections = (userRole: string): SectionId[] => {
  const sections = new Set<SectionId>();

  Object.values(MAIN_ITEMS).forEach((item) => {
    if (hasAccess(userRole, item.roles) && item.section) {
      sections.add(item.section);
    }
  });

  // Always include HR section for employees (for self-service)
  if (userRole === ROLES.EMPLOYEE) {
    sections.add("hr");
  }

  return Array.from(sections);
};

/**
 * Get menu items grouped by section
 */
export const getMenuItemsGroupedBySection = (
  userRole: string,
): Record<SectionId, NavItem[]> => {
  const grouped: Record<SectionId, NavItem[]> = {} as Record<
    SectionId,
    NavItem[]
  >;
  const items = getMenuItemsForRole(userRole);

  items.forEach((item) => {
    const section = item.section || "main";
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push(item);
  });

  // Sort sections by priority
  const sorted: Record<SectionId, NavItem[]> = {} as Record<
    SectionId,
    NavItem[]
  >;
  Object.keys(grouped)
    .sort(
      (a, b) =>
        (SECTIONS[a as SectionId]?.priority || 999) -
        (SECTIONS[b as SectionId]?.priority || 999),
    )
    .forEach((key) => {
      sorted[key as SectionId] = grouped[key as SectionId];
    });

  return sorted;
};

/**
 * Get section configuration
 */
export const getSectionConfig = (
  sectionId: SectionId,
): SectionConfig | undefined => {
  return SECTIONS[sectionId];
};

/**
 * Check if an item has a dynamic badge
 */
export const hasDynamicBadge = (item: NavItem | SubNavItem): boolean => {
  return !!item.badgeKey;
};

/**
 * Check if an item has any badge
 */
export const hasAnyBadge = (item: NavItem | SubNavItem): boolean => {
  return !!(item.badge || item.badgeKey);
};

/**
 * Find a navigation item by ID
 */
export const findNavItem = (id: string): NavItem | undefined => {
  return (
    MAIN_ITEMS[id as keyof typeof MAIN_ITEMS] ||
    PERSONAL_ITEMS[id as keyof typeof PERSONAL_ITEMS]
  );
};

/**
 * Find a sub-navigation item by ID
 */
export const findSubNavItem = (id: string): SubNavItem | undefined => {
  return SUB_ITEMS[id as keyof typeof SUB_ITEMS];
};

/**
 * Get the parent navigation item for a sub-item
 */
export const getParentNavItem = (subItem: SubNavItem): NavItem | undefined => {
  return Object.values(MAIN_ITEMS).find((item) => item.name === subItem.parent);
};

/**
 * Get all sub-items for a parent
 */
export const getSubItemsForParent = (parentName: string): SubNavItem[] => {
  return Object.values(SUB_ITEMS).filter((item) => item.parent === parentName);
};

/**
 * Check if a user has any menu items
 */
export const hasAnyMenuItems = (userRole: string): boolean => {
  return getMenuItemsForRole(userRole).length > 0;
};

/**
 * Get the count of visible items for a user
 */
export const getVisibleItemsCount = (userRole: string): number => {
  return getMenuItemsForRole(userRole).length;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  ROLES,
  SECTIONS,
  PERSONAL_ITEMS,
  MAIN_ITEMS,
  SUB_ITEMS,
  hasAccess,
  getPersonalItems,
  getMainItems,
  getMenuItemsForRole,
  getSubMenuItems,
  hasSubMenuItems,
  getVisibleSections,
  getMenuItemsGroupedBySection,
  getSectionConfig,
  hasDynamicBadge,
  hasAnyBadge,
  findNavItem,
  findSubNavItem,
  getParentNavItem,
  getSubItemsForParent,
  hasAnyMenuItems,
  getVisibleItemsCount,
};