"use client";

import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
    Plus,
    Loader2,
    RefreshCw,
    Receipt,
    CheckSquare,
    Wallet,
    Clock3,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import api from "@/lib/axios";

import type { Expense, ApprovalGroup as GroupedEmployee } from "@/types/expense";
import MyExpensesTable from "@/components/modals/MyExpensesTable";
import ApprovalQueueTable from "@/components/modals/ApprovalQueueTable";
import CreateExpenseModal from "@/components/modals/CreateExpenseModal";
import ViewExpenseModal from "@/components/modals/ViewExpenseModal";
import DeleteExpenseDialog from "@/components/modals/DeleteExpenseDialog";
import RejectExpenseModal from "@/components/modals/RejectExpenseModal";

// ==========================================
// Types & Domain Definitions
// ==========================================

export type ExpenseTab = "my" | "queue";

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface ApprovalQueueData {
    grouped?: GroupedEmployee[];
}

interface RejectModalState {
    id: string;
    title: string;
}

const APPROVER_ROLES = ["super_admin", "admin", "hr_manager"] as const;

// ==========================================
// Helpers
// ==========================================

const formatBDT = (amount: number): string =>
    new Intl.NumberFormat("en-BD", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    }).format(amount);

// ==========================================
// Sub-Components
// ==========================================

interface StatCardProps {
    label: string;
    value: string | number;
    subtext: string;
    valueColorClass: string;
    icon: React.ElementType;
}

const StatCard = memo(function StatCard({
    label,
    value,
    subtext,
    valueColorClass,
    icon: Icon,
}: StatCardProps) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {label}
                </p>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <p className={`text-2xl font-black font-mono tracking-tight mt-2 ${valueColorClass}`}>
                {value}
            </p>
            <p className="text-xs text-slate-400 mt-1">{subtext}</p>
        </div>
    );
});

// ==========================================
// Main Component
// ==========================================

