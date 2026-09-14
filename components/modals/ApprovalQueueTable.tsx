"use client";

import React, { useState, useMemo, memo } from "react";
import {
    Eye,
    Check,
    X,
    MapPin,
    Loader2,
    CheckCheck,
    ShieldCheck,
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    Filter,
    Trash2,
} from "lucide-react";
import { formatDate } from "@/utils/formatters";
import type { Expense, ApprovalGroup } from "@/types/expense";

// ==========================================
// Types & Domain Definitions
// ==========================================

export interface ApprovalQueueProps {
    groups: ApprovalGroup[];
    onView: (expense: Expense) => void;
    onApprove: (id: string) => void;
    onReject: (id: string, title: string) => void;
    onBulkApprove?: (ids: string[]) => void;
    onBulkDelete?: (ids: string[]) => void;
    processingId: string | null;
}

type SortField = "title" | "employee" | "amount" | "expenseDate";
type SortOrder = "asc" | "desc";

interface FlattenedExpenseRow extends Expense {
    employeeDisplayName: string;
    employeeRawId: string;
}

// ==========================================
// Static Visual Configurations
// ==========================================

const CATEGORY_MAP: Record<string, { icon: string; label: string }> = {
    transport: { icon: "🚕", label: "Transport" },
    meals: { icon: "🍽️", label: "Meals" },
    entertainment: { icon: "🎭", label: "Entertainment" },
    office_supply: { icon: "🖨️", label: "Office Supplies" },
    accommodation: { icon: "🏨", label: "Accommodation" },
    personal: { icon: "👤", label: "Personal" },
    other: { icon: "📄", label: "Other" },
};

const STATUS_BADGES: Record<string, string> = {
    pending: "bg-amber-50 text-amber-800 border-amber-200/70",
    approved: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
    rejected: "bg-rose-50 text-rose-800 border-rose-200/70",
    paid: "bg-slate-100 text-slate-800 border-slate-200/70",
};

const formatCurrency = (val: number): string =>
    new Intl.NumberFormat("en-BD", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    }).format(val);

const getInitials = (name?: string): string =>
    name
        ?.split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "??";

// ==========================================
// Sub-Components
// ==========================================

interface TableHeaderCellProps {
    label: string;
    field?: SortField;
    currentSortField?: SortField;
    currentSortOrder?: SortOrder;
    onSort?: (field: SortField) => void;
    align?: "left" | "right" | "center";
    className?: string;
}

const TableHeaderCell = memo(function TableHeaderCell({
    label,
    field,
    currentSortField,
    currentSortOrder,
    onSort,
    align = "left",
    className = "",
}: TableHeaderCellProps) {
    const isSortable = Boolean(field && onSort);
    const isActive = field === currentSortField;

    const alignmentClass =
        align === "right"
            ? "text-right justify-end"
            : align === "center"
                ? "text-center justify-center"
                : "text-left justify-start";

    return (
        <th
            scope="col"
            className={`px-4 py-3.5 text-[11px] font-semibold tracking-wider text-slate-300 uppercase select-none ${className}`}
        >
            {isSortable && field && onSort ? (
                <button
                    type="button"
                    onClick={() => onSort(field)}
                    className={`inline-flex items-center gap-1.5 transition-colors hover:text-white cursor-pointer ${alignmentClass} ${isActive ? "text-white font-bold" : "text-slate-400"
                        }`}
                >
                    <span>{label}</span>
                    {isActive ? (
                        currentSortOrder === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-white" />
                        ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-white" />
                        )
                    ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-slate-300" />
                    )}
                </button>
            ) : (
                <div className={`flex items-center ${alignmentClass}`}>
                    <span>{label}</span>
                </div>
            )}
        </th>
    );
});

// ==========================================
// Main Component
// ==========================================

export default function ApprovalQueueTable({
    groups,
    onView,
    onApprove,
    onReject,
    onBulkApprove,
    onBulkDelete,
    processingId,
}: ApprovalQueueProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [sortField, setSortField] = useState<SortField>("expenseDate");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const pageSize = 10;

    // Flatten nested employee groups into individual table rows
    const flattenedExpenses = useMemo<FlattenedExpenseRow[]>(() => {
        const list: FlattenedExpenseRow[] = [];
        for (const group of groups) {
            const empId = group.employee?._id ?? "unknown";
            const empName = group.employee?.fullName ?? "Unassigned Staff";

            for (const expense of group.expenses) {
                list.push({
                    ...expense,
                    employeeDisplayName: empName,
                    employeeRawId: empId,
                });
            }
        }
        return list;
    }, [groups]);

    // Search & Filter
    const filteredExpenses = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return flattenedExpenses.filter((item) => {
            const matchesCategory =
                selectedCategory === "all" || item.category === selectedCategory;

            if (!matchesCategory) return false;
            if (!query) return true;

            const titleMatch = item.title.toLowerCase().includes(query);
            const employeeMatch = item.employeeDisplayName.toLowerCase().includes(query);
            const locationMatch = item.location?.label?.toLowerCase().includes(query) ?? false;
            const amountMatch = item.amount.toString().includes(query);

            return titleMatch || employeeMatch || locationMatch || amountMatch;
        });
    }, [flattenedExpenses, searchQuery, selectedCategory]);

    // Sorting
    const sortedExpenses = useMemo(() => {
        const list = [...filteredExpenses];

        list.sort((a, b) => {
            let comparison = 0;
            if (sortField === "amount") {
                comparison = a.amount - b.amount;
            } else if (sortField === "expenseDate") {
                comparison = new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime();
            } else if (sortField === "employee") {
                comparison = a.employeeDisplayName.localeCompare(b.employeeDisplayName);
            } else {
                comparison = a.title.localeCompare(b.title);
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

        return list;
    }, [filteredExpenses, sortField, sortOrder]);

    // Pagination Calculations
    const totalPages = Math.max(1, Math.ceil(sortedExpenses.length / pageSize));
    const activePage = Math.min(currentPage, totalPages);

    const paginatedExpenses = useMemo(() => {
        const startIdx = (activePage - 1) * pageSize;
        return sortedExpenses.slice(startIdx, startIdx + pageSize);
    }, [sortedExpenses, activePage, pageSize]);

    // Bulk Selection Handlers
    const isAllPageSelected = useMemo(() => {
        if (paginatedExpenses.length === 0) return false;
        return paginatedExpenses.every((e) => selectedIds.includes(e._id));
    }, [paginatedExpenses, selectedIds]);

    const handleToggleSelectAll = () => {
        if (isAllPageSelected) {
            const pageIds = new Set(paginatedExpenses.map((e) => e._id));
            setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
        } else {
            const pageIds = paginatedExpenses.map((e) => e._id);
            setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
        }
    };

    const handleToggleRow = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Bulk Action Execution
    const handleBulkApproveAction = async () => {
        if (onBulkApprove) {
            onBulkApprove(selectedIds);
        } else {
            for (const id of selectedIds) {
                await onApprove(id);
            }
        }
        setSelectedIds([]);
    };

    const handleBulkDeleteAction = () => {
        if (onBulkDelete) {
            onBulkDelete(selectedIds);
        } else {
            selectedIds.forEach((id) => onReject(id, "Bulk Rejected"));
        }
        setSelectedIds([]);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
        setCurrentPage(1);
    };

    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                    <CheckCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Queue is Clear!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    No employee reimbursement requests are currently awaiting approval.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search & Category Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search claims, employee, or location..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition"
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 mr-1" />
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCategory("all");
                            setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${selectedCategory === "all"
                                ? "bg-slate-900 text-white shadow-xs"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                            }`}
                    >
                        All Categories
                    </button>
                    {Object.entries(CATEGORY_MAP).map(([key, meta]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => {
                                setSelectedCategory(key);
                                setCurrentPage(1);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${selectedCategory === key
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            <span>{meta.icon}</span>
                            <span>{meta.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Floating Single / Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-2 pl-2">
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-mono text-xs font-bold text-white">
                            {selectedIds.length}
                        </span>
                        <span className="text-xs font-semibold">
                            {selectedIds.length === 1 ? "claim selected" : "claims selected"}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleBulkApproveAction}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Approve ({selectedIds.length})
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkDeleteAction}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete ({selectedIds.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedIds([])}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>
            )}

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] border-collapse text-left">
                        <thead>
                            <tr className="bg-slate-900 border-b border-slate-800 text-white">
                                {/* Checkbox Column Header */}
                                <th scope="col" className="w-12 px-3 py-3.5 text-center">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={isAllPageSelected}
                                            onChange={handleToggleSelectAll}
                                            aria-label="Select all claims on current page"
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-slate-900 focus:ring-0 cursor-pointer accent-slate-700"
                                        />
                                    </div>
                                </th>

                                {/* Guaranteed Serial Number Header */}
                                <th
                                    scope="col"
                                    className="w-14 px-3 py-3.5 text-center font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300"
                                >
                                    SL
                                </th>

                                <TableHeaderCell
                                    label="Claim Details"
                                    field="title"
                                    currentSortField={sortField}
                                    currentSortOrder={sortOrder}
                                    onSort={handleSort}
                                    className="min-w-[260px]"
                                />
                                <TableHeaderCell
                                    label="Employee"
                                    field="employee"
                                    currentSortField={sortField}
                                    currentSortOrder={sortOrder}
                                    onSort={handleSort}
                                    className="min-w-[160px]"
                                />
                                <TableHeaderCell
                                    label="Amount"
                                    field="amount"
                                    currentSortField={sortField}
                                    currentSortOrder={sortOrder}
                                    onSort={handleSort}
                                    align="right"
                                    className="min-w-[110px]"
                                />
                                <TableHeaderCell
                                    label="Date"
                                    field="expenseDate"
                                    currentSortField={sortField}
                                    currentSortOrder={sortOrder}
                                    onSort={handleSort}
                                    className="min-w-[110px]"
                                />
                                <TableHeaderCell
                                    label="Status"
                                    align="center"
                                    className="text-center min-w-[110px]"
                                />
                                <TableHeaderCell
                                    label="Actions"
                                    align="right"
                                    className="text-right min-w-[110px]"
                                />
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {paginatedExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-14 text-center">
                                        <p className="text-xs font-semibold text-slate-700">
                                            No matching expenses found
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            Try adjusting your keywords or clearing the category filter.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedExpenses.map((expense, index) => {
                                    const isPending = expense.status === "pending";
                                    const isProcessing = processingId === expense._id;
                                    const isSelected = selectedIds.includes(expense._id);
                                    const categoryKey = expense.category ?? "other";
                                    const categoryMeta = CATEGORY_MAP[categoryKey] ?? {
                                        icon: "📄",
                                        label: categoryKey.replace(/_/g, " "),
                                    };

                                    const serialNumber = (activePage - 1) * pageSize + index + 1;

                                    return (
                                        <tr
                                            key={expense._id}
                                            className={`transition-colors group ${isSelected ? "bg-slate-50" : "hover:bg-slate-50/70"
                                                }`}
                                        >
                                            {/* Checkbox Column */}
                                            <td className="w-12 px-3 py-3.5 text-center">
                                                <div className="flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleRow(expense._id)}
                                                        aria-label={`Select claim ${expense.title}`}
                                                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
                                                    />
                                                </div>
                                            </td>

                                            {/* Explicit Visible Serial Number */}
                                            <td className="w-14 px-3 py-3.5 text-center whitespace-nowrap">
                                                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200/60 inline-block">
                                                    {String(serialNumber).padStart(2, "0")}
                                                </span>
                                            </td>

                                            {/* Claim Details */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="flex items-center justify-center w-9 h-9 text-base rounded-xl bg-slate-100/80 border border-slate-200/50 shrink-0 select-none"
                                                        aria-hidden="true"
                                                    >
                                                        {categoryMeta.icon}
                                                    </span>
                                                    <div className="min-w-0 max-w-xs sm:max-w-sm">
                                                        <p className="text-sm font-semibold text-slate-900 truncate">
                                                            {expense.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                            <span className="capitalize font-medium text-slate-600">
                                                                {categoryMeta.label}
                                                            </span>
                                                            {expense.location?.label && (
                                                                <>
                                                                    <span className="text-slate-300">·</span>
                                                                    <span className="flex items-center gap-1 truncate text-slate-500 max-w-[160px]">
                                                                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                                                        <span className="truncate">{expense.location.label}</span>
                                                                    </span>
                                                                </>
                                                            )}
                                                            {expense.gpsVerified && (
                                                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/50">
                                                                    <ShieldCheck className="w-2.5 h-2.5" /> GPS
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Employee Column */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                                        {getInitials(expense.employeeDisplayName)}
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-900">
                                                        {expense.employeeDisplayName}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Amount Column */}
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap font-mono">
                                                <span className="text-sm font-bold text-slate-950">
                                                    ৳{formatCurrency(expense.amount)}
                                                </span>
                                            </td>

                                            {/* Date Column */}
                                            <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                                                {formatDate(expense.expenseDate)}
                                            </td>

                                            {/* Status Column */}
                                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${STATUS_BADGES[expense.status] ?? STATUS_BADGES.pending
                                                        }`}
                                                >
                                                    {expense.status}
                                                </span>
                                            </td>

                                            {/* Actions Column */}
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => onView(expense)}
                                                        aria-label={`View ${expense.title}`}
                                                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-colors cursor-pointer"
                                                        title="Inspect details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {isPending && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => onApprove(expense._id)}
                                                                disabled={isProcessing}
                                                                aria-label={`Authorize ${expense.title}`}
                                                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 cursor-pointer"
                                                                title="Approve claim"
                                                            >
                                                                {isProcessing ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Check className="w-4 h-4" />
                                                                )}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => onReject(expense._id, expense.title)}
                                                                disabled={isProcessing}
                                                                aria-label={`Deny ${expense.title}`}
                                                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-50 cursor-pointer"
                                                                title="Reject claim"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                    <p className="text-xs text-slate-500">
                        Showing{" "}
                        <span className="font-semibold text-slate-800">
                            {filteredExpenses.length === 0 ? 0 : (activePage - 1) * pageSize + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold text-slate-800">
                            {Math.min(activePage * pageSize, filteredExpenses.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-slate-800 font-mono">
                            {filteredExpenses.length}
                        </span>{" "}
                        claims
                    </p>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={activePage <= 1}
                            aria-label="Previous Page"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="text-xs font-semibold text-slate-700 px-2.5">
                            Page {activePage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={activePage >= totalPages}
                            aria-label="Next Page"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}