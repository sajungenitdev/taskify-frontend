// lib/menuItems.ts

import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  Clock,
  FileText,
  Users,
  UserCog,
  Building2,
  FolderKanban,
  Briefcase,
  Calendar,
  FileCheck,
  UserPlus,
  TrendingUp,
  Award,
  PieChart,
  Target,
  Download,
  Bell,
  MessageSquare,
  Mail,
  GitBranch,
  Activity,
  Zap,
  Shield,
  BarChart3,
  CreditCard,
  HelpCircle,
  LifeBuoy,
  BookOpen,
  UserCheck,
  UserX,
  UserMinus,
  DollarSign,
  Key,
  Database,
  Globe,
  Rocket,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Menu,
  X,
  Home,
  LogOut,
  User,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Timer,
  AlertTriangle,
  Megaphone,
  Send,
  Inbox,
  Archive,
  Copy,
  Link2,
  ExternalLink,
  Folder,
  FolderOpen,
  FolderPlus,
  File,
  FileSpreadsheet,
  Code,
  Terminal,
  Server,
  Network,
  ListChecks,
  ClipboardList,
  CalendarCheck,
  UsersRound,
  HandHelping,
  Workflow,
  Layers,
  Upload,
  GanttChart,
  Kanban,
  TimerReset,
  UserSearch,
  BriefcaseBusiness,
  ChartColumnIncreasing,
  ClipboardCheck,
  Wrench,
  LifeBuoyIcon,
  BookOpenCheck,
  GraduationCap,
  HandCoins,
  Users2,
  ListTodo,
  CalendarRange,
  Clock4,
  ChartNoAxesCombined,
  DownloadCloud,
  FileJson,
  ShieldCheck,
  Fingerprint,
  DatabaseBackup,
  Plug,
  Webhook,
  LockKeyhole,
  BadgeCheck,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  section?: string;
  badge?: string;
  badgeColor?: string;
  description?: string;
  isNew?: boolean;
}

export interface SubNavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  parent: string;
  roles: string[];
  badge?: string;
  badgeColor?: string;
  description?: string;
}

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  HR_MANAGER: "hr_manager",
  DEPT_MANAGER: "dept_manager",
  PROJECT_MANAGER: "project_manager",
  LINE_MANAGER: "line_manager",
  EMPLOYEE: "employee",
} as const;

export const hasAccess = (
  userRole: string,
  allowedRoles: string[],
): boolean => {
  if (allowedRoles.includes("all")) return true;
  if (userRole === ROLES.SUPER_ADMIN) return true;
  return allowedRoles.includes(userRole);
};

export const sectionTitles: Record<string, string> = {
  main: "MAIN",
  projects: "PROJECTS",
  tasks: "TASKS",
  team: "TEAM",
  hr: "HUMAN RESOURCES",
  reports: "REPORTS",
  system: "SYSTEM",
  support: "SUPPORT",
};

export const sectionIcons: Record<string, React.ElementType> = {
  main: LayoutDashboard,
  projects: Briefcase,
  tasks: CheckSquare,
  team: Users,
  hr: Users,
  reports: BarChart3,
  system: Settings,
  support: HelpCircle,
};

// Personal Items (Always visible, no submenu)
export const personalItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["all"],
    section: "main",
  },
  {
    name: "My Profile",
    href: "/profile",
    icon: User,
    roles: ["all"],
    section: "main",
  },
  {
    name: "My Attendance",
    href: "/attendance/my",
    icon: Clock4,
    roles: [ROLES.EMPLOYEE, ROLES.LINE_MANAGER, ROLES.PROJECT_MANAGER],
    section: "main",
  },
  {
    name: "My Leaves",
    href: "/leaves/my",
    icon: Calendar,
    roles: [ROLES.EMPLOYEE, ROLES.LINE_MANAGER, ROLES.PROJECT_MANAGER],
    section: "main",
  },
  {
    name: "My Performance",
    href: "/performance/my",
    icon: ChartNoAxesCombined,
    roles: [ROLES.EMPLOYEE],
    section: "main",
  },
  {
    name: "Messages",
    href: "/messages",
    icon: MessageSquare,
    roles: ["all"],
    section: "main",
    badge: "5",
    badgeColor: "bg-blue-500",
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
    roles: ["all"],
    section: "main",
    badge: "12",
    badgeColor: "bg-red-500",
  },
];

// Main Menu Items (Parent items with submenus)
export const menuItems: NavItem[] = [
  // User Management
  {
    name: "User Management",
    href: "/users",
    icon: Users,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    section: "main",
  },
  // Role Management - NEW AS SEPARATE MODULE
  {
    name: "Role Management",
    href: "/roles",
    icon: UserCog,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    section: "main",
  },
  // Department Management
  {
    name: "Department Management",
    href: "/departments",
    icon: Building2,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER],
    section: "main",
  },
  // Projects
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
  },
  // Tasks
  {
    name: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    roles: ["all"],
    section: "tasks",
  },
  // Team
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
  },
  // Human Resources
  {
    name: "Human Resources",
    href: "/hr",
    icon: Users,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
    section: "hr",
  },
  // Reports
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
  },
  // System
  {
    name: "System",
    href: "/settings",
    icon: Settings,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    section: "system",
  },
  // Support
  {
    name: "Support",
    href: "/support",
    icon: HelpCircle,
    roles: ["all"],
    section: "support",
  },
];

// Submenu Items
export const subMenuItems: SubNavItem[] = [
  // User Management Submenus
  {
    name: "All Users",
    href: "/users/all",
    icon: Users,
    parent: "User Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  },
  {
    name: "Pending Approvals",
    href: "/users/pending",
    icon: UserPlus,
    parent: "User Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  },
  {
    name: "Inactive Users",
    href: "/users/inactive",
    icon: UserX,
    parent: "User Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  },
  {
    name: "Bulk Import",
    href: "/users/import",
    icon: FileSpreadsheet,
    parent: "User Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  },
  {
    name: "Bulk Export",
    href: "/users/export",
    icon: Download,
    parent: "User Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  },

  // Role Management Submenus
  {
    name: "All Roles",
    href: "/roles",
    icon: UserCog,
    parent: "Role Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },

  // Department Management Submenus
  {
    name: "All Departments",
    href: "/departments/all",
    icon: Building2,
    parent: "Department Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DEPT_MANAGER],
  },
  {
    name: "Department Hierarchy",
    href: "/departments/hierarchy",
    icon: Network,
    parent: "Department Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    name: "Department Budget",
    href: "/departments/budget",
    icon: DollarSign,
    parent: "Department Management",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },

  // Projects Submenus
  {
    name: "Active Projects",
    href: "/projects/active",
    icon: Activity,
    parent: "Projects",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
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
  },
  {
    name: "Project Resources",
    href: "/projects/resources",
    icon: Users,
    parent: "Projects",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  },
  {
    name: "Project Templates",
    href: "/projects/templates",
    icon: Layers,
    parent: "Projects",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  },

  // Tasks Submenus
  {
    name: "My Tasks",
    href: "/tasks/my",
    icon: CheckSquare,
    parent: "Tasks",
    roles: ["all"],
  },
  {
    name: "All Task",
    href: "/tasks/tasks-board",
    icon: Kanban,
    parent: "Tasks",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
  },
  {
    name: "Task Board",
    href: "/tasks/all",
    icon: ListTodo,
    parent: "Tasks",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
  },
  {
    name: "Gantt Chart",
    href: "/tasks/gantt",
    icon: GanttChart,
    parent: "Tasks",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER],
  },
  {
    name: "Bulk Upload",
    href: "/tasks/bulk-upload",
    icon: Upload,
    parent: "Tasks",
    roles: ["all"],
  },

  // Team Submenus
  {
    name: "My Team",
    href: "/team/my",
    icon: UsersRound,
    parent: "Team",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.LINE_MANAGER,
    ],
  },
  {
    name: "Team Tasks",
    href: "/team/tasks",
    icon: ListChecks,
    parent: "Team",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.LINE_MANAGER,
    ],
  },
  {
    name: "Team Calendar",
    href: "/team/calendar",
    icon: CalendarRange,
    parent: "Team",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
    ],
  },
  {
    name: "Team Attendance",
    href: "/attendance",
    icon: CalendarCheck,
    parent: "Team",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.HR_MANAGER,
    ],
  },
  {
    name: "Team Leaves",
    href: "/leaves",
    icon: FileCheck,
    parent: "Team",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.HR_MANAGER,
    ],
  },
  {
    name: "Approvals",
    href: "/approvals",
    icon: ClipboardCheck,
    parent: "Team",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.DEPT_MANAGER,
      ROLES.PROJECT_MANAGER,
      ROLES.LINE_MANAGER,
    ],
  },

  // Human Resources Submenus
  {
    name: "Employee Directory",
    href: "/employees",
    icon: Users2,
    parent: "Human Resources",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  },
  {
    name: "Attendance Records",
    href: "/attendance",
    icon: Calendar,
    parent: "Human Resources",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.DEPT_MANAGER,
    ],
  },
  {
    name: "Leave Management",
    href: "/leaves",
    icon: FileCheck,
    parent: "Human Resources",
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.DEPT_MANAGER,
    ],
  },
  {
    name: "Recruitment",
    href: "/recruitment",
    icon: UserPlus,
    parent: "Human Resources",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  },
  {
    name: "Onboarding",
    href: "/onboarding",
    icon: HandHelping,
    parent: "Human Resources",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  },
  {
    name: "Offboarding",
    href: "/offboarding",
    icon: UserMinus,
    parent: "Human Resources",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  },
  {
    name: "Training",
    href: "/training",
    icon: GraduationCap,
    parent: "Human Resources",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  },
  {
    name: "Payroll",
    href: "/payroll",
    icon: DollarSign,
    parent: "Human Resources",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  },

  // Reports Submenus
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
  },
  {
    name: "Leave Reports",
    href: "/reports/leaves",
    icon: FileText,
    parent: "Reports",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER],
  },
  {
    name: "Financial Reports",
    href: "/reports/financial",
    icon: DollarSign,
    parent: "Reports",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
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
  },

  // System Submenus
  {
    name: "General Settings",
    href: "/settings/general",
    icon: Settings,
    parent: "System",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    name: "Profile Settings",
    href: "/settings/profile",
    icon: User,
    parent: "System",
    roles: ["all"],
  },
  {
    name: "Security Settings",
    href: "/settings/security",
    icon: ShieldCheck,
    parent: "System",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    name: "API Keys",
    href: "/api-keys",
    icon: Key,
    parent: "System",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    name: "Audit Logs",
    href: "/audit-logs",
    icon: Activity,
    parent: "System",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    name: "Workflow Builder",
    href: "/workflows",
    icon: Workflow,
    parent: "System",
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    name: "Backup",
    href: "/backup",
    icon: DatabaseBackup,
    parent: "System",
    roles: [ROLES.SUPER_ADMIN],
  },

  // Support Submenus
  {
    name: "Help Center",
    href: "/help",
    icon: HelpCircle,
    parent: "Support",
    roles: ["all"],
  },
  {
    name: "Documentation",
    href: "/docs",
    icon: BookOpen,
    parent: "Support",
    roles: ["all"],
  },
  {
    name: "API Documentation",
    href: "/api-docs",
    icon: Code,
    parent: "Support",
    roles: ["all"],
  },
  {
    name: "Support Tickets",
    href: "/support/tickets",
    icon: LifeBuoy,
    parent: "Support",
    roles: ["all"],
  },
  {
    name: "System Status",
    href: "/status",
    icon: Activity,
    parent: "Support",
    roles: ["all"],
  },
  {
    name: "Feedback",
    href: "/feedback",
    icon: MessageSquare,
    parent: "Support",
    roles: ["all"],
  },
  {
    name: "Changelog",
    href: "/changelog",
    icon: GitBranch,
    parent: "Support",
    roles: ["all"],
  },
  {
    name: "Roadmap",
    href: "/roadmap",
    icon: Rocket,
    parent: "Support",
    roles: ["all"],
  },
];