export default function ExpensesPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const userRole = user?.role;
    const isApprover = Boolean(
        userRole && (APPROVER_ROLES as readonly string[]).includes(userRole)
    );

    // Data & Loading States
    const [activeTab, setActiveTab] = useState<ExpenseTab>("my");
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [approvalGroups, setApprovalGroups] = useState<GroupedEmployee[]>([]);
    const [loadingExpenses, setLoadingExpenses] = useState(true);
    const [loadingQueue, setLoadingQueue] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal Visibility States
    const [showCreate, setShowCreate] = useState(false);
    const [viewExpense, setViewExpense] = useState<Expense | null>(null);
    const [deleteExpenseItem, setDeleteExpenseItem] = useState<{ id: string; title?: string } | null>(null);
    const [rejectData, setRejectData] = useState<RejectModalState | null>(null);

    // ============ AUTH GUARD ============
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    // ============ FETCH ACTIONS ============
    // If Super Admin / Admin / HR, fetch all expenses from `/expenses`. Otherwise fetch `/expenses/my`.
    const fetchExpenses = useCallback(async () => {
        try {
            setLoadingExpenses(true);

            // ✅ Admins hit /all, employees hit /my — no silent fallback
            const endpoint = isApprover ? "/expenses/all" : "/expenses/my";
            const res = await api.get<ApiResponse<any>>(endpoint);

            if (res?.data?.success) {
                const rawData = res.data.data;
                if (Array.isArray(rawData)) {
                    setAllExpenses(rawData);
                } else if (rawData && Array.isArray(rawData.expenses)) {
                    setAllExpenses(rawData.expenses);
                } else {
                    setAllExpenses([]);
                }
            }
        } catch (error) {
            const err = error as AxiosError<{ message?: string }>;
            console.error("Expenses fetch error:", {
                status: err.response?.status,
                url: err.config?.url,
                data: err.response?.data,
            });
            toast.error(err.response?.data?.message || "Failed to load expenses");
        } finally {
            setLoadingExpenses(false);
        }
    }, [isApprover]);

    const fetchQueue = useCallback(async () => {
        if (!isApprover) return;
        try {
            setLoadingQueue(true);
            const res = await api.get<ApiResponse<ApprovalQueueData>>(
                "/expenses/approval-queue?status=pending"
            );
            if (res.data.success) {
                setApprovalGroups(res.data.data?.grouped ?? []);
            }
        } catch (error) {
            const err = error as AxiosError<{ message?: string }>;
            toast.error(err.response?.data?.message || "Failed to load approval queue");
        } finally {
            setLoadingQueue(false);
        }
    }, [isApprover]);

    useEffect(() => {
        if (!isAuthenticated) return;

        let isSubscribed = true;

        const loadInitialData = async () => {
            if (isApprover) {
                setLoadingQueue(true);
            }
            await fetchExpenses();
            if (isApprover && isSubscribed) {
                await fetchQueue();
            }
        };

        loadInitialData();

        return () => {
            isSubscribed = false;
        };
    }, [isAuthenticated, isApprover, fetchExpenses, fetchQueue]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchExpenses(), isApprover ? fetchQueue() : Promise.resolve()]);
        setRefreshing(false);
        toast.success("Expense data refreshed");
    };

    // ============ APPROVAL & BULK ACTIONS ============
    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await api.patch<ApiResponse<unknown>>(`/expenses/${id}/approve`);
            if (res.data.success !== false) {
                toast.success("Expense authorized");
                await Promise.all([fetchExpenses(), fetchQueue()]);
            }
        } catch (error) {
            const err = error as AxiosError<{ message?: string }>;
            toast.error(err.response?.data?.message || "Failed to approve expense");
        } finally {
            setProcessingId(null);
        }
    };

    const handleBulkApprove = async (ids: string[]) => {
        try {
            await Promise.all(ids.map((id) => api.patch(`/expenses/${id}/approve`)));
            toast.success(`${ids.length} expense(s) authorized`);
            await Promise.all([fetchExpenses(), fetchQueue()]);
        } catch {
            toast.error("Failed to approve selected expenses");
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        if (!confirm(`Are you sure you want to delete ${ids.length} expense record(s)?`)) return;

        try {
            await Promise.all(ids.map((id) => api.delete(`/expenses/${id}`)));
            toast.success(`${ids.length} expense(s) deleted`);
            await Promise.all([fetchExpenses(), isApprover ? fetchQueue() : Promise.resolve()]);
        } catch {
            toast.error("Failed to delete selected expenses");
        }
    };

    // ============ SUMMARY METRICS ============
    const generalStats = useMemo(() => {
        let pending = 0;
        let approved = 0;
        let totalAmount = 0;

        for (let i = 0; i < allExpenses.length; i++) {
            const e = allExpenses[i];
            if (e.status === "pending") pending++;
            if (e.status === "approved") approved++;
            if (e.status === "approved" || e.status === "paid") {
                totalAmount += e.amount;
            }
        }

        return { pending, approved, totalAmount };
    }, [allExpenses]);

    const queueStats = useMemo(() => {
        let pending = 0;
        let total = 0;

        for (let i = 0; i < approvalGroups.length; i++) {
            const g = approvalGroups[i];
            pending += g.pendingCount;
            total += g.totalAmount;
        }

        return { pending, total };
    }, [approvalGroups]);

    const handleOpenDelete = useCallback((id: string) => {
        const target = allExpenses.find((e) => e._id === id);
        setDeleteExpenseItem({ id, title: target?.title });
    }, [allExpenses]);

    const handleOpenReject = useCallback((id: string, title: string) => {
        setRejectData({ id, title });
    }, []);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/70">
            <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
                {/* Header Banner */}
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/10 shrink-0">
                            <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                Expenses Management
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">
                                {isApprover
                                    ? "Manage, audit, and approve all corporate employee expense claims"
                                    : "Submit claim records, attach receipts, and track approval status"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            aria-label="Refresh expense data"
                            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors text-slate-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 shadow-xs cursor-pointer"
                            title="Refresh logs"
                        >
                            <RefreshCw size={16} className={refreshing ? "animate-spin text-slate-900" : ""} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
                        >
                            <Plus size={15} />
                            Submit New Expense
                        </button>
                    </div>
                </header>

                {/* Analytic Metrics */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Expense Statistics">
                    <StatCard
                        label={isApprover ? "Total Pending" : "My Pending Claims"}
                        value={generalStats.pending}
                        subtext="Awaiting verification"
                        valueColorClass="text-amber-600"
                        icon={Clock3}
                    />
                    <StatCard
                        label={isApprover ? "Total Approved" : "My Approved Claims"}
                        value={generalStats.approved}
                        subtext="Authorized claims"
                        valueColorClass="text-emerald-600"
                        icon={CheckCircle2}
                    />
                    <StatCard
                        label="Total Amount"
                        value={`৳${formatBDT(generalStats.totalAmount)}`}
                        subtext="Combined approved & paid"
                        valueColorClass="text-slate-950"
                        icon={Wallet}
                    />
                    {isApprover && (
                        <StatCard
                            label="Team Approval Queue"
                            value={queueStats.pending}
                            subtext={`৳${formatBDT(queueStats.total)} pending sign-off`}
                            valueColorClass="text-rose-600"
                            icon={AlertCircle}
                        />
                    )}
                </section>

                {/* Navigation Tabs */}
                {isApprover && (
                    <nav className="flex items-center gap-2 border-b border-slate-200/80" aria-label="Expense Views">
                        <button
                            type="button"
                            onClick={() => setActiveTab("my")}
                            className={`px-5 py-3 text-xs font-bold relative transition-colors cursor-pointer ${activeTab === "my"
                                ? "text-slate-950"
                                : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Wallet size={15} />
                                <span>All Expense Claims</span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                                    {allExpenses.length}
                                </span>
                            </div>
                            {activeTab === "my" && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("queue")}
                            className={`px-5 py-3 text-xs font-bold relative transition-colors cursor-pointer ${activeTab === "queue"
                                ? "text-slate-950"
                                : "text-slate-500 hover:text-slate-900"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <CheckSquare size={15} />
                                <span>Approval Queue</span>
                                {queueStats.pending > 0 && (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                        {queueStats.pending}
                                    </span>
                                )}
                            </div>
                            {activeTab === "queue" && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
                            )}
                        </button>
                    </nav>
                )}

                {/* Content Renderers */}
                <section>
                    {activeTab === "my" || !isApprover ? (
                        loadingExpenses ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="w-7 h-7 animate-spin text-slate-800" />
                            </div>
                        ) : (
                            <MyExpensesTable
                                expenses={allExpenses}
                                onView={setViewExpense}
                                onDelete={handleOpenDelete}
                                onBulkDelete={handleBulkDelete}
                            />
                        )
                    ) : loadingQueue ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="w-7 h-7 animate-spin text-slate-800" />
                        </div>
                    ) : (
                        <ApprovalQueueTable
                            groups={approvalGroups}
                            onView={setViewExpense}
                            onApprove={handleApprove}
                            onReject={handleOpenReject}
                            onBulkApprove={handleBulkApprove}
                            onBulkDelete={handleBulkDelete}
                            processingId={processingId}
                        />
                    )}
                </section>
            </div>

            {/* Action Modals & Dialogs */}
            <CreateExpenseModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={fetchExpenses}
            />

            <ViewExpenseModal
                isOpen={Boolean(viewExpense)}
                expense={viewExpense}
                onClose={() => setViewExpense(null)}
            />

            <DeleteExpenseDialog
                isOpen={Boolean(deleteExpenseItem)}
                expenseId={deleteExpenseItem?.id ?? null}
                expenseTitle={deleteExpenseItem?.title}
                onClose={() => setDeleteExpenseItem(null)}
                onDeleted={fetchExpenses}
            />

            <RejectExpenseModal
                isOpen={Boolean(rejectData)}
                expenseId={rejectData?.id ?? null}
                expenseTitle={rejectData?.title}
                onClose={() => setRejectData(null)}
                onRejected={async () => {
                    await Promise.all([fetchExpenses(), fetchQueue()]);
                }}
            />
        </main>
    );
}