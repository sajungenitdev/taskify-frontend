// app/(dashboard)/help/support/tickets/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Ticket,
    Plus,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    MessageCircle,
    Mail,
    Phone,
    User,
    Clock,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    AlertTriangle,
    Info,
    Send,
    Paperclip,
    Trash2,
    Edit,
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
    Plus as PlusIcon,
    Minus,
    Download,
    Upload,
    RefreshCw as RefreshIcon,
    ArrowRight,
    ChevronRight,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    FilterX,
    Loader2,
    Star,
    StarHalf,
    ThumbsUp,
    ThumbsDown,
    Flag,
    Share2,
    Bookmark,
    MoreVertical,
    MoreHorizontal,
    ExternalLink,
    Globe,
    Smartphone,
    Laptop,
    Monitor,
    Tablet,
    Wifi,
    Cpu,
    Shield,
    Lock,
    Key,
    Mail as MailIcon,
    Phone as PhoneIcon,
    MessageCircle as MessageIcon,
    User as UserIcon,
    Calendar as CalendarIcon2,
    Clock as ClockIcon2,
    AlertOctagon,
    Image,
    File,
    FileText,
    FileArchive,
} from "lucide-react";
import { apiService } from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

// ============================================================
// TYPES
// ============================================================
interface Ticket {
    id: string;
    _id?: string;
    ticketNumber: string;
    subject: string;
    description: string;
    category: "technical" | "billing" | "account" | "feature" | "other";
    priority: "low" | "medium" | "high" | "urgent";
    status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
    createdBy: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    assignedTo?: {
        id: string;
        name: string;
        email: string;
    };
    messages: TicketMessage[];
    attachments: {
        id: string;
        name: string;
        size: number;
        url: string;
    }[];
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    closedAt?: string;
    rating?: number;
    feedback?: string;
}

interface TicketMessage {
    id: string;
    message: string;
    isAdmin: boolean;
    userId: string;
    userName: string;
    userEmail: string;
    attachments: {
        id: string;
        name: string;
        size: number;
        url: string;
    }[];
    createdAt: string;
    readAt?: string;
}

interface TicketStats {
    total: number;
    open: number;
    inProgress: number;
    waiting: number;
    resolved: number;
    closed: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    satisfactionRate: number;
}

interface CreateTicketData {
    subject: string;
    description: string;
    category: Ticket["category"];
    priority: Ticket["priority"];
    attachments?: File[];
}

interface TicketFilter {
    search: string;
    status: string;
    priority: string;
    category: string;
    dateFrom: string;
    dateTo: string;
}

// ============================================================
// STATUS CONFIGURATION
// ============================================================
const STATUS_CONFIG = {
    open: { label: "Open", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: AlertCircle },
    in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
    waiting: { label: "Waiting", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: AlertTriangle },
    resolved: { label: "Resolved", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: CheckCircle },
    closed: { label: "Closed", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400", icon: XCircle },
};

const PRIORITY_CONFIG = {
    low: { label: "Low", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Info },
    medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: AlertCircle },
    high: { label: "High", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertTriangle },
    urgent: { label: "Urgent", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertOctagon },
};

const CATEGORY_CONFIG = {
    technical: { label: "Technical", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    billing: { label: "Billing", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    account: { label: "Account", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    feature: { label: "Feature Request", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
    other: { label: "Other", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400" },
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const SupportTicketsPage: React.FC = () => {
    const { user } = useAuth();

    // State
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<TicketStats | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyMessage, setReplyMessage] = useState("");
    const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
    const [createAttachments, setCreateAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
    
    const replyFileInputRef = useRef<HTMLInputElement>(null);
    const createFileInputRef = useRef<HTMLInputElement>(null);

    // Filter state
    const [filters, setFilters] = useState<TicketFilter>({
        search: "",
        status: "",
        priority: "",
        category: "",
        dateFrom: "",
        dateTo: "",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    // Create ticket form
    const [createForm, setCreateForm] = useState<CreateTicketData>({
        subject: "",
        description: "",
        category: "other",
        priority: "medium",
        attachments: [],
    });

    // ============================================================
    // FETCH DATA
    // ============================================================
    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search: filters.search,
                status: filters.status,
                priority: filters.priority,
                category: filters.category,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
            });

            const response = await apiService.get<{
                tickets: Ticket[];
                stats: TicketStats;
                pagination: { total: number; totalPages: number };
            }>(`/support/tickets?${params}`);

            if (response.success) {
                // Map tickets to ensure id is set
                const mappedTickets = (response.data.tickets || []).map(ticket => ({
                    ...ticket,
                    id: ticket.id || ticket._id || ticket.ticketNumber,
                }));
                setTickets(mappedTickets);
                setStats(response.data.stats || null);
                setPagination((prev) => ({
                    ...prev,
                    total: response.data.pagination?.total || 0,
                    totalPages: response.data.pagination?.totalPages || 0,
                }));
            }
        } catch (error: any) {
            console.error("Error fetching tickets:", error);
            toast.error(error.message || "Failed to load tickets");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // ============================================================
    // HANDLERS
    // ============================================================
    const getTicketId = (ticket: Ticket): string => {
        return ticket.id || ticket._id || "";
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleCreateFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            const maxSize = 5 * 1024 * 1024; // 5MB
            const validFiles = fileArray.filter(file => file.size <= maxSize);
            
            if (validFiles.length !== fileArray.length) {
                toast.warning("Some files exceed 5MB limit and were skipped");
            }
            
            setCreateAttachments([...createAttachments, ...validFiles]);
        }
        if (createFileInputRef.current) {
            createFileInputRef.current.value = "";
        }
    };

    const handleReplyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            const maxSize = 5 * 1024 * 1024; // 5MB
            const validFiles = fileArray.filter(file => file.size <= maxSize);
            
            if (validFiles.length !== fileArray.length) {
                toast.warning("Some files exceed 5MB limit and were skipped");
            }
            
            setReplyAttachments([...replyAttachments, ...validFiles]);
        }
        if (replyFileInputRef.current) {
            replyFileInputRef.current.value = "";
        }
    };

    const removeCreateAttachment = (index: number) => {
        setCreateAttachments(attachments => attachments.filter((_, i) => i !== index));
    };

    const removeReplyAttachment = (index: number) => {
        setReplyAttachments(attachments => attachments.filter((_, i) => i !== index));
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.subject.trim() || !createForm.description.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setIsSubmitting(true);
            
            const formData = new FormData();
            formData.append("subject", createForm.subject);
            formData.append("description", createForm.description);
            formData.append("category", createForm.category);
            formData.append("priority", createForm.priority);
            
            createAttachments.forEach((file) => {
                formData.append("attachments", file);
            });

            const response = await apiService.post("/support/tickets", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            
            if (response.success) {
                toast.success("Ticket created successfully!");
                setShowCreateModal(false);
                setCreateForm({
                    subject: "",
                    description: "",
                    category: "other",
                    priority: "medium",
                    attachments: [],
                });
                setCreateAttachments([]);
                await fetchTickets();
            }
        } catch (error: any) {
            console.error("Error creating ticket:", error);
            toast.error(error.message || "Failed to create ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReply = async () => {
        if (!replyMessage.trim() && replyAttachments.length === 0) {
            toast.error("Please enter a message or attach a file");
            return;
        }

        if (!selectedTicket) {
            toast.error("No ticket selected");
            return;
        }

        const ticketId = getTicketId(selectedTicket);
        if (!ticketId) {
            toast.error("Invalid ticket ID");
            return;
        }

        try {
            setIsSubmitting(true);
            
            const formData = new FormData();
            formData.append("message", replyMessage);
            replyAttachments.forEach((file) => {
                formData.append("attachments", file);
            });

            const response = await apiService.post(
                `/support/tickets/${ticketId}/reply`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            
            if (response.success) {
                toast.success("Reply sent successfully!");
                setReplyMessage("");
                setReplyAttachments([]);
                setShowReplyModal(false);
                await fetchTickets();
            }
        } catch (error: any) {
            console.error("Error sending reply:", error);
            toast.error(error.message || "Failed to send reply");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseTicket = async (ticket: Ticket) => {
        const ticketId = getTicketId(ticket);
        if (!ticketId) {
            toast.error("Invalid ticket ID");
            return;
        }
        
        if (!confirm("Are you sure you want to close this ticket?")) return;

        try {
            const response = await apiService.put(`/support/tickets/${ticketId}/close`);
            if (response.success) {
                toast.success("Ticket closed successfully");
                await fetchTickets();
            }
        } catch (error: any) {
            console.error("Error closing ticket:", error);
            toast.error(error.message || "Failed to close ticket");
        }
    };

    const handleReopenTicket = async (ticket: Ticket) => {
        const ticketId = getTicketId(ticket);
        if (!ticketId) {
            toast.error("Invalid ticket ID");
            return;
        }

        try {
            const response = await apiService.put(`/support/tickets/${ticketId}/reopen`);
            if (response.success) {
                toast.success("Ticket reopened successfully");
                await fetchTickets();
            }
        } catch (error: any) {
            console.error("Error reopening ticket:", error);
            toast.error(error.message || "Failed to reopen ticket");
        }
    };

    const handleRateTicket = async (ticket: Ticket, rating: number, feedback?: string) => {
        const ticketId = getTicketId(ticket);
        if (!ticketId) {
            toast.error("Invalid ticket ID");
            return;
        }

        try {
            const response = await apiService.post(`/support/tickets/${ticketId}/rate`, {
                rating,
                feedback,
            });
            if (response.success) {
                toast.success("Thank you for your feedback!");
                await fetchTickets();
            }
        } catch (error: any) {
            console.error("Error rating ticket:", error);
            toast.error(error.message || "Failed to submit rating");
        }
    };

    const toggleTicketExpand = (ticketId: string) => {
        setExpandedTickets((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(ticketId)) {
                newSet.delete(ticketId);
            } else {
                newSet.add(ticketId);
            }
            return newSet;
        });
    };

    const getStatusConfig = (status: string) => {
        return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
    };

    const getPriorityConfig = (priority: string) => {
        return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
    };

    const getCategoryLabel = (category: string) => {
        return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.label || category;
    };

    const getCategoryColor = (category: string) => {
        return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.color || "bg-gray-100 text-gray-700";
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

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
            return Image;
        } else if (['pdf'].includes(ext)) {
            return FileText;
        } else if (['zip', 'rar', '7z'].includes(ext)) {
            return FileArchive;
        } else {
            return File;
        }
    };

    // ============================================================
    // RENDER LOADING
    // ============================================================
    if (loading && tickets.length === 0) {
        return (
            <div className="p-6 container mx-auto">
                <div className="animate-pulse space-y-6">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    // ============================================================
    // MAIN RENDER
    // ============================================================
    return (
        <div className="p-4 md:p-6 container mx-auto max-w-6xl">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                            <Ticket className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Support Tickets</h1>
                            <p className="text-purple-100 text-sm">
                                Manage and track your support requests
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-white text-purple-600 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Ticket
                    </button>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-purple-100 text-xs">Total Tickets</p>
                            <p className="text-white text-xl font-bold">{stats.total}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-purple-100 text-xs">Open</p>
                            <p className="text-green-300 text-xl font-bold">{stats.open}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-purple-100 text-xs">In Progress</p>
                            <p className="text-blue-300 text-xl font-bold">{stats.inProgress}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-purple-100 text-xs">Resolution Time</p>
                            <p className="text-white text-xl font-bold">{stats.averageResolutionTime}h</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={filters.search}
                            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {Object.values(filters).some((v) => v) && (
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                    </button>

                    <button
                        onClick={fetchTickets}
                        className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {/* Filter dropdowns... (same as before) */}
                    </div>
                )}
            </div>

            {/* Tickets List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {tickets.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                            <Ticket className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Tickets Found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            Create your first support ticket to get help
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create Ticket
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tickets.map((ticket) => {
                            const StatusIcon = getStatusConfig(ticket.status).icon;
                            const PriorityIcon = getPriorityConfig(ticket.priority).icon;
                            const isExpanded = expandedTickets.has(ticket.id);
                            const ticketId = getTicketId(ticket);

                            return (
                                <div key={ticketId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="p-4">
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-3">
                                                    <button
                                                        onClick={() => toggleTicketExpand(ticketId)}
                                                        className="mt-1"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </button>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                                {ticket.subject}
                                                            </h3>
                                                            <span className="text-xs text-gray-400 font-mono">
                                                                #{ticket.ticketNumber}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                                            {ticket.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusConfig(ticket.status).color}`}>
                                                                <StatusIcon className="w-3 h-3" />
                                                                {getStatusConfig(ticket.status).label}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityConfig(ticket.priority).color}`}>
                                                                <PriorityIcon className="w-3 h-3" />
                                                                {getPriorityConfig(ticket.priority).label}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                                                                {getCategoryLabel(ticket.category)}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                {formatRelativeTime(ticket.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket(ticket);
                                                        setShowReplyModal(true);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                        ticket.status === "closed" || ticket.status === "resolved"
                                                            ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                                                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                                                    }`}
                                                    disabled={ticket.status === "closed" || ticket.status === "resolved"}
                                                >
                                                    <MessageCircle className="w-4 h-4 inline mr-1" />
                                                    Reply
                                                </button>
                                                {ticket.status !== "closed" && ticket.status !== "resolved" && (
                                                    <button
                                                        onClick={() => handleCloseTicket(ticket)}
                                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="Close ticket"
                                                    >
                                                        <XCircle className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                                    </button>
                                                )}
                                                {ticket.status === "closed" && (
                                                    <button
                                                        onClick={() => handleReopenTicket(ticket)}
                                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="Reopen ticket"
                                                    >
                                                        <RefreshCw className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="mt-4 pl-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">
                                                            <span className="font-medium">Created:</span> {formatDate(ticket.createdAt)}
                                                        </p>
                                                        {ticket.resolvedAt && (
                                                            <p className="text-gray-500 dark:text-gray-400">
                                                                <span className="font-medium">Resolved:</span> {formatDate(ticket.resolvedAt)}
                                                            </p>
                                                        )}
                                                        {ticket.closedAt && (
                                                            <p className="text-gray-500 dark:text-gray-400">
                                                                <span className="font-medium">Closed:</span> {formatDate(ticket.closedAt)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        {ticket.assignedTo && (
                                                            <p className="text-gray-500 dark:text-gray-400">
                                                                <span className="font-medium">Assigned to:</span> {ticket.assignedTo.name}
                                                            </p>
                                                        )}
                                                        <p className="text-gray-500 dark:text-gray-400">
                                                            <span className="font-medium">Messages:</span> {ticket.messages.length}
                                                        </p>
                                                        {ticket.rating && (
                                                            <p className="text-gray-500 dark:text-gray-400">
                                                                <span className="font-medium">Rating:</span> {'⭐'.repeat(ticket.rating)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Messages Preview */}
                                                {ticket.messages.length > 0 && (
                                                    <div className="mt-3 space-y-2">
                                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Recent Messages</p>
                                                        {ticket.messages.slice(-3).map((msg) => (
                                                            <div key={msg.id} className={`p-2 rounded-lg text-sm ${
                                                                msg.isAdmin
                                                                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                                                                    : "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                                                            }`}>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-medium">{msg.userName}</span>
                                                                    <span className="text-xs text-gray-400">{formatRelativeTime(msg.createdAt)}</span>
                                                                </div>
                                                                <p className="mt-1">{msg.message}</p>
                                                                {msg.attachments && msg.attachments.length > 0 && (
                                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                                        {msg.attachments.map((att, idx) => {
                                                                            const FileIcon = getFileIcon(att.name);
                                                                            return (
                                                                                <a
                                                                                    key={idx}
                                                                                    href={att.url}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                                                                >
                                                                                    <FileIcon className="w-3 h-3" />
                                                                                    {att.name}
                                                                                </a>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                                    <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Support Ticket</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">We'll get back to you as soon as possible</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Brief description of your issue"
                                    value={createForm.subject}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, subject: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Describe your issue in detail"
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                    <select
                                        value={createForm.category}
                                        onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value as any }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                    >
                                        <option value="technical">Technical</option>
                                        <option value="billing">Billing</option>
                                        <option value="account">Account</option>
                                        <option value="feature">Feature Request</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                    <select
                                        value={createForm.priority}
                                        onChange={(e) => setCreateForm((prev) => ({ ...prev, priority: e.target.value as any }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            {/* File Upload for Create */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Attachments <span className="text-xs text-gray-400">(Max 5MB per file)</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={createFileInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleCreateFileSelect}
                                        className="hidden"
                                        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => createFileInputRef.current?.click()}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 flex items-center gap-2"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                        Add Files
                                    </button>
                                </div>

                                {/* Attachment List */}
                                {createAttachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {createAttachments.map((file, index) => {
                                            const FileIcon = getFileIcon(file.name);
                                            return (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <FileIcon className="w-4 h-4 text-blue-500" />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                                                            {file.name}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            ({formatFileSize(file.size)})
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCreateAttachment(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setCreateAttachments([]);
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    {isSubmitting ? "Creating..." : "Create Ticket"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reply Modal */}
            {showReplyModal && selectedTicket && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                                    <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reply to Ticket</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        #{selectedTicket.ticketNumber} - {selectedTicket.subject}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowReplyModal(false);
                                    setReplyMessage("");
                                    setReplyAttachments([]);
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Ticket Info */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm">
                                <p className="text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Status:</span> {getStatusConfig(selectedTicket.status).label}
                                </p>
                                <p className="text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Priority:</span> {getPriorityConfig(selectedTicket.priority).label}
                                </p>
                            </div>

                            {/* Messages */}
                            <div className="max-h-48 overflow-y-auto space-y-3">
                                {selectedTicket.messages.map((msg) => (
                                    <div key={msg.id} className={`p-3 rounded-xl text-sm ${
                                        msg.isAdmin
                                            ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                                            : "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{msg.userName}</span>
                                            <span className="text-xs text-gray-400">{formatRelativeTime(msg.createdAt)}</span>
                                        </div>
                                        <p className="mt-1">{msg.message}</p>
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {msg.attachments.map((att, idx) => {
                                                    const FileIcon = getFileIcon(att.name);
                                                    return (
                                                        <a
                                                            key={idx}
                                                            href={att.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                                        >
                                                            <FileIcon className="w-3 h-3" />
                                                            {att.name}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Reply Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Your Message
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Type your reply here..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all resize-none"
                                />
                            </div>

                            {/* File Upload for Reply */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Attachments <span className="text-xs text-gray-400">(Max 5MB per file)</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={replyFileInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleReplyFileSelect}
                                        className="hidden"
                                        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => replyFileInputRef.current?.click()}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 flex items-center gap-2"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                        Add Files
                                    </button>
                                </div>

                                {/* Attachment List */}
                                {replyAttachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {replyAttachments.map((file, index) => {
                                            const FileIcon = getFileIcon(file.name);
                                            return (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <FileIcon className="w-4 h-4 text-blue-500" />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                                                            {file.name}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            ({formatFileSize(file.size)})
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeReplyAttachment(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setShowReplyModal(false);
                                    setReplyMessage("");
                                    setReplyAttachments([]);
                                }}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReply}
                                disabled={isSubmitting || (!replyMessage.trim() && replyAttachments.length === 0)}
                                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                {isSubmitting ? "Sending..." : "Send Reply"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportTicketsPage;