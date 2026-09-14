"use client";

import React, { memo, useState, useMemo, useCallback } from "react";
import {
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock3,
  MapPin,
  ShieldCheck,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { useAuth } from "@/contexts/AuthContext";
import type { Expense } from "@/types/expense";

// ==========================================
// Constants
// ==========================================

const APPROVER_ROLES = ["super_admin", "admin", "hr_manager"];

// ==========================================
// Types
// ==========================================

export type ExpenseStatus = "pending" | "approved" | "rejected" | "paid";

export type ExpenseCategory =
  | "transport"
  | "meals"
  | "entertainment"
  | "office_supply"
  | "accommodation"
  | "personal"
  | "other";

interface MyExpensesTableProps {
  expenses: Expense[];
  onView: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
}

// ==========================================
// Static Visual Configurations
// ==========================================

interface StatusStyle {
  label: string;
  badgeClass: string;
  icon: React.ReactElement;
}

const STATUS_CONFIG: Record<string, StatusStyle> = {
  pending: {
    label: "Pending",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/60",
    icon: <Clock3 className="w-3.5 h-3.5" />,
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200/60",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  paid: {
    label: "Paid",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200/70",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
};

const CATEGORY_MAP: Record<string, { icon: string; label: string }> = {
  transport: { icon: "🚕", label: "Transport" },
  meals: { icon: "🍽️", label: "Meals" },
  entertainment: { icon: "🎭", label: "Entertainment" },
  office_supply: { icon: "🖨️", label: "Office Supplies" },
  accommodation: { icon: "🏨", label: "Accommodation" },
  personal: { icon: "👤", label: "Personal" },
  other: { icon: "📄", label: "Other" },
};

// ==========================================
// Formatting & Avatar Helpers
// ==========================================

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

const sanitizeImageUrl = (path?: string | null): string | null => {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:5000";

  return `${apiBase}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};

// ==========================================
// Sub-Components
// ==========================================

const RequesterAvatar = memo(function RequesterAvatar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl: string | null;
}) {
  const [imgError, setImgError] = useState(false);

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setImgError(true)}
        className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-800 shadow-2xs">
      {getInitials(name)}
    </div>
  );
});

// ---------- Expense Row ----------
interface ExpenseRowProps {
  expense: Expense;
  currentUserPhoto?: string | null;
  currentUserName?: string | null;
  currentUserId?: string | null;
  currentUserRole?: string | null;
  serialNumber: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onView: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const ExpenseRow = memo(function ExpenseRow({
  expense,
  currentUserPhoto,
  currentUserName,
  currentUserId,
  currentUserRole,
  serialNumber,
  isSelected,
  onToggleSelect,
  onView,
  onDelete,
}: ExpenseRowProps) {
  const statusMeta = STATUS_CONFIG[expense.status] ?? STATUS_CONFIG.pending;
  const categoryKey = expense.category ?? "other";
  const categoryMeta = CATEGORY_MAP[categoryKey] ?? {
    icon: "📄",
    label: categoryKey.replace(/_/g, " "),
  };

  const isPending = expense.status === "pending";
  const isApprover = Boolean(
    currentUserRole && APPROVER_ROLES.includes(currentUserRole)
  );

  // 👇 Admins can delete any row; employees can only delete pending ones
  const canDelete = isPending || isApprover;
  // 👇 Same rule for bulk-select checkboxes
  const canSelect = isPending || isApprover;

  // Resolve requester name + photo
  const { requesterName, requesterPhoto } = useMemo(() => {
    let name = currentUserName || "Me";
    let rawPhoto: string | undefined | null = null;

    if (typeof expense.employeeId === "object" && expense.employeeId !== null) {
      name = expense.employeeId.fullName || name;
      rawPhoto =
        (expense.employeeId as any).profilePhoto ||
        (expense.employeeId as any).avatar ||
        (expense.employeeId as any).photo;
    } else if (expense.employeeName) {
      name = expense.employeeName;
    }

    const isSelf =
      !expense.employeeId ||
      expense.employeeId === currentUserId ||
      (typeof expense.employeeId === "object" &&
        (expense.employeeId as any)._id === currentUserId);

    if (!rawPhoto && isSelf && currentUserPhoto) {
      rawPhoto = currentUserPhoto;
    }

    return {
      requesterName: name,
      requesterPhoto: sanitizeImageUrl(rawPhoto),
    };
  }, [expense, currentUserName, currentUserId, currentUserPhoto]);

  return (
    <tr
      className={`transition-colors duration-150 group ${
        isSelected ? "bg-slate-50" : "hover:bg-slate-50/70"
      }`}
    >
      {/* Checkbox */}
      <td className="w-12 px-3 py-3.5 text-center">
        <div className="flex items-center justify-center">
          {canSelect ? (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(expense._id)}
              aria-label={`Select claim ${expense.title}`}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer accent-slate-900"
            />
          ) : (
            <span
              className="w-4 h-4 inline-block border border-slate-200 bg-slate-100 rounded opacity-40 cursor-not-allowed"
              title="Only pending claims can be selected"
            />
          )}
        </div>
      </td>

      {/* SL Index */}
      <td className="w-14 px-3 py-3.5 text-center whitespace-nowrap">
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200/60 inline-block">
          {String(serialNumber).padStart(2, "0")}
        </span>
      </td>

      {/* Requester Avatar & Name */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <RequesterAvatar name={requesterName} photoUrl={requesterPhoto} />
          <p className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
            {requesterName}
          </p>
        </div>
      </td>

      {/* Title & Location */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span
            className="flex items-center justify-center w-9 h-9 text-base rounded-xl bg-slate-100/80 border border-slate-200/50 shrink-0 select-none"
            aria-hidden="true"
          >
            {categoryMeta.icon}
          </span>
          <div className="min-w-0 max-w-xs md:max-w-sm">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {expense.title}
            </p>
            {expense.location?.label && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{expense.location.label}</span>
                {expense.gpsVerified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50">
                    <ShieldCheck className="w-2.5 h-2.5" /> GPS
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-5 py-3.5 text-xs font-medium text-slate-600 whitespace-nowrap">
        <span className="capitalize">{categoryMeta.label}</span>
      </td>

      {/* Amount */}
      <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap">
        <span className="text-sm font-bold text-slate-950">
          ৳{formatCurrency(expense.amount)}
        </span>
      </td>

      {/* Expense Date */}
      <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
        {formatDate(expense.expenseDate)}
      </td>

      {/* Status Badge */}
      <td className="px-5 py-3.5 text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border shadow-2xs ${statusMeta.badgeClass}`}
        >
          {statusMeta.icon}
          <span>{statusMeta.label}</span>
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onView(expense)}
            aria-label={`View details for ${expense.title}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(expense._id)}
              aria-label={`Delete ${expense.title}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-colors cursor-pointer"
              title={
                isApprover && !isPending
                  ? "Delete (admin override)"
                  : "Delete Claim"
              }
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// ==========================================
// Main Component
// ==========================================

export default function MyExpensesTable({
  expenses,
  onView,
  onDelete,
  onBulkDelete,
}: MyExpensesTableProps) {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const pageSize = 10;

  // 👇 Role detection
  const isApprover = Boolean(
    user?.role && APPROVER_ROLES.includes(user.role)
  );

  // Search and Category Filtering
  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return expenses.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!query) return true;

      const titleMatch = item.title.toLowerCase().includes(query);
      const locationMatch =
        item.location?.label?.toLowerCase().includes(query) ?? false;
      const amountMatch = item.amount.toString().includes(query);

      let requester = user?.fullName || "";
      if (typeof item.employeeId === "object" && item.employeeId !== null) {
        requester = item.employeeId.fullName;
      } else if (item.employeeName) {
        requester = item.employeeName;
      }

      return (
        titleMatch ||
        requester.toLowerCase().includes(query) ||
        locationMatch ||
        amountMatch
      );
    });
  }, [expenses, searchQuery, selectedCategory, user?.fullName]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);

  const paginatedExpenses = useMemo(() => {
    const startIdx = (activePage - 1) * pageSize;
    return filteredExpenses.slice(startIdx, startIdx + pageSize);
  }, [filteredExpenses, activePage, pageSize]);

  // 👇 Bulk-select eligibility — admins can select any row
  const selectableOnPage = useMemo(() => {
    if (isApprover) {
      return paginatedExpenses.map((e) => e._id);
    }
    return paginatedExpenses
      .filter((e) => e.status === "pending")
      .map((e) => e._id);
  }, [paginatedExpenses, isApprover]);

  const isAllPageSelected = useMemo(() => {
    if (selectableOnPage.length === 0) return false;
    return selectableOnPage.every((id) => selectedIds.includes(id));
  }, [selectableOnPage, selectedIds]);

  // Checkbox Handlers
  const handleToggleSelectAll = useCallback(() => {
    if (isAllPageSelected) {
      const pageIdSet = new Set(selectableOnPage);
      setSelectedIds((prev) => prev.filter((id) => !pageIdSet.has(id)));
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...selectableOnPage]))
      );
    }
  }, [isAllPageSelected, selectableOnPage]);

  const handleToggleRow = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  // Bulk Delete Dispatcher
  const handleBulkDeleteAction = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedIds);
    } else {
      selectedIds.forEach((id) => onDelete(id));
    }
    setSelectedIds([]);
  };

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
          <Receipt className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">
          No expenses submitted yet
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Track travel, meals, and receipts by choosing "Submit New Expense" above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search claims, submitters, or locations..."
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_MAP).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSelectedCategory(key);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === key
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
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
              onClick={handleBulkDeleteAction}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedIds.length})
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

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
                {/* Select All Checkbox */}
                <th scope="col" className="w-12 px-3 py-3.5 text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      disabled={selectableOnPage.length === 0}
                      onChange={handleToggleSelectAll}
                      aria-label="Select all selectable claims on this page"
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-slate-900 focus:ring-0 cursor-pointer accent-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                  </div>
                </th>

                {/* SL Header */}
                <th
                  scope="col"
                  className="w-14 px-3 py-3.5 text-center font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300"
                >
                  SL
                </th>

                {/* Requester / Submitter Header */}
                <th scope="col" className="px-5 py-3.5 min-w-[170px]">
                  Requester
                </th>

                <th scope="col" className="px-5 py-3.5 min-w-[220px]">
                  Expense
                </th>
                <th scope="col" className="px-5 py-3.5 min-w-[130px]">
                  Category
                </th>
                <th scope="col" className="px-5 py-3.5 text-right min-w-[120px]">
                  Amount
                </th>
                <th scope="col" className="px-5 py-3.5 min-w-[120px]">
                  Date
                </th>
                <th scope="col" className="px-5 py-3.5 text-center min-w-[110px]">
                  Status
                </th>
                <th scope="col" className="px-5 py-3.5 text-right min-w-[100px]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <p className="text-xs font-semibold text-slate-700">
                      No matching personal expenses found
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try updating your search query or choosing another category.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((expense, index) => {
                  const serialNumber = (activePage - 1) * pageSize + index + 1;
                  const isSelected = selectedIds.includes(expense._id);

                  return (
                    <ExpenseRow
                      key={expense._id}
                      expense={expense}
                      currentUserPhoto={user?.profilePhoto}
                      currentUserName={user?.fullName}
                      currentUserId={user?._id}
                      currentUserRole={user?.role}
                      serialNumber={serialNumber}
                      isSelected={isSelected}
                      onToggleSelect={handleToggleRow}
                      onView={onView}
                      onDelete={onDelete}
                    />
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
              {filteredExpenses.length === 0
                ? 0
                : (activePage - 1) * pageSize + 1}
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