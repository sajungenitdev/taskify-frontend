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
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    AlertTriangle,
    Info,
    Send,
    Paperclip,
    Trash2,
    X,
    Loader2,
    Star,
    Download,
    AlertOctagon,
    Image as ImageIcon,
    File,
    FileText,
    FileArchive,
    ArrowLeft,
    ArrowRight,
    ChevronsLeft,
    ChevronsRight,
    FilterX,
    ExternalLink,
} from "lucide-react";
import { apiService } from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

// ============================================================
// TYPES
// ============================================================
interface TicketAttachment {
    id?: string;
    _id?: string;
    name?: string;
    filename?: string;
    size?: number;
    url?: string;
    path?: string;
}

interface TicketMessage {
    id?: string;
    _id?: string;
    message: string;
    isAdmin: boolean;
    userId: string;
    userName: string;
    userEmail: string;
    attachments?: TicketAttachment[] | string[];
    createdAt: string;
    readAt?: string;
}

interface SupportTicket {
    id?: string;
    _id?: string;
    ticketNumber: string;
    subject: string;
    description: string;
    category: "technical" | "billing" | "account" | "feature" | "other";
    priority: "low" | "medium" | "high" | "urgent";
    status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
    createdBy?: {
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
    attachments?: TicketAttachment[] | string[];
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    closedAt?: string;
    rating?: number;
    feedback?: string;
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
    category: SupportTicket["category"];
    priority: SupportTicket["priority"];
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
// STATUS & PRIORITY CONFIGURATION
// ============================================================
const STATUS_CONFIG = {
    open: { label: "Open", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: AlertCircle },
    in_progress: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Clock },
    waiting: { label: "Waiting", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: AlertTriangle },
    resolved: { label: "Resolved", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: CheckCircle },
    closed: { label: "Closed", color: "text-slate-600", bg: "bg-slate-100 border-slate-200", icon: XCircle },
};

const PRIORITY_CONFIG = {
    low: { label: "Low", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Info },
    medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: AlertCircle },
    high: { label: "High", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: AlertTriangle },
    urgent: { label: "Urgent", color: "text-rose-700", bg: "bg-rose-50 border-rose-200", icon: AlertOctagon },
};

const CATEGORY_CONFIG = {
    technical: { label: "Technical", bg: "bg-purple-50 text-purple-700 border-purple-200" },
    billing: { label: "Billing", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    account: { label: "Account", bg: "bg-blue-50 text-blue-700 border-blue-200" },
    feature: { label: "Feature", bg: "bg-pink-50 text-pink-700 border-pink-200" },
    other: { label: "Other", bg: "bg-slate-100 text-slate-700 border-slate-200" },
};

// ============================================================
// ATTACHMENT NORMALIZATION HELPER
// ============================================================
const normalizeAttachment = (att: any) => {
    if (!att) return null;

    if (typeof att === "string") {
        const fileName = att.split("/").pop()?.split("?")[0] || "Attachment";
        // Check if it's an image by extension
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(fileName);
        return {
            name: fileName,
            url: att,
            size: 0,
            isImage,
        };
    }

    const rawUrl = att.url || att.path || att.secure_url || "";
    const name = att.name || att.filename || att.originalname || rawUrl.split("/").pop()?.split("?")[0] || "Attachment";
    const size = att.size || att.bytes || 0;

    // Check if it's an image by extension
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name) ||
        /^image\//.test(att.mimetype || att.type || "");

    return {
        name,
        url: rawUrl,
        size,
        isImage,
    };
};

export default function SupportTicketsPage() {
    const { user } = useAuth();

    // State
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [stats, setStats] = useState<TicketStats | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);

    // Forms & Attachments
    const [replyMessage, setReplyMessage] = useState("");
    const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
    const [createAttachments, setCreateAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());

    // Rating State
    const [selectedRating, setSelectedRating] = useState<number>(5);
    const [ratingFeedback, setRatingFeedback] = useState<string>("");

    const replyFileInputRef = useRef<HTMLInputElement>(null);
    const createFileInputRef = useRef<HTMLInputElement>(null);

    // Filters State
    const [filters, setFilters] = useState<TicketFilter>({
        search: "",
        status: "",
        priority: "",
        category: "",
        dateFrom: "",
        dateTo: "",
    });
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    const [createForm, setCreateForm] = useState<CreateTicketData>({
        subject: "",
        description: "",
        category: "technical",
        priority: "medium",
    });

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(filters.search);
            setPagination((prev) => ({ ...prev, page: 1 }));
        }, 300);
        return () => clearTimeout(handler);
    }, [filters.search]);

    // ============================================================
    // FETCH TICKETS & STATS
    // ============================================================
    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append("page", pagination.page.toString());
            params.append("limit", pagination.limit.toString());

            if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
            if (filters.status) params.append("status", filters.status);
            if (filters.priority) params.append("priority", filters.priority);
            if (filters.category) params.append("category", filters.category);
            if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
            if (filters.dateTo) params.append("dateTo", filters.dateTo);

            const response = await apiService.get<{
                tickets: SupportTicket[];
                stats: TicketStats;
                pagination: { total: number; totalPages: number };
            }>(`/support/tickets?${params.toString()}`);

            if (response && (response.success || (response as any).data)) {
                const payload = (response as any).data || response;
                const mappedTickets = (payload.tickets || []).map((ticket: any) => ({
                    ...ticket,
                    id: ticket.id || ticket._id || ticket.ticketNumber,
                    messages: ticket.messages || [],
                }));

                setTickets(mappedTickets);
                if (payload.stats) setStats(payload.stats);
                setPagination((prev) => ({
                    ...prev,
                    total: payload.pagination?.total || mappedTickets.length,
                    totalPages:
                        payload.pagination?.totalPages ||
                        Math.ceil((payload.pagination?.total || mappedTickets.length) / pagination.limit) ||
                        1,
                }));
            }
        } catch (error: any) {
            console.error("Error fetching tickets:", error);
            toast.error(error.message || "Failed to load support tickets");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, debouncedSearch, filters.status, filters.priority, filters.category, filters.dateFrom, filters.dateTo]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // ============================================================
    // HANDLERS
    // ============================================================
    const getTicketId = (ticket: SupportTicket): string => {
        return ticket.id || ticket._id || ticket.ticketNumber || "";
    };

    const formatFileSize = (bytes?: number): string => {
        if (!bytes || bytes === 0) return "0 B";
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
            const validFiles = fileArray.filter((file) => file.size <= maxSize);

            if (validFiles.length !== fileArray.length) {
                toast.error("Some files exceed the 5MB size limit and were excluded");
            }

            setCreateAttachments((prev) => [...prev, ...validFiles]);
        }
        if (createFileInputRef.current) createFileInputRef.current.value = "";
    };

    const handleReplyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            const maxSize = 5 * 1024 * 1024;
            const validFiles = fileArray.filter((file) => file.size <= maxSize);

            if (validFiles.length !== fileArray.length) {
                toast.error("Some files exceed the 5MB size limit and were excluded");
            }

            setReplyAttachments((prev) => [...prev, ...validFiles]);
        }
        if (replyFileInputRef.current) replyFileInputRef.current.value = "";
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

            if (response && (response.success || (response as any).data)) {
                toast.success("Ticket created successfully!");
                setShowCreateModal(false);
                setCreateForm({
                    subject: "",
                    description: "",
                    category: "technical",
                    priority: "medium",
                });
                setCreateAttachments([]);
                fetchTickets();
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

        if (!selectedTicket) return;
        const ticketId = getTicketId(selectedTicket);

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append("message", replyMessage);
            replyAttachments.forEach((file) => {
                formData.append("attachments", file);
            });

            const response = await apiService.post(`/support/tickets/${ticketId}/reply`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response && (response.success || (response as any).data)) {
                toast.success("Reply sent successfully!");
                setReplyMessage("");
                setReplyAttachments([]);
                setShowReplyModal(false);
                fetchTickets();
            }
        } catch (error: any) {
            console.error("Error sending reply:", error);
            toast.error(error.message || "Failed to send reply");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseTicket = async (ticket: SupportTicket) => {
        const ticketId = getTicketId(ticket);
        if (!ticketId || !confirm("Are you sure you want to close this ticket?")) return;

        try {
            const response = await apiService.put(`/support/tickets/${ticketId}/close`);
            if (response && (response.success || (response as any).data)) {
                toast.success("Ticket marked as closed");
                fetchTickets();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to close ticket");
        }
    };

    const handleReopenTicket = async (ticket: SupportTicket) => {
        const ticketId = getTicketId(ticket);
        if (!ticketId) return;

        try {
            const response = await apiService.put(`/support/tickets/${ticketId}/reopen`);
            if (response && (response.success || (response as any).data)) {
                toast.success("Ticket reopened");
                fetchTickets();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to reopen ticket");
        }
    };

    const handleSubmitRating = async () => {
        if (!selectedTicket) return;
        const ticketId = getTicketId(selectedTicket);

        try {
            setIsSubmitting(true);
            const response = await apiService.post(`/support/tickets/${ticketId}/rate`, {
                rating: selectedRating,
                feedback: ratingFeedback,
            });

            if (response && (response.success || (response as any).data)) {
                toast.success("Thank you for your rating!");
                setShowRatingModal(false);
                setSelectedRating(5);
                setRatingFeedback("");
                fetchTickets();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to submit rating");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTicketExpand = (ticketId: string) => {
        setExpandedTickets((prev) => {
            const next = new Set(prev);
            if (next.has(ticketId)) next.delete(ticketId);
            else next.add(ticketId);
            return next;
        });
    };

    const handleResetFilters = () => {
        setFilters({
            search: "",
            status: "",
            priority: "",
            category: "",
            dateFrom: "",
            dateTo: "",
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const hasActiveFilters = Boolean(
        filters.search || filters.status || filters.priority || filters.category || filters.dateFrom || filters.dateTo
    );

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatRelativeTime = (date: string) => {
        const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60));
        if (diff < 1) return "Just now";
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return `${Math.floor(diff / 1440)}d ago`;
    };

    const getFileIcon = (fileName: string = "") => {
        const ext = fileName.split(".").pop()?.toLowerCase() || "";
        if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return ImageIcon;
        if (["pdf"].includes(ext)) return FileText;
        if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
        return File;
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-slate-900 pb-16">
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

                {/* Top Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
                            <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Tickets</h1>
                            <p className="text-slate-500 text-sm mt-0.5">
                                Submit, monitor, and resolve operational help requests
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Create Ticket
                        </button>
                        <button
                            onClick={fetchTickets}
                            disabled={loading}
                            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition shadow-xs cursor-pointer"
                            title="Refresh tickets"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-700" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: "Total Tickets", val: stats.total, color: "text-slate-900" },
                            { label: "Open Requests", val: stats.open, color: "text-emerald-600" },
                            { label: "In Progress", val: stats.inProgress, color: "text-blue-600" },
                            { label: "Avg Resolution", val: `${stats.averageResolutionTime || 0}h`, color: "text-purple-600" },
                        ].map((st, idx) => (
                            <div key={`stat-card-${idx}`} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{st.label}</span>
                                <span className={`text-2xl font-extrabold mt-2 ${st.color}`}>{st.val}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters and Search Bar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by ticket number, subject, or description..."
                                value={filters.search}
                                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition"
                            />
                            {filters.search && (
                                <button
                                    onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${showFilters || hasActiveFilters
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Filters
                            {hasActiveFilters && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                        </button>
                    </div>

                    {showFilters && (
                        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 transition cursor-pointer"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="waiting">Waiting</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
                                <select
                                    value={filters.priority}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 transition cursor-pointer"
                                >
                                    <option value="">All Priorities</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 transition cursor-pointer"
                                >
                                    <option value="">All Categories</option>
                                    <option value="technical">Technical</option>
                                    <option value="billing">Billing</option>
                                    <option value="account">Account</option>
                                    <option value="feature">Feature Request</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {hasActiveFilters && (
                                <div className="sm:col-span-3 flex justify-end pt-2">
                                    <button
                                        onClick={handleResetFilters}
                                        className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <FilterX className="w-3.5 h-3.5" /> Clear Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Ticket List Container */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {loading && tickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-3">
                            <RefreshCw className="w-7 h-7 text-emerald-700 animate-spin" />
                            <p className="text-xs text-slate-400 font-medium">Syncing tickets...</p>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-20 px-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                                <Ticket className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800 mb-1">No Tickets Found</h3>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                No support tickets currently match your filters or search terms.
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl transition hover:bg-emerald-800 cursor-pointer inline-flex items-center gap-2"
                            >
                                <Plus className="w-3.5 h-3.5" /> Create New Ticket
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {tickets.map((ticket, tIndex) => {
                                const ticketKey = ticket.id || ticket._id || ticket.ticketNumber || `ticket-${tIndex}`;
                                const ticketId = getTicketId(ticket);
                                const StatusIcon = STATUS_CONFIG[ticket.status]?.icon || AlertCircle;
                                const PriorityIcon = PRIORITY_CONFIG[ticket.priority]?.icon || Info;
                                const statusStyles = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                                const priorityStyles = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
                                const categoryStyles = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.other;
                                const isExpanded = expandedTickets.has(ticketId);

                                return (
                                    <div key={ticketKey} className="p-5 hover:bg-slate-50/70 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 flex-1">
                                                <button
                                                    onClick={() => toggleTicketExpand(ticketId)}
                                                    className="mt-1 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                                                >
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 font-bold" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>

                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-sm font-bold text-slate-900 truncate">
                                                            {ticket.subject}
                                                        </h3>
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            #{ticket.ticketNumber}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                        {ticket.description}
                                                    </p>

                                                    {/* Attribute Tags */}
                                                    <div className="flex items-center gap-2 flex-wrap pt-1">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles.bg} ${statusStyles.color}`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {statusStyles.label}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${priorityStyles.bg} ${priorityStyles.color}`}>
                                                            <PriorityIcon className="w-3 h-3" />
                                                            {priorityStyles.label}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${categoryStyles.bg}`}>
                                                            {CATEGORY_CONFIG[ticket.category]?.label || ticket.category}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">
                                                            {formatRelativeTime(ticket.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 self-end md:self-start shrink-0">
                                                {ticket.status !== "closed" && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTicket(ticket);
                                                            setShowReplyModal(true);
                                                        }}
                                                        className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                    >
                                                        <MessageCircle className="w-3.5 h-3.5" /> Reply
                                                    </button>
                                                )}

                                                {ticket.status === "resolved" && !ticket.rating && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTicket(ticket);
                                                            setShowRatingModal(true);
                                                        }}
                                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                    >
                                                        <Star className="w-3.5 h-3.5" /> Rate
                                                    </button>
                                                )}

                                                {ticket.status !== "closed" ? (
                                                    <button
                                                        onClick={() => handleCloseTicket(ticket)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                        title="Close ticket"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReopenTicket(ticket)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                                        title="Reopen ticket"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Collapsible Ticket Thread & Attachments */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-slate-100 pl-8 space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                                    <div>
                                                        <span className="text-slate-400">Created At:</span>{" "}
                                                        <span className="font-semibold text-slate-700">{formatDate(ticket.createdAt)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Assigned To:</span>{" "}
                                                        <span className="font-semibold text-slate-700">{ticket.assignedTo?.name || "Unassigned"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Messages:</span>{" "}
                                                        <span className="font-semibold text-slate-700">{ticket.messages.length}</span>
                                                    </div>
                                                </div>

                                                {/* Ticket-Level Attachments Section */}
                                                {/* Ticket-Level Attachments Section - UPDATED with Image Preview */}
                                                {ticket.attachments && ticket.attachments.length > 0 && (
                                                    <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                                            Ticket Attachments ({ticket.attachments.length})
                                                        </span>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                            {ticket.attachments.map((rawAtt, aIdx) => {
                                                                const att = normalizeAttachment(rawAtt);
                                                                if (!att) return null;

                                                                return (
                                                                    <div key={`ticket-att-${ticketId}-${aIdx}`} className="group relative">
                                                                        {att.isImage ? (
                                                                            <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-square">
                                                                                <img
                                                                                    src={att.url}
                                                                                    alt={att.name}
                                                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                                                    onError={(e) => {
                                                                                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%2394a3b8' font-size='12' font-family='sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E";
                                                                                    }}
                                                                                />
                                                                                <a
                                                                                    href={att.url}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all"
                                                                                >
                                                                                    <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                </a>
                                                                            </div>
                                                                        ) : (
                                                                            <a
                                                                                href={att.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition shadow-2xs"
                                                                            >
                                                                                <File className="w-4 h-4 text-emerald-600" />
                                                                                <span className="font-medium max-w-xs truncate">{att.name}</span>
                                                                                {att.size > 0 && (
                                                                                    <span className="text-[10px] text-slate-400">({formatFileSize(att.size)})</span>
                                                                                )}
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Thread Message Stream & Message Attachments */}
                                                {ticket.messages.length > 0 && (
                                                    <div className="space-y-3">
                                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conversation Log</h4>
                                                        {ticket.messages.map((msg, mIdx) => {
                                                            const msgKey = msg.id || msg._id || `msg-${ticketId}-${mIdx}`;
                                                            return (
                                                                <div
                                                                    key={msgKey}
                                                                    className={`p-4 rounded-xl text-xs space-y-2.5 border ${msg.isAdmin
                                                                        ? "bg-slate-900 text-white border-slate-900"
                                                                        : "bg-white text-slate-800 border-slate-200"
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className={`font-bold ${msg.isAdmin ? "text-emerald-400" : "text-slate-900"}`}>
                                                                            {msg.userName} {msg.isAdmin && "(Staff)"}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400">
                                                                            {formatRelativeTime(msg.createdAt)}
                                                                        </span>
                                                                    </div>

                                                                    <p className="leading-relaxed">{msg.message}</p>

                                                                    {/* Message Attachment Renderer */}
                                                                    {/* Message Attachment Renderer - UPDATED with Image Preview */}
                                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                                        <div className="pt-2 border-t border-slate-200/40 flex flex-wrap gap-2">
                                                                            {msg.attachments.map((rawAtt, attIdx) => {
                                                                                const att = normalizeAttachment(rawAtt);
                                                                                if (!att) return null;

                                                                                const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(att.name) ||
                                                                                    /^image\//.test((rawAtt as any)?.mimetype || (rawAtt as any)?.type || "");

                                                                                if (isImage) {
                                                                                    return (
                                                                                        <div key={`msg-att-${msgKey}-${attIdx}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                                                                            <img
                                                                                                src={att.url}
                                                                                                alt={att.name}
                                                                                                className="w-full h-full object-cover"
                                                                                                onError={(e) => {
                                                                                                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%2394a3b8' font-size='12' font-family='sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E";
                                                                                                }}
                                                                                            />
                                                                                            <a
                                                                                                href={att.url}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all"
                                                                                            >
                                                                                                <ExternalLink className="w-4 h-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                                                                                            </a>
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                return (
                                                                                    <a
                                                                                        key={`msg-att-${msgKey}-${attIdx}`}
                                                                                        href={att.url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition ${msg.isAdmin
                                                                                                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                                                                                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                                                                            }`}
                                                                                    >
                                                                                        <File className="w-3.5 h-3.5 text-emerald-500" />
                                                                                        <span className="max-w-[180px] truncate">{att.name}</span>
                                                                                        {att.size > 0 && (
                                                                                            <span className="text-[10px] opacity-70">({formatFileSize(att.size)})</span>
                                                                                        )}
                                                                                    </a>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/40">
                            <span className="text-xs font-semibold text-slate-500">
                                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tickets
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                                    disabled={pagination.page === 1}
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    <ChevronsLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                    disabled={pagination.page === 1}
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                </button>

                                <span className="px-3 py-1.5 text-xs font-bold text-slate-800">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>

                                <button
                                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.totalPages }))}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    <ChevronsRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal: Create Ticket */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">New Support Ticket</h2>
                                        <p className="text-xs text-slate-400">Describe the issue encountered in detail</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTicket} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Subject <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Brief description of your issue"
                                        value={createForm.subject}
                                        onChange={(e) => setCreateForm((prev) => ({ ...prev, subject: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                                        <select
                                            value={createForm.category}
                                            onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value as any }))}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 transition cursor-pointer"
                                        >
                                            <option value="technical">Technical</option>
                                            <option value="billing">Billing</option>
                                            <option value="account">Account</option>
                                            <option value="feature">Feature Request</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Priority</label>
                                        <select
                                            value={createForm.priority}
                                            onChange={(e) => setCreateForm((prev) => ({ ...prev, priority: e.target.value as any }))}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 transition cursor-pointer"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Detailed Explanation <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Provide steps to reproduce or relevant context..."
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition resize-none"
                                    />
                                </div>

                                {/* Attachments Section */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Attachments <span className="text-slate-400 font-normal">(Max 5MB)</span>
                                    </label>
                                    <input
                                        ref={createFileInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleCreateFileSelect}
                                        className="hidden"
                                        accept=".jpg,.jpeg,.png,.gif,.pdf,.zip,.txt"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => createFileInputRef.current?.click()}
                                        className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 transition cursor-pointer"
                                    >
                                        <Paperclip className="w-3.5 h-3.5" /> Select Files
                                    </button>

                                    {createAttachments.length > 0 && (
                                        <div className="mt-2.5 space-y-1.5">
                                            {createAttachments.map((f, i) => (
                                                <div key={`create-att-${i}`} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                                                    <span className="truncate max-w-xs">{f.name} ({formatFileSize(f.size)})</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCreateAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                                                        className="text-rose-500 hover:text-rose-700"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Submit Ticket
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal: Reply Thread */}
                {showReplyModal && selectedTicket && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Post Reply</h2>
                                    <p className="text-xs text-slate-400">#{selectedTicket.ticketNumber} — {selectedTicket.subject}</p>
                                </div>
                                <button
                                    onClick={() => setShowReplyModal(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Message History Preview with Attachments */}
                            {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                                <div className="max-h-48 overflow-y-auto space-y-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                                    {selectedTicket.messages.map((m, idx) => {
                                        const replyMsgKey = m.id || m._id || `reply-prev-${idx}`;
                                        return (
                                            <div key={replyMsgKey} className="space-y-1">
                                                <div className="flex items-center justify-between font-semibold">
                                                    <span className={m.isAdmin ? "text-emerald-700" : "text-slate-800"}>{m.userName}</span>
                                                    <span className="text-[10px] text-slate-400">{formatRelativeTime(m.createdAt)}</span>
                                                </div>
                                                <p className="text-slate-600">{m.message}</p>
                                                {m.attachments && m.attachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                        {m.attachments.map((attRaw, aIdx) => {
                                                            const att = normalizeAttachment(attRaw);
                                                            if (!att) return null;
                                                            const FileIconComponent = getFileIcon(att.name);

                                                            return (
                                                                <a
                                                                    key={`reply-prev-att-${replyMsgKey}-${aIdx}`}
                                                                    href={att.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:text-emerald-700"
                                                                >
                                                                    <FileIconComponent className="w-3 h-3 text-emerald-600" />
                                                                    <span className="max-w-[120px] truncate">{att.name}</span>
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="space-y-4">
                                <textarea
                                    rows={4}
                                    placeholder="Type your reply message here..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition resize-none"
                                />

                                <div>
                                    <input
                                        ref={replyFileInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleReplyFileSelect}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => replyFileInputRef.current?.click()}
                                        className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 transition cursor-pointer"
                                    >
                                        <Paperclip className="w-3.5 h-3.5" /> Add Attachments
                                    </button>

                                    {replyAttachments.length > 0 && (
                                        <div className="mt-2.5 space-y-1.5">
                                            {replyAttachments.map((f, i) => (
                                                <div key={`reply-att-${i}`} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                                                    <span className="truncate max-w-xs">{f.name} ({formatFileSize(f.size)})</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setReplyAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                                                        className="text-rose-500 hover:text-rose-700"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowReplyModal(false)}
                                        className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReply}
                                        disabled={isSubmitting || (!replyMessage.trim() && replyAttachments.length === 0)}
                                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Send Response
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal: Rate Ticket */}
                {showRatingModal && selectedTicket && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-5">
                            <div className="text-center space-y-1">
                                <h2 className="text-base font-bold text-slate-900">Rate Support Quality</h2>
                                <p className="text-xs text-slate-400">How would you rate our resolution of ticket #{selectedTicket.ticketNumber}?</p>
                            </div>

                            <div className="flex justify-center gap-2 py-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={`rating-star-${star}`}
                                        type="button"
                                        onClick={() => setSelectedRating(star)}
                                        className="p-1 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                                    >
                                        <Star
                                            className={`w-7 h-7 ${star <= selectedRating ? "text-amber-400 fill-amber-400" : ""}`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                rows={3}
                                placeholder="Optional feedback..."
                                value={ratingFeedback}
                                onChange={(e) => setRatingFeedback(e.target.value)}
                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none resize-none"
                            />

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRatingModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitRating}
                                    disabled={isSubmitting}
                                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition shadow-xs"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Rating"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}