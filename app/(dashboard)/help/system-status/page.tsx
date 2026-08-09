// app/(dashboard)/help/system-status/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Activity,
    Server,
    Database,
    Cloud,
    Shield,
    CheckCircle,
    XCircle,
    AlertCircle,
    AlertTriangle,
    Clock,
    RefreshCw,
    Download,
    Upload,
    Wifi,
    Cpu,
    HardDrive,
    Globe,
    Smartphone,
    Laptop,
    Monitor,
    Tablet,
    Zap,
    Sparkles,
    TrendingUp,
    BarChart3,
    PieChart,
    Users,
    Calendar,
    CheckSquare,
    Clock as ClockIcon,
    Settings,
    HelpCircle,
    LogOut,
    Plus,
    Minus,
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
    Database as DatabaseIcon,
    Cloud as CloudIcon,
    Server as ServerIcon,
    Shield as ShieldIcon,
    Activity as ActivityIcon,
    Wifi as WifiIcon,
    Cpu as CpuIcon,
    HardDrive as HardDriveIcon,
    Globe as GlobeIcon,
    Smartphone as SmartphoneIcon,
    Laptop as LaptopIcon,
    Monitor as MonitorIcon,
    Tablet as TabletIcon,
    Bell,

} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/axios";
import toast from "react-hot-toast";
import { GrStatusInfo } from "react-icons/gr";

// ============================================================
// TYPES
// ============================================================
interface SystemStatus {
    status: "operational" | "degraded" | "partial_outage" | "major_outage";
    uptime: number;
    message: string;
    lastUpdated: string;
    services: ServiceStatus[];
    incidents: Incident[];
    metrics: SystemMetrics;
}

interface ServiceStatus {
    id: string;
    name: string;
    description: string;
    status: "operational" | "degraded" | "partial_outage" | "major_outage";
    uptime: number;
    responseTime: number;
    lastChecked: string;
    icon: React.ElementType;
    history: {
        timestamp: string;
        status: "operational" | "degraded" | "partial_outage" | "major_outage";
    }[];
}

interface Incident {
    id: string;
    title: string;
    description: string;
    status: "investigating" | "identified" | "monitoring" | "resolved";
    severity: "minor" | "major" | "critical";
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    updates: {
        timestamp: string;
        message: string;
        status: string;
    }[];
}

interface SystemMetrics {
    cpu: number;
    memory: number;
    disk: number;
    network: {
        in: number;
        out: number;
    };
    activeUsers: number;
    requestsPerMinute: number;
    errorRate: number;
    responseTime: number;
}

// ============================================================
// MOCK DATA
// ============================================================
const MOCK_STATUS: SystemStatus = {
    status: "operational",
    uptime: 99.98,
    message: "All systems are operational",
    lastUpdated: new Date().toISOString(),
    services: [
        {
            id: "api",
            name: "API Server",
            description: "REST API endpoints",
            status: "operational",
            uptime: 99.99,
            responseTime: 45,
            lastChecked: new Date().toISOString(),
            icon: Server,
            history: [],
        },
        {
            id: "database",
            name: "Database",
            description: "MongoDB cluster",
            status: "operational",
            uptime: 99.97,
            responseTime: 12,
            lastChecked: new Date().toISOString(),
            icon: Database,
            history: [],
        },
        {
            id: "auth",
            name: "Authentication",
            description: "User authentication service",
            status: "operational",
            uptime: 99.99,
            responseTime: 34,
            lastChecked: new Date().toISOString(),
            icon: Shield,
            history: [],
        },
        {
            id: "storage",
            name: "File Storage",
            description: "Upload and file storage",
            status: "operational",
            uptime: 99.95,
            responseTime: 78,
            lastChecked: new Date().toISOString(),
            icon: HardDrive,
            history: [],
        },
        {
            id: "notifications",
            name: "Notifications",
            description: "Email and push notifications",
            status: "degraded",
            uptime: 98.5,
            responseTime: 156,
            lastChecked: new Date().toISOString(),
            icon: Bell,
            history: [],
        },
        {
            id: "ai",
            name: "AI Service",
            description: "AI and machine learning",
            status: "operational",
            uptime: 99.87,
            responseTime: 234,
            lastChecked: new Date().toISOString(),
            icon: Cpu,
            history: [],
        },
    ],
    incidents: [
        {
            id: "inc-1",
            title: "Database connection issues",
            description: "Some users experienced intermittent database connection issues",
            status: "resolved",
            severity: "major",
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            resolvedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            updates: [
                {
                    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                    message: "Investigating reports of database connection issues",
                    status: "investigating",
                },
                {
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    message: "Identified the issue - high connection pool usage",
                    status: "identified",
                },
                {
                    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    message: "Monitoring the fix",
                    status: "monitoring",
                },
                {
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    message: "Issue resolved. All systems operational.",
                    status: "resolved",
                },
            ],
        },
        {
            id: "inc-2",
            title: "Notification service delayed",
            description: "Email notifications are experiencing delays of up to 5 minutes",
            status: "monitoring",
            severity: "minor",
            createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            updates: [
                {
                    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                    message: "Investigating notification delays",
                    status: "investigating",
                },
                {
                    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
                    message: "Found the issue, applying fix",
                    status: "identified",
                },
                {
                    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                    message: "Fix applied, monitoring",
                    status: "monitoring",
                },
            ],
        },
    ],
    metrics: {
        cpu: 45,
        memory: 62,
        disk: 38,
        network: {
            in: 1250,
            out: 890,
        },
        activeUsers: 234,
        requestsPerMinute: 1250,
        errorRate: 0.23,
        responseTime: 42,
    },
};

// ============================================================
// STATUS CONFIG
// ============================================================
const STATUS_CONFIG = {
    operational: {
        label: "Operational",
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        border: "border-green-400",
        icon: CheckCircle,
    },
    degraded: {
        label: "Degraded",
        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        border: "border-yellow-400",
        icon: AlertTriangle,
    },
    partial_outage: {
        label: "Partial Outage",
        color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        border: "border-orange-400",
        icon: AlertCircle,
    },
    major_outage: {
        label: "Major Outage",
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        border: "border-red-400",
        icon: XCircle,
    },
};

const INCIDENT_STATUS_CONFIG = {
    investigating: {
        label: "Investigating",
        color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        icon: AlertCircle,
    },
    identified: {
        label: "Identified",
        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: AlertTriangle,
    },
    monitoring: {
        label: "Monitoring",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        icon: Activity,
    },
    resolved: {
        label: "Resolved",
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        icon: CheckCircle,
    },
};

const SEVERITY_CONFIG = {
    minor: { label: "Minor", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    major: { label: "Major", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    critical: { label: "Critical", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};
const ICON_MAP: Record<string, React.ElementType> = {
    Server: Server,
    Database: Database,
    Shield: Shield,
    HardDrive: HardDrive,
    Bell: Bell,
    Cpu: Cpu,
    // Add more as needed
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const SystemStatusPage: React.FC = () => {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [selectedService, setSelectedService] = useState<ServiceStatus | null>(null);
    const [showServiceDetails, setShowServiceDetails] = useState(false);
    const [expandedIncidents, setExpandedIncidents] = useState<Set<string>>(new Set());

    // ============================================================
    // FETCH DATA
    // ============================================================
    // app/(dashboard)/help/system-status/page.tsx

const fetchSystemStatus = useCallback(async () => {
    try {
        setLoading(true);
        try {
            const response = await apiService.get<SystemStatus>("/system/status");
            if (response.success) {
                setSystemStatus(response.data);
                return;
            }
        } catch (error: any) {
            if (error.status !== 404) {
                console.error("Error fetching system status:", error);
            }
        }
        
        setSystemStatus(MOCK_STATUS);
    } catch (error: any) {
        console.error("Error fetching system status:", error);
        setSystemStatus(MOCK_STATUS);
    } finally {
        setLoading(false);
    }
}, []);

    useEffect(() => {
        fetchSystemStatus();
        // Refresh every 30 seconds
        const interval = setInterval(fetchSystemStatus, 30000);
        return () => clearInterval(interval);
    }, [fetchSystemStatus]);

    // ============================================================
    // HANDLERS
    // ============================================================
    const toggleIncidentExpand = (incidentId: string) => {
        setExpandedIncidents((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(incidentId)) {
                newSet.delete(incidentId);
            } else {
                newSet.add(incidentId);
            }
            return newSet;
        });
    };

    const getStatusConfig = (status: string) => {
        return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.operational;
    };

    const getIncidentStatusConfig = (status: string) => {
        return INCIDENT_STATUS_CONFIG[status as keyof typeof INCIDENT_STATUS_CONFIG] || INCIDENT_STATUS_CONFIG.investigating;
    };

    const getSeverityConfig = (severity: string) => {
        return SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.minor;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString();
    };

    const formatRelativeTime = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        const diff = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

        if (diff < 1) return "Just now";
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        if (diff < 43200) return `${Math.floor(diff / 1440)}d ago`;
        return `${Math.floor(diff / 43200)}mo ago`;
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    // ============================================================
    // RENDER LOADING
    // ============================================================
    if (loading) {
        return (
            <div className="p-6 container mx-auto max-w-6xl">
                <div className="animate-pulse space-y-6">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (!systemStatus) return null;

    const overallStatus = getStatusConfig(systemStatus.status);

    return (
        <div className="p-4 md:p-6 container mx-auto max-w-6xl">
            {/* Header */}
            <div className="bg-linear-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">System Status</h1>
                            <p className="text-blue-100 text-sm">
                                Real-time status of all system services
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${overallStatus.color}`}>
                            <overallStatus.icon className="w-4 h-4" />
                            {overallStatus.label}
                        </span>
                        <button
                            onClick={fetchSystemStatus}
                            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Uptime */}
                <div className="mt-4 flex items-center gap-4 text-blue-100">
                    <span className="text-sm">Uptime: {systemStatus.uptime}%</span>
                    <span className="text-sm">•</span>
                    <span className="text-sm">Updated: {formatRelativeTime(systemStatus.lastUpdated)}</span>
                    <span className="text-sm">•</span>
                    <span className="text-sm">{systemStatus.message}</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">Active Users</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {systemStatus.metrics.activeUsers}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs">Requests/min</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {systemStatus.metrics.requestsPerMinute}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">Avg Response</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {systemStatus.metrics.responseTime}ms
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">Error Rate</span>
                    </div>
                    <p className={`text-2xl font-bold mt-1 ${systemStatus.metrics.errorRate > 1 ? "text-red-500" : "text-green-500"}`}>
                        {systemStatus.metrics.errorRate}%
                    </p>
                </div>
            </div>

            {/* System Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CPU</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{systemStatus.metrics.cpu}%</span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${systemStatus.metrics.cpu > 80 ? "bg-red-500" :
                                systemStatus.metrics.cpu > 60 ? "bg-yellow-500" : "bg-green-500"
                                }`}
                            style={{ width: `${systemStatus.metrics.cpu}%` }}
                        />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Memory</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{systemStatus.metrics.memory}%</span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${systemStatus.metrics.memory > 80 ? "bg-red-500" :
                                systemStatus.metrics.memory > 60 ? "bg-yellow-500" : "bg-green-500"
                                }`}
                            style={{ width: `${systemStatus.metrics.memory}%` }}
                        />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Disk</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{systemStatus.metrics.disk}%</span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${systemStatus.metrics.disk > 80 ? "bg-red-500" :
                                systemStatus.metrics.disk > 60 ? "bg-yellow-500" : "bg-green-500"
                                }`}
                            style={{ width: `${systemStatus.metrics.disk}%` }}
                        />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Network</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            ↓{formatBytes(systemStatus.metrics.network.in)} ↑{formatBytes(systemStatus.metrics.network.out)}
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>In: {formatBytes(systemStatus.metrics.network.in)}/s</span>
                        <span>•</span>
                        <span>Out: {formatBytes(systemStatus.metrics.network.out)}/s</span>
                    </div>
                </div>
            </div>

            {/* Services Status */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Services Status</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {systemStatus.services.map((service) => {
                        const ServiceIcon = ICON_MAP[service.icon as string] || Server;
                        const status = getStatusConfig(service.status);
                        return (
                            <div
                                key={service.id}
                                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                onClick={() => {
                                    setSelectedService(service);
                                    setShowServiceDetails(true);
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${status.color}`}>
                                            <ServiceIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{service.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                <status.icon className="w-3 h-3" />
                                                {status.label}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {service.responseTime}ms • {service.uptime}% uptime
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Incidents */}
            {systemStatus.incidents.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Incidents</h2>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {systemStatus.incidents.map((incident) => {
                            const incidentStatus = getIncidentStatusConfig(incident.status);
                            const severity = getSeverityConfig(incident.severity);
                            const isExpanded = expandedIncidents.has(incident.id);

                            return (
                                <div key={incident.id} className="px-6 py-4">
                                    <div
                                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                                        onClick={() => toggleIncidentExpand(incident.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-1.5 rounded-lg ${severity.color}`}>
                                                <AlertCircle className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{incident.title}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{incident.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${incidentStatus.color}`}>
                                                        <incidentStatus.icon className="w-3 h-3" />
                                                        {incidentStatus.label}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${severity.color}`}>
                                                        {severity.label}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {formatRelativeTime(incident.createdAt)}
                                                    </span>
                                                    {incident.resolvedAt && (
                                                        <span className="text-xs text-green-500">Resolved</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">
                                                Updated {formatRelativeTime(incident.updatedAt)}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="mt-4 pl-10 space-y-3">
                                            {incident.updates.map((update, index) => (
                                                <div key={index} className="flex items-start gap-3">
                                                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {update.status.charAt(0).toUpperCase() + update.status.slice(1)}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                {formatRelativeTime(update.timestamp)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                                            {update.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Service Details Modal */}
            {showServiceDetails && selectedService && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${getStatusConfig(selectedService.status).color}`}>
                                    <selectedService.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {selectedService.name}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {selectedService.description}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowServiceDetails(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <XCircle className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusConfig(selectedService.status).color}`}>
                                        <GrStatusInfo className="w-3 h-3" />
                                        {getStatusConfig(selectedService.status).label}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Uptime</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {selectedService.uptime}%
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Response Time</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {selectedService.responseTime}ms
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Checked</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatRelativeTime(selectedService.lastChecked)}
                                    </p>
                                </div>
                            </div>

                            {selectedService.history && selectedService.history.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">History</h4>
                                    <div className="space-y-2">
                                        {selectedService.history.map((entry, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {formatRelativeTime(entry.timestamp)}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusConfig(entry.status).color}`}>
                                                    <GrStatusInfo className="w-3 h-3" />
                                                    {getStatusConfig(entry.status).label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowServiceDetails(false)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemStatusPage;