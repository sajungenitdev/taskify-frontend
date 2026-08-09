// app/(dashboard)/product-roadmap/page.tsx
"use client";

import React, { useState } from "react";
import {
  Rocket,
  Sparkles,
  Zap,
  Star,
  CheckCircle,
  Clock,
  Calendar,
  Target,
  Flag,
  Trophy,
  Medal,
  Crown,
  Award,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  Menu,
  Home,
  LayoutDashboard,
  Users,
  Calendar as CalendarIcon,
  CheckSquare,
  Clock as ClockIcon,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
  Minus,
  Download,
  Upload,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  Grid,
  List,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  Flag as FlagIcon,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Merge,
  Code,
  Terminal,
  Database,
  Cloud,
  Smartphone,
  Laptop,
  Monitor,
  Globe,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";

// ============================================================
// TYPES
// ============================================================
interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: "planned" | "in_progress" | "completed" | "released";
  priority: "low" | "medium" | "high" | "critical";
  category: "feature" | "improvement" | "bug_fix" | "infrastructure";
  quarter: string;
  year: number;
  progress: number;
  votes: number;
  comments: number;
  tags: string[];
  team: string[];
  releaseDate?: string;
  image?: string;
  icon: React.ElementType;
  color: string;
}

interface RoadmapStats {
  totalItems: number;
  completed: number;
  inProgress: number;
  planned: number;
  totalVotes: number;
  averageProgress: number;
}

// ============================================================
// ROADMAP DATA
// ============================================================
const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    id: "1",
    title: "AI-Powered Task Automation",
    description: "Intelligent task suggestions and automated workflow optimization using machine learning.",
    status: "in_progress",
    priority: "high",
    category: "feature",
    quarter: "Q3",
    year: 2024,
    progress: 40,
    votes: 89,
    comments: 23,
    tags: ["AI", "Automation", "Machine Learning"],
    team: ["Engineering", "AI/ML"],
    releaseDate: "2024-09-15",
    icon: Sparkles,
    color: "purple",
  },
  {
    id: "2",
    title: "Real-time Collaboration Hub",
    description: "Live collaboration features including co-editing, real-time comments, and activity feeds.",
    status: "in_progress",
    priority: "high",
    category: "feature",
    quarter: "Q3",
    year: 2024,
    progress: 85,
    votes: 67,
    comments: 18,
    tags: ["Collaboration", "Real-time", "Team"],
    team: ["Engineering", "Design"],
    releaseDate: "2024-10-01",
    icon: Users,
    color: "blue",
  },
  {
    id: "3",
    title: "Advanced Analytics Dashboard",
    description: "Comprehensive analytics with custom reports, data visualization, and team performance metrics.",
    status: "completed",
    priority: "medium",
    category: "feature",
    quarter: "Q2",
    year: 2024,
    progress: 100,
    votes: 56,
    comments: 12,
    tags: ["Analytics", "Reporting", "Dashboard"],
    team: ["Engineering", "Data"],
    releaseDate: "2024-06-30",
    icon: BarChart3,
    color: "green",
  },
  {
    id: "4",
    title: "Mobile App - iOS & Android",
    description: "Native mobile applications for iOS and Android with offline support and push notifications.",
    status: "planned",
    priority: "high",
    category: "feature",
    quarter: "Q4",
    year: 2024,
    progress: 0,
    votes: 120,
    comments: 45,
    tags: ["Mobile", "iOS", "Android"],
    team: ["Engineering", "Mobile"],
    releaseDate: "2024-12-15",
    icon: Smartphone,
    color: "orange",
  },
  {
    id: "5",
    title: "Performance Optimization",
    description: "Significant performance improvements including faster load times, optimized queries, and caching.",
    status: "completed",
    priority: "critical",
    category: "infrastructure",
    quarter: "Q2",
    year: 2024,
    progress: 100,
    votes: 45,
    comments: 8,
    tags: ["Performance", "Optimization", "Infrastructure"],
    team: ["Engineering"],
    releaseDate: "2024-06-15",
    icon: Zap,
    color: "yellow",
  },
  {
    id: "6",
    title: "Custom Workflow Builder",
    description: "Drag-and-drop workflow builder allowing teams to create custom automation and approval processes.",
    status: "planned",
    priority: "medium",
    category: "feature",
    quarter: "Q4",
    year: 2024,
    progress: 10,
    votes: 78,
    comments: 34,
    tags: ["Workflow", "Automation", "Customization"],
    team: ["Engineering", "Design"],
    releaseDate: "2024-11-30",
    icon: GitBranch,
    color: "pink",
  },
  {
    id: "7",
    title: "Enhanced Security & Compliance",
    description: "Advanced security features including 2FA, SSO, audit logs, and GDPR compliance tools.",
    status: "in_progress",
    priority: "critical",
    category: "infrastructure",
    quarter: "Q3",
    year: 2024,
    progress: 90,
    votes: 34,
    comments: 6,
    tags: ["Security", "Compliance", "2FA", "SSO"],
    team: ["Engineering", "Security"],
    releaseDate: "2024-08-30",
    icon: Lock,
    color: "red",
  },
  {
    id: "8",
    title: "Integration Marketplace",
    description: "A marketplace for third-party integrations including Slack, GitHub, Jira, and more.",
    status: "planned",
    priority: "medium",
    category: "feature",
    quarter: "Q1",
    year: 2025,
    progress: 0,
    votes: 92,
    comments: 28,
    tags: ["Integrations", "Marketplace", "API"],
    team: ["Engineering", "Partnerships"],
    releaseDate: "2025-03-15",
    icon: Cloud,
    color: "indigo",
  },
];

// ============================================================
// STATS
// ============================================================
const getStats = (items: RoadmapItem[]): RoadmapStats => {
  const totalItems = items.length;
  const completed = items.filter(i => i.status === "completed").length;
  const inProgress = items.filter(i => i.status === "in_progress").length;
  const planned = items.filter(i => i.status === "planned").length;
  const totalVotes = items.reduce((sum, i) => sum + i.votes, 0);
  const averageProgress = Math.round(items.reduce((sum, i) => sum + i.progress, 0) / totalItems);

  return {
    totalItems,
    completed,
    inProgress,
    planned,
    totalVotes,
    averageProgress,
  };
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const ProductRoadmapPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const stats = getStats(ROADMAP_ITEMS);

  // Filter items
  const filteredItems = ROADMAP_ITEMS.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Status counts for filter badges
  const statusCounts = {
    all: ROADMAP_ITEMS.length,
    planned: ROADMAP_ITEMS.filter(i => i.status === "planned").length,
    in_progress: ROADMAP_ITEMS.filter(i => i.status === "in_progress").length,
    completed: ROADMAP_ITEMS.filter(i => i.status === "completed").length,
    released: ROADMAP_ITEMS.filter(i => i.status === "released").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "released":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "in_progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "planned":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "released":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Activity className="w-4 h-4" />;
      case "planned":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "high":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "feature":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "improvement":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "bug_fix":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "infrastructure":
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const handleVote = (itemId: string) => {
    toast.success("Vote recorded! Thanks for your feedback.");
  };

  const handleComment = (itemId: string) => {
    toast.error("Comments section coming soon!");
  };

  const handleShare = (itemId: string) => {
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="p-4 md:p-6 container mx-auto container">
      {/* Header */}
      <div className="bg-linear-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Product Roadmap</h1>
              <p className="text-indigo-100 text-sm">
                See what we're building and what's coming next
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-colors ${
                viewMode === "grid"
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl transition-colors ${
                viewMode === "list"
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-indigo-100 text-xs">Total Features</p>
            <p className="text-white text-xl font-bold">{stats.totalItems}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-indigo-100 text-xs">Completed</p>
            <p className="text-green-300 text-xl font-bold">{stats.completed}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-indigo-100 text-xs">In Progress</p>
            <p className="text-blue-300 text-xl font-bold">{stats.inProgress}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-indigo-100 text-xs">Planned</p>
            <p className="text-yellow-300 text-xl font-bold">{stats.planned}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-indigo-100 text-xs">Avg. Progress</p>
            <p className="text-white text-xl font-bold">{stats.averageProgress}%</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search roadmap items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filterStatus === "all"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setFilterStatus("planned")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filterStatus === "planned"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Planned ({statusCounts.planned})
            </button>
            <button
              onClick={() => setFilterStatus("in_progress")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filterStatus === "in_progress"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              In Progress ({statusCounts.in_progress})
            </button>
            <button
              onClick={() => setFilterStatus("completed")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filterStatus === "completed"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Completed ({statusCounts.completed})
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filterCategory === "all"
                ? "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All Categories
          </button>
          <button
            onClick={() => setFilterCategory("feature")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filterCategory === "feature"
                ? "bg-purple-200 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            🚀 Features
          </button>
          <button
            onClick={() => setFilterCategory("improvement")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filterCategory === "improvement"
                ? "bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            ⚡ Improvements
          </button>
          <button
            onClick={() => setFilterCategory("bug_fix")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filterCategory === "bug_fix"
                ? "bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            🐛 Bug Fixes
          </button>
          <button
            onClick={() => setFilterCategory("infrastructure")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filterCategory === "infrastructure"
                ? "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            🏗️ Infrastructure
          </button>
        </div>
      </div>

      {/* Roadmap Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No results found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search or filters
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-xl bg-${item.color}-50 dark:bg-${item.color}-900/20`}>
                      <Icon className={`w-5 h-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1">{item.status.replace("_", " ").charAt(0).toUpperCase() + item.status.slice(1)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 bg-linear-to-r from-${item.color}-500 to-${item.color}-600`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.quarter} {item.year}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVote(item.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{item.votes}</span>
                      </button>
                      <button
                        onClick={() => handleComment(item.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{item.comments}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Click to expand */}
                <div
                  onClick={() => {
                    setSelectedItem(item);
                    setShowDetails(true);
                  }}
                  className="px-5 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 text-center text-sm text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  View Details
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quarter
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Votes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setShowDetails(true);
                    }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg bg-${item.color}-50 dark:bg-${item.color}-900/20`}>
                          <item.icon className={`w-4 h-4 text-${item.color}-600 dark:text-${item.color}-400`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.description.substring(0, 60)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span>{item.status.replace("_", " ")}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[80px]">
                          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-linear-to-r from-${item.color}-500 to-${item.color}-600`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {item.quarter} {item.year}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(item.id);
                        }}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors justify-end"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{item.votes}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-${selectedItem.color}-50 dark:bg-${selectedItem.color}-900/20`}>
                  <selectedItem.icon className={`w-6 h-6 text-${selectedItem.color}-600 dark:text-${selectedItem.color}-400`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedItem.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedItem.status)}`}>
                      {getStatusIcon(selectedItem.status)}
                      <span>{selectedItem.status.replace("_", " ")}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedItem.priority)}`}>
                      {selectedItem.priority.charAt(0).toUpperCase() + selectedItem.priority.slice(1)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(selectedItem.category)}`}>
                      {selectedItem.category.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                {selectedItem.description}
              </p>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Progress</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 bg-linear-to-r from-${selectedItem.color}-500 to-${selectedItem.color}-600`}
                        style={{ width: `${selectedItem.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedItem.progress}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Release Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedItem.releaseDate ? new Date(selectedItem.releaseDate).toLocaleDateString() : "TBD"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Team</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedItem.team.join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleVote(selectedItem.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Vote ({selectedItem.votes})</span>
                </button>
                <button
                  onClick={() => handleComment(selectedItem.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Comment ({selectedItem.comments})</span>
                </button>
                <button
                  onClick={() => handleShare(selectedItem.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductRoadmapPage;