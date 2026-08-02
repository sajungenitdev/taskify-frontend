// app/(dashboard)/help/api-docs/page.tsx
"use client";

import React, { useState } from "react";
import {
  Code,
  Terminal,
  Server,
  Database,
  Cloud,
  Shield,
  Lock,
  Key,
  User,
  Users,
  Mail,
  Settings,
  BookOpen,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Grid,
  List,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Sparkles,
  Zap,
  Rocket,
  Star,
  Award,
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Bell,
  Eye,
  EyeOff,
  X,
  Menu,
  Home,
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Clock,
  LogOut,
  Plus,
  Minus,
  Download,
  Upload,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronsLeft,
  ChevronsRight,
  FilterX,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  FileText,
  FolderOpen,
  HardDrive,
  Server as ServerIcon,
  Globe,
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  Wifi,
  Cpu,
  Shield as ShieldIcon,
  Lock as LockIcon,
  Key as KeyIcon,
  User as UserIcon,
  Users as UsersIcon,
  Mail as MailIcon,
  Settings as SettingsIcon,
  BookOpen as BookOpenIcon,
  HelpCircle as HelpCircleIcon,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { FaGithub, FaLinkedin, FaTwitterSquare } from "react-icons/fa";

// ============================================================
// TYPES
// ============================================================
interface Endpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  category: string;
  auth: boolean;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: string;
  }[];
  requestBody?: {
    type: string;
    required: boolean;
    properties: {
      name: string;
      type: string;
      description: string;
      required: boolean;
      example?: string;
    }[];
  };
  responses: {
    code: number;
    description: string;
    example?: string;
  }[];
  example?: string;
}

interface ApiCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

// ============================================================
// API CATEGORIES
// ============================================================
const CATEGORIES: ApiCategory[] = [
  { id: "auth", name: "Authentication", icon: Key, description: "User authentication and authorization", color: "purple" },
  { id: "users", name: "Users", icon: User, description: "User management and profiles", color: "blue" },
  { id: "tasks", name: "Tasks", icon: CheckSquare, description: "Task management operations", color: "green" },
  { id: "projects", name: "Projects", icon: FolderOpen, description: "Project management", color: "orange" },
  { id: "teams", name: "Teams", icon: Users, description: "Team management", color: "indigo" },
  { id: "departments", name: "Departments", icon: ServerIcon, description: "Department management", color: "red" },
  { id: "leaves", name: "Leaves", icon: Calendar, description: "Leave management", color: "pink" },
  { id: "settings", name: "Settings", icon: Settings, description: "System settings", color: "gray" },
  { id: "reports", name: "Reports", icon: BarChart3, description: "Reports and analytics", color: "teal" },
  { id: "notifications", name: "Notifications", icon: Bell, description: "Notification management", color: "yellow" },
];

// ============================================================
// API ENDPOINTS
// ============================================================
const ENDPOINTS: Endpoint[] = [
  // Auth Endpoints
  {
    id: "auth-login",
    method: "POST",
    path: "/auth/login",
    description: "Authenticate user and get access token",
    category: "auth",
    auth: false,
    requestBody: {
      type: "object",
      required: true,
      properties: [
        { name: "email", type: "string", description: "User email address", required: true, example: "john@example.com" },
        { name: "password", type: "string", description: "User password", required: true, example: "SecurePass123!" },
      ],
    },
    responses: [
      { code: 200, description: "Login successful", example: '{"success":true,"data":{"user":{...},"token":"jwt_token"}}' },
      { code: 401, description: "Invalid credentials", example: '{"success":false,"message":"Invalid credentials"}' },
    ],
  },
  {
    id: "auth-register",
    method: "POST",
    path: "/auth/register",
    description: "Register a new user",
    category: "auth",
    auth: false,
    requestBody: {
      type: "object",
      required: true,
      properties: [
        { name: "name", type: "string", description: "Full name", required: true, example: "John Doe" },
        { name: "email", type: "string", description: "Email address", required: true, example: "john@example.com" },
        { name: "password", type: "string", description: "Password (min 8 chars)", required: true, example: "SecurePass123!" },
        { name: "role", type: "string", description: "User role", required: false, example: "employee" },
      ],
    },
    responses: [
      { code: 201, description: "User registered successfully", example: '{"success":true,"data":{"user":{...}}}' },
      { code: 400, description: "Validation error", example: '{"success":false,"message":"Email already exists"}' },
    ],
  },
  {
    id: "auth-logout",
    method: "POST",
    path: "/auth/logout",
    description: "Logout user (invalidate token)",
    category: "auth",
    auth: true,
    responses: [
      { code: 200, description: "Logout successful", example: '{"success":true,"message":"Logged out"}' },
    ],
  },
  {
    id: "auth-me",
    method: "GET",
    path: "/auth/me",
    description: "Get current user profile",
    category: "auth",
    auth: true,
    responses: [
      { code: 200, description: "User profile retrieved", example: '{"success":true,"data":{"user":{...}}}' },
    ],
  },

  // User Endpoints
  {
    id: "users-get",
    method: "GET",
    path: "/users",
    description: "Get all users (admin only)",
    category: "users",
    auth: true,
    parameters: [
      { name: "page", type: "number", required: false, description: "Page number", example: "1" },
      { name: "limit", type: "number", required: false, description: "Items per page", example: "20" },
      { name: "search", type: "string", required: false, description: "Search by name or email" },
    ],
    responses: [
      { code: 200, description: "Users retrieved", example: '{"success":true,"data":{"users":[...],"total":100}}' },
    ],
  },
  {
    id: "users-get-one",
    method: "GET",
    path: "/users/:id",
    description: "Get user by ID",
    category: "users",
    auth: true,
    parameters: [
      { name: "id", type: "string", required: true, description: "User ID", example: "65f2a1b3c7d8e9f0a1b2c3d4" },
    ],
    responses: [
      { code: 200, description: "User retrieved", example: '{"success":true,"data":{"user":{...}}}' },
      { code: 404, description: "User not found", example: '{"success":false,"message":"User not found"}' },
    ],
  },
  {
    id: "users-update",
    method: "PUT",
    path: "/users/:id",
    description: "Update user profile",
    category: "users",
    auth: true,
    parameters: [
      { name: "id", type: "string", required: true, description: "User ID" },
    ],
    requestBody: {
      type: "object",
      required: true,
      properties: [
        { name: "name", type: "string", description: "Full name", required: false },
        { name: "email", type: "string", description: "Email address", required: false },
        { name: "role", type: "string", description: "User role", required: false },
        { name: "department", type: "string", description: "Department ID", required: false },
      ],
    },
    responses: [
      { code: 200, description: "User updated", example: '{"success":true,"data":{"user":{...}}}' },
      { code: 403, description: "Forbidden", example: '{"success":false,"message":"Access denied"}' },
    ],
  },

  // Tasks Endpoints
  {
    id: "tasks-get",
    method: "GET",
    path: "/tasks",
    description: "Get all tasks with filters",
    category: "tasks",
    auth: true,
    parameters: [
      { name: "status", type: "string", required: false, description: "Filter by status (pending|in-progress|completed|review)" },
      { name: "priority", type: "string", required: false, description: "Filter by priority (low|medium|high|urgent)" },
      { name: "assignee", type: "string", required: false, description: "Filter by assignee ID" },
      { name: "project", type: "string", required: false, description: "Filter by project ID" },
      { name: "page", type: "number", required: false, description: "Page number" },
      { name: "limit", type: "number", required: false, description: "Items per page" },
    ],
    responses: [
      { code: 200, description: "Tasks retrieved", example: '{"success":true,"data":{"tasks":[...],"total":50}}' },
    ],
  },
  {
    id: "tasks-create",
    method: "POST",
    path: "/tasks",
    description: "Create a new task",
    category: "tasks",
    auth: true,
    requestBody: {
      type: "object",
      required: true,
      properties: [
        { name: "title", type: "string", description: "Task title", required: true, example: "Complete project proposal" },
        { name: "description", type: "string", description: "Task description", required: false },
        { name: "priority", type: "string", description: "Task priority", required: true, example: "high" },
        { name: "assignee", type: "string", description: "Assignee user ID", required: true },
        { name: "project", type: "string", description: "Project ID", required: false },
        { name: "dueDate", type: "string", description: "Due date (ISO format)", required: false, example: "2024-12-31T23:59:59.000Z" },
      ],
    },
    responses: [
      { code: 201, description: "Task created", example: '{"success":true,"data":{"task":{...}}}' },
      { code: 400, description: "Validation error", example: '{"success":false,"message":"Title is required"}' },
    ],
  },
  {
    id: "tasks-update",
    method: "PUT",
    path: "/tasks/:id",
    description: "Update a task",
    category: "tasks",
    auth: true,
    parameters: [
      { name: "id", type: "string", required: true, description: "Task ID" },
    ],
    requestBody: {
      type: "object",
      required: true,
      properties: [
        { name: "title", type: "string", description: "Task title", required: false },
        { name: "status", type: "string", description: "Task status", required: false },
        { name: "priority", type: "string", description: "Task priority", required: false },
        { name: "assignee", type: "string", description: "Assignee user ID", required: false },
      ],
    },
    responses: [
      { code: 200, description: "Task updated", example: '{"success":true,"data":{"task":{...}}}' },
      { code: 404, description: "Task not found", example: '{"success":false,"message":"Task not found"}' },
    ],
  },
  {
    id: "tasks-delete",
    method: "DELETE",
    path: "/tasks/:id",
    description: "Delete a task",
    category: "tasks",
    auth: true,
    parameters: [
      { name: "id", type: "string", required: true, description: "Task ID" },
    ],
    responses: [
      { code: 200, description: "Task deleted", example: '{"success":true,"message":"Task deleted"}' },
      { code: 403, description: "Forbidden", example: '{"success":false,"message":"Access denied"}' },
    ],
  },

  // Projects Endpoints
  {
    id: "projects-get",
    method: "GET",
    path: "/projects",
    description: "Get all projects",
    category: "projects",
    auth: true,
    parameters: [
      { name: "status", type: "string", required: false, description: "Filter by status (active|completed|archived)" },
      { name: "page", type: "number", required: false, description: "Page number" },
    ],
    responses: [
      { code: 200, description: "Projects retrieved", example: '{"success":true,"data":{"projects":[...]}}' },
    ],
  },
  {
    id: "projects-create",
    method: "POST",
    path: "/projects",
    description: "Create a new project",
    category: "projects",
    auth: true,
    requestBody: {
      type: "object",
      required: true,
      properties: [
        { name: "name", type: "string", description: "Project name", required: true },
        { name: "description", type: "string", description: "Project description", required: false },
        { name: "team", type: "array", description: "Team member IDs", required: false },
        { name: "startDate", type: "string", description: "Start date", required: false },
        { name: "endDate", type: "string", description: "End date", required: false },
      ],
    },
    responses: [
      { code: 201, description: "Project created", example: '{"success":true,"data":{"project":{...}}}' },
    ],
  },

  // Leaves Endpoints
  {
    id: "leaves-get",
    method: "GET",
    path: "/leaves",
    description: "Get all leave requests",
    category: "leaves",
    auth: true,
    parameters: [
      { name: "status", type: "string", required: false, description: "Filter by status (pending|approved|rejected)" },
      { name: "userId", type: "string", required: false, description: "Filter by user ID" },
    ],
    responses: [
      { code: 200, description: "Leave requests retrieved", example: '{"success":true,"data":{"leaves":[...]}}' },
    ],
  },
  {
    id: "leaves-create",
    method: "POST",
    path: "/leaves",
    description: "Create a leave request",
    category: "leaves",
    auth: true,
    requestBody: {
      type: "object",
      required: true,
      properties: [
        { name: "type", type: "string", description: "Leave type (annual|sick|personal|other)", required: true },
        { name: "startDate", type: "string", description: "Start date", required: true },
        { name: "endDate", type: "string", description: "End date", required: true },
        { name: "reason", type: "string", description: "Reason for leave", required: false },
      ],
    },
    responses: [
      { code: 201, description: "Leave request created", example: '{"success":true,"data":{"leave":{...}}}' },
    ],
  },
];

// ============================================================
// METHOD COLORS
// ============================================================
const METHOD_COLORS = {
  GET: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  POST: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PUT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PATCH: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const METHOD_BG_COLORS = {
  GET: "bg-blue-50 dark:bg-blue-900/10",
  POST: "bg-green-50 dark:bg-green-900/10",
  PUT: "bg-yellow-50 dark:bg-yellow-900/10",
  DELETE: "bg-red-50 dark:bg-red-900/10",
  PATCH: "bg-purple-50 dark:bg-purple-900/10",
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const ApiDocsPage: React.FC = () => {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter endpoints
  const filteredEndpoints = ENDPOINTS.filter((endpoint) => {
    const matchesSearch = endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          endpoint.method.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || endpoint.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 3000);
  };

  const toggleEndpoint = (id: string) => {
    setExpandedEndpoint(expandedEndpoint === id ? null : id);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.icon || HelpCircle;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.color || "gray";
  };

  return (
    <div className="p-4 md:p-6 container mx-auto container">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">API Documentation</h1>
              <p className="text-indigo-100 text-sm">
                Complete reference for the Task Management System API
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/v1/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-indigo-600 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              OpenAPI Spec
            </a>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-indigo-100 text-xs">Total Endpoints</p>
            <p className="text-white text-xl font-bold">{ENDPOINTS.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-indigo-100 text-xs">Categories</p>
            <p className="text-white text-xl font-bold">{CATEGORIES.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-indigo-100 text-xs">GET Requests</p>
            <p className="text-blue-300 text-xl font-bold">{ENDPOINTS.filter(e => e.method === "GET").length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-indigo-100 text-xs">POST/PUT/DELETE</p>
            <p className="text-green-300 text-xl font-bold">{ENDPOINTS.filter(e => e.method !== "GET").length}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search endpoints by path, method, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All ({ENDPOINTS.length})
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? `bg-${category.color}-100 text-${category.color}-700 dark:bg-${category.color}-900/30 dark:text-${category.color}-400`
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {category.name} ({ENDPOINTS.filter(e => e.category === category.id).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Endpoints List */}
      {filteredEndpoints.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No endpoints found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEndpoints.map((endpoint) => {
            const CategoryIcon = getCategoryIcon(endpoint.category);
            const isExpanded = expandedEndpoint === endpoint.id;
            const color = getCategoryColor(endpoint.category);

            return (
              <div
                key={endpoint.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <button
                  onClick={() => toggleEndpoint(endpoint.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${METHOD_COLORS[endpoint.method]}`}>
                      {endpoint.method}
                    </span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white truncate">
                      {endpoint.path}
                    </span>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs bg-${color}-100 text-${color}-700 dark:bg-${color}-900/30 dark:text-${color}-400`}>
                        {CATEGORIES.find(c => c.id === endpoint.category)?.name}
                      </span>
                      {endpoint.auth && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          🔐 Auth
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-gray-400 hidden md:block">{endpoint.description}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="space-y-4">
                      {/* Description */}
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {endpoint.description}
                        </p>
                      </div>

                      {/* Parameters */}
                      {endpoint.parameters && endpoint.parameters.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Parameters</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                  <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Name</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Type</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Required</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Description</th>
                                  <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Example</th>
                                </tr>
                              </thead>
                              <tbody>
                                {endpoint.parameters.map((param) => (
                                  <tr key={param.name} className="border-b border-gray-100 dark:border-gray-700/50">
                                    <td className="py-2 px-3 font-mono text-gray-900 dark:text-white">{param.name}</td>
                                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{param.type}</td>
                                    <td className="py-2 px-3">
                                      {param.required ? (
                                        <span className="text-red-500">Required</span>
                                      ) : (
                                        <span className="text-gray-400">Optional</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{param.description}</td>
                                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400 font-mono">{param.example || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Request Body */}
                      {endpoint.requestBody && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Request Body</h4>
                          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {endpoint.requestBody.type}
                                {endpoint.requestBody.required && (
                                  <span className="text-red-500 ml-2">Required</span>
                                )}
                              </span>
                              <button
                                onClick={() => handleCopy(
                                  JSON.stringify(
                                    endpoint.requestBody?.properties.reduce((acc, p) => {
                                      acc[p.name] = p.example || `"${p.type}"`;
                                      return acc;
                                    }, {} as Record<string, string>),
                                    null,
                                    2
                                  ),
                                  `${endpoint.id}-body`
                                )}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                              >
                                {copiedId === `${endpoint.id}-body` ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                {copiedId === `${endpoint.id}-body` ? "Copied!" : "Copy"}
                              </button>
                            </div>
                            <div className="p-4 overflow-x-auto">
                              <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
{JSON.stringify(
  endpoint.requestBody.properties.reduce((acc, p) => {
    acc[p.name] = p.example || `"${p.type}"`;
    return acc;
  }, {} as Record<string, string>),
  null,
  2
)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Responses */}
                      {endpoint.responses && endpoint.responses.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Responses</h4>
                          <div className="space-y-2">
                            {endpoint.responses.map((response) => (
                              <div key={response.code} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                      response.code >= 200 && response.code < 300
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : response.code >= 400
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    }`}>
                                      {response.code}
                                    </span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{response.description}</span>
                                  </div>
                                  {response.example && (
                                    <button
                                      onClick={() => handleCopy(response.example!, `${endpoint.id}-response-${response.code}`)}
                                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                    >
                                      {copiedId === `${endpoint.id}-response-${response.code}` ? (
                                        <Check className="w-3 h-3" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                      {copiedId === `${endpoint.id}-response-${response.code}` ? "Copied!" : "Copy"}
                                    </button>
                                  )}
                                </div>
                                {response.example && (
                                  <div className="p-4 overflow-x-auto">
                                    <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
                                      {response.example}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Example */}
                      {endpoint.example && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Example</h4>
                          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Example Request</span>
                              <button
                                onClick={() => handleCopy(endpoint.example!, `${endpoint.id}-example`)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                              >
                                {copiedId === `${endpoint.id}-example` ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                {copiedId === `${endpoint.id}-example` ? "Copied!" : "Copy"}
                              </button>
                            </div>
                            <div className="p-4 overflow-x-auto">
                              <pre className="text-xs text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
                                {endpoint.example}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>All endpoints require authentication unless marked otherwise</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <FaGithub className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <FaTwitterSquare className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <FaLinkedin className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
          © {new Date().getFullYear()} Task Management System API • Version 1.0.0
        </p>
      </div>
    </div>
  );
};

export default ApiDocsPage;