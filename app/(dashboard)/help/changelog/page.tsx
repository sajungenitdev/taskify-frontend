// app/(dashboard)/changelog/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    Sparkles,
    Zap,
    Star,
    CheckCircle,
    Clock,
    Calendar,
    Rocket,
    Gift,
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
    Settings as SettingsIcon,
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
    Flag,
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
    Twitter,
    Github,
    Linkedin,
    Youtube,
    ExternalLink,
    Bug,
    Shield,
    Server,
    Cpu,
    HardDrive,
    Wifi,
    Zap as ZapIcon,
    Flame,
    Lightbulb,
    Target,
    Rocket as RocketIcon,
    Sparkles as SparklesIcon,
    AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";

// ============================================================
// TYPES
// ============================================================
interface Release {
    id: string;
    version: string;
    title: string;
    date: string;
    type: "major" | "minor" | "patch" | "hotfix" | "beta";
    status: "released" | "coming_soon" | "in_progress";
    description: string;
    highlights: string[];
    features: {
        new: string[];
        improved: string[];
        fixed: string[];
        deprecated: string[];
    };
    contributors: string[];
    downloads?: number;
    isNew: boolean;
}

// ============================================================
// RELEASE DATA
// ============================================================
const RELEASES: Release[] = [
    {
        id: "1",
        version: "v2.4.0",
        title: "AI-Powered Intelligence",
        date: "2024-08-15",
        type: "minor",
        status: "released",
        isNew: true,
        description: "Introducing AI-powered features that transform how you work. Smart task suggestions, automated workflows, and intelligent insights.",
        highlights: [
            "AI task suggestions based on your work patterns",
            "Automated workflow optimization",
            "Smart deadline predictions",
            "Intelligent project recommendations"
        ],
        features: {
            new: [
                "AI Task Assistant - Get smart suggestions for task prioritization",
                "Automated Workflow Builder - Let AI create optimal workflows",
                "Smart Analytics - AI-powered insights and predictions",
                "Intelligent Search - Find anything instantly with semantic search"
            ],
            improved: [
                "Dashboard performance improved by 40%",
                "Task management UI redesigned for better usability",
                "Project templates now include AI recommendations",
                "Notification system now smarter and more relevant"
            ],
            fixed: [
                "Fixed issue with task duplication in project views",
                "Resolved notification delivery delays",
                "Fixed calendar sync errors",
                "Addressed performance issues in large projects"
            ],
            deprecated: [
                "Old task import system (replaced with AI-powered import)",
                "Legacy reporting engine (moved to new analytics)"
            ]
        },
        contributors: ["Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson"],
        downloads: 1247
    },
    {
        id: "2",
        version: "v2.3.0",
        title: "Collaboration Hub",
        date: "2024-07-20",
        type: "minor",
        status: "released",
        isNew: false,
        description: "Real-time collaboration features that bring your team together. Co-edit tasks, instant messaging, and team activity feeds.",
        highlights: [
            "Real-time task co-editing",
            "Team activity feeds",
            "Instant messaging and mentions",
            "File sharing and previews"
        ],
        features: {
            new: [
                "Real-time Collaboration - Edit tasks together with your team",
                "Team Activity Feed - See what everyone is working on",
                "Instant Messaging - Chat with team members in real-time",
                "File Sharing - Upload and preview files directly in tasks"
            ],
            improved: [
                "Comment system redesigned for better context",
                "Task history now shows real-time updates",
                "Team member presence indicators",
                "Improved notification system"
            ],
            fixed: [
                "Fixed comment threading issues",
                "Resolved file upload errors",
                "Fixed activity feed duplication",
                "Addressed notification delays"
            ],
            deprecated: []
        },
        contributors: ["Eve Brown", "Frank Wilson", "Grace Lee"],
        downloads: 982
    },
    {
        id: "3",
        version: "v2.2.0",
        title: "Analytics & Insights",
        date: "2024-06-10",
        type: "minor",
        status: "released",
        isNew: false,
        description: "Comprehensive analytics dashboard with custom reports, team performance metrics, and actionable insights.",
        highlights: [
            "Interactive analytics dashboard",
            "Custom report builder",
            "Team performance metrics",
            "Data export capabilities"
        ],
        features: {
            new: [
                "Analytics Dashboard - Visualize your team's performance",
                "Custom Reports - Build reports tailored to your needs",
                "Performance Metrics - Track team productivity and progress",
                "Data Export - Export analytics data in multiple formats"
            ],
            improved: [
                "Dashboard load time improved by 50%",
                "Report generation now faster",
                "Data visualization enhanced",
                "Export options expanded"
            ],
            fixed: [
                "Fixed report generation errors",
                "Resolved data synchronization issues",
                "Fixed dashboard widget rendering",
                "Addressed performance issues"
            ],
            deprecated: []
        },
        contributors: ["Ivy Martinez", "Jack Anderson"],
        downloads: 756
    },
    {
        id: "4",
        version: "v2.1.0",
        title: "Mobile Experience",
        date: "2024-05-15",
        type: "minor",
        status: "released",
        isNew: false,
        description: "Native mobile applications for iOS and Android with offline support, push notifications, and seamless sync.",
        highlights: [
            "iOS and Android native apps",
            "Offline mode with sync",
            "Push notifications",
            "Biometric authentication"
        ],
        features: {
            new: [
                "iOS App - Available on the App Store",
                "Android App - Available on Google Play",
                "Offline Mode - Work without an internet connection",
                "Push Notifications - Stay updated on the go"
            ],
            improved: [
                "Mobile UI optimized for touch",
                "Sync performance improved",
                "Battery optimization",
                "Network handling improved"
            ],
            fixed: [
                "Fixed login issues on older devices",
                "Resolved sync conflicts",
                "Fixed notification delivery",
                "Addressed crash issues"
            ],
            deprecated: []
        },
        contributors: ["Peter Garcia", "Quinn Lee", "Rachel Park"],
        downloads: 643
    },
    {
        id: "5",
        version: "v2.0.0",
        title: "Major Redesign",
        date: "2024-04-01",
        type: "major",
        status: "released",
        isNew: false,
        description: "Complete redesign of the platform with improved user experience, better performance, and new features.",
        highlights: [
            "Complete UI redesign",
            "Improved performance and speed",
            "Enhanced user experience",
            "New navigation and layout"
        ],
        features: {
            new: [
                "New Design - Fresh, modern UI design",
                "Improved Navigation - Better organization and structure",
                "Dark Mode - Support for dark theme",
                "Keyboard Shortcuts - Boost your productivity"
            ],
            improved: [
                "Page load speed improved by 60%",
                "Reduced bundle size by 40%",
                "Optimized images and assets",
                "Better accessibility"
            ],
            fixed: [
                "Fixed all known bugs and issues",
                "Resolved performance bottlenecks",
                "Fixed cross-browser compatibility",
                "Addressed security vulnerabilities"
            ],
            deprecated: [
                "Old UI components (replaced with new design)",
                "Legacy navigation system"
            ]
        },
        contributors: ["Sarah Kim", "Tom Brown", "Uma Patel"],
        downloads: 2341
    },
    {
        id: "6",
        version: "v1.5.0",
        title: "Security & Compliance",
        date: "2024-03-01",
        type: "patch",
        status: "released",
        isNew: false,
        description: "Enhanced security features including two-factor authentication, single sign-on, and GDPR compliance tools.",
        highlights: [
            "Two-factor authentication",
            "Single Sign-On (SSO)",
            "GDPR compliance tools",
            "Advanced audit logs"
        ],
        features: {
            new: [
                "Two-Factor Authentication - Enhanced account security",
                "Single Sign-On - Integrate with your identity provider",
                "Audit Logs - Comprehensive activity tracking",
                "Data Privacy Tools - GDPR compliance features"
            ],
            improved: [
                "Security protocols updated",
                "Authentication flow improved",
                "Password policy strengthened",
                "Session management enhanced"
            ],
            fixed: [
                "Fixed security vulnerabilities",
                "Resolved login issues",
                "Fixed session timeout problems",
                "Addressed password reset issues"
            ],
            deprecated: []
        },
        contributors: ["Victor Chen", "Wendy Zhang"],
        downloads: 534
    },
    {
        id: "7",
        version: "v1.4.0",
        title: "Performance Optimization",
        date: "2024-02-01",
        type: "patch",
        status: "released",
        isNew: false,
        description: "Major performance improvements with faster load times, optimized database queries, and better caching.",
        highlights: [
            "50% faster page loads",
            "Optimized database queries",
            "Improved caching strategy",
            "Better mobile performance"
        ],
        features: {
            new: [
                "Performance Dashboard - Monitor your app's performance",
                "Optimized Database Queries - Faster data retrieval",
                "Intelligent Caching - Improved response times",
                "Mobile Performance - Optimized for mobile devices"
            ],
            improved: [
                "Page load time reduced by 50%",
                "API response time improved by 35%",
                "Database query optimization",
                "Asset loading optimized"
            ],
            fixed: [
                "Fixed memory leaks",
                "Resolved database connection issues",
                "Fixed caching problems",
                "Addressed performance bottlenecks"
            ],
            deprecated: []
        },
        contributors: ["Alice Johnson", "Bob Smith"],
        downloads: 423
    }
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const ChangelogPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [filterType, setFilterType] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"list" | "cards">("list");

    // Filter releases
    const filteredReleases = RELEASES.filter((release) => {
        const matchesSearch = release.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            release.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
            release.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === "all" || release.type === filterType;
        return matchesSearch && matchesType;
    });

    // Sort releases by date (newest first)
    const sortedReleases = [...filteredReleases].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const getTypeColor = (type: string) => {
        switch (type) {
            case "major":
                return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
            case "minor":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "patch":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "hotfix":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            case "beta":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "major":
                return <RocketIcon className="w-4 h-4" />;
            case "minor":
                return <SparklesIcon className="w-4 h-4" />;
            case "patch":
                return <CheckCircle className="w-4 h-4" />;
            case "hotfix":
                return <Flame className="w-4 h-4" />;
            case "beta":
                return <Lightbulb className="w-4 h-4" />;
            default:
                return <Gift className="w-4 h-4" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "released":
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">Released</span>;
            case "coming_soon":
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-medium">Coming Soon</span>;
            case "in_progress":
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">In Progress</span>;
            default:
                return null;
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getTypeCounts = () => {
        const counts: Record<string, number> = { all: RELEASES.length };
        const types = ["major", "minor", "patch", "hotfix", "beta"];
        types.forEach(type => {
            counts[type] = RELEASES.filter(r => r.type === type).length;
        });
        return counts;
    };

    const typeCounts = getTypeCounts();

    return (
        <div className="p-4 md:p-6 container mx-auto container">
            {/* Header */}
            <div className="bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                            <Rocket className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Changelog</h1>
                            <p className="text-green-100 text-sm">
                                Track all updates, improvements, and new features
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-xl transition-colors ${viewMode === "list"
                                    ? "bg-white/20 text-white"
                                    : "text-white/60 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("cards")}
                            className={`p-2 rounded-xl transition-colors ${viewMode === "cards"
                                    ? "bg-white/20 text-white"
                                    : "text-white/60 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-green-100 text-xs">Total Releases</p>
                        <p className="text-white text-xl font-bold">{RELEASES.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-green-100 text-xs">Major</p>
                        <p className="text-purple-300 text-xl font-bold">{RELEASES.filter(r => r.type === "major").length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-green-100 text-xs">Minor</p>
                        <p className="text-blue-300 text-xl font-bold">{RELEASES.filter(r => r.type === "minor").length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-green-100 text-xs">Patches</p>
                        <p className="text-green-300 text-xl font-bold">{RELEASES.filter(r => r.type === "patch").length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                        <p className="text-green-100 text-xs">Hotfixes</p>
                        <p className="text-red-300 text-xl font-bold">{RELEASES.filter(r => r.type === "hotfix").length}</p>
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
                            placeholder="Search changelog..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setFilterType("all")}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterType === "all"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            All ({typeCounts.all})
                        </button>
                        <button
                            onClick={() => setFilterType("major")}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterType === "major"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            Major ({typeCounts.major})
                        </button>
                        <button
                            onClick={() => setFilterType("minor")}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterType === "minor"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            Minor ({typeCounts.minor})
                        </button>
                        <button
                            onClick={() => setFilterType("patch")}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterType === "patch"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            Patches ({typeCounts.patch})
                        </button>
                        <button
                            onClick={() => setFilterType("hotfix")}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterType === "hotfix"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            Hotfixes ({typeCounts.hotfix})
                        </button>
                        <button
                            onClick={() => setFilterType("beta")}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterType === "beta"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            Beta ({typeCounts.beta})
                        </button>
                    </div>
                </div>
            </div>

            {/* Releases */}
            {sortedReleases.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No releases found</h3>
                    <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
                </div>
            ) : viewMode === "list" ? (
                <div className="space-y-4">
                    {sortedReleases.map((release) => (
                        <div
                            key={release.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
                        >
                            <div className="p-5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2.5 rounded-xl bg-${release.type === 'major' ? 'purple' : release.type === 'minor' ? 'blue' : release.type === 'patch' ? 'green' : release.type === 'hotfix' ? 'red' : 'yellow'}-50 dark:bg-${release.type === 'major' ? 'purple' : release.type === 'minor' ? 'blue' : release.type === 'patch' ? 'green' : release.type === 'hotfix' ? 'red' : 'yellow'}-900/20`}>
                                            {getTypeIcon(release.type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {release.version}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(release.type)}`}>
                                                    {release.type.charAt(0).toUpperCase() + release.type.slice(1)}
                                                </span>
                                                {release.isNew && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium animate-pulse">
                                                        New!
                                                    </span>
                                                )}
                                                {getStatusBadge(release.status)}
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                                                {release.title}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    <Calendar className="w-3 h-3 inline mr-1" />
                                                    {formatDate(release.date)}
                                                </span>
                                                {release.downloads && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        <Download className="w-3 h-3 inline mr-1" />
                                                        {release.downloads} downloads
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedRelease(release);
                                            setShowDetails(true);
                                        }}
                                        className="text-sm text-green-600 dark:text-green-400 hover:underline whitespace-nowrap flex items-center gap-1"
                                    >
                                        View Details <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mt-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {release.description}
                                    </p>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-1">
                                    {release.highlights.slice(0, 3).map((highlight, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400"
                                        >
                                            ✦ {highlight}
                                        </span>
                                    ))}
                                    {release.highlights.length > 3 && (
                                        <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                                            +{release.highlights.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedReleases.map((release) => (
                        <div
                            key={release.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2.5 rounded-xl bg-${release.type === 'major' ? 'purple' : release.type === 'minor' ? 'blue' : release.type === 'patch' ? 'green' : release.type === 'hotfix' ? 'red' : 'yellow'}-50 dark:bg-${release.type === 'major' ? 'purple' : release.type === 'minor' ? 'blue' : release.type === 'patch' ? 'green' : release.type === 'hotfix' ? 'red' : 'yellow'}-900/20`}>
                                        {getTypeIcon(release.type)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {release.isNew && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium animate-pulse">
                                                New!
                                            </span>
                                        )}
                                        {getStatusBadge(release.status)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {release.version}
                                    </h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(release.type)}`}>
                                        {release.type.charAt(0).toUpperCase() + release.type.slice(1)}
                                    </span>
                                </div>

                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    {release.title}
                                </h4>

                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {release.description}
                                </p>

                                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                    <span>
                                        <Calendar className="w-3 h-3 inline mr-1" />
                                        {formatDate(release.date)}
                                    </span>
                                    {release.downloads && (
                                        <span>
                                            <Download className="w-3 h-3 inline mr-1" />
                                            {release.downloads}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-3 flex flex-wrap gap-1">
                                    {release.highlights.slice(0, 2).map((highlight, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400"
                                        >
                                            ✦ {highlight.length > 20 ? highlight.substring(0, 20) + '...' : highlight}
                                        </span>
                                    ))}
                                    {release.highlights.length > 2 && (
                                        <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                                            +{release.highlights.length - 2}
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedRelease(release);
                                        setShowDetails(true);
                                    }}
                                    className="mt-4 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    View Full Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {showDetails && selectedRelease && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedRelease.version}
                                    </h2>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedRelease.type)}`}>
                                        {selectedRelease.type.charAt(0).toUpperCase() + selectedRelease.type.slice(1)}
                                    </span>
                                    {selectedRelease.isNew && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium animate-pulse">
                                            New!
                                        </span>
                                    )}
                                    {getStatusBadge(selectedRelease.status)}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                                    {selectedRelease.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    <span>
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        {formatDate(selectedRelease.date)}
                                    </span>
                                    {selectedRelease.downloads && (
                                        <span>
                                            <Download className="w-4 h-4 inline mr-1" />
                                            {selectedRelease.downloads} downloads
                                        </span>
                                    )}
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
                                {selectedRelease.description}
                            </p>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Highlights</h4>
                                <ul className="space-y-1">
                                    {selectedRelease.highlights.map((highlight, index) => (
                                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                            <Sparkles className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            {highlight}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {selectedRelease.features.new.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">✨ New Features</h4>
                                    <ul className="space-y-1">
                                        {selectedRelease.features.new.map((feature, index) => (
                                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                                <Plus className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedRelease.features.improved.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">⚡ Improvements</h4>
                                    <ul className="space-y-1">
                                        {selectedRelease.features.improved.map((improvement, index) => (
                                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                                <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                {improvement}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedRelease.features.fixed.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🐛 Bug Fixes</h4>
                                    <ul className="space-y-1">
                                        {selectedRelease.features.fixed.map((fix, index) => (
                                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                                <Bug className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                {fix}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedRelease.features.deprecated.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">⚠️ Deprecated</h4>
                                    <ul className="space-y-1">
                                        {selectedRelease.features.deprecated.map((item, index) => (
                                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">👥 Contributors</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedRelease.contributors.map((contributor, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                                        >
                                            {contributor}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${selectedRelease.version} - ${selectedRelease.title}`);
                                    toast.success("Release info copied to clipboard!");
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChangelogPage;