"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    MapPin,
    CheckCircle2,
    XCircle,
    Clock3,
    Receipt,
    FileText,
    ExternalLink,
    ShieldCheck,
    Calendar,
    Layers,
    Users2,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/utils/formatters";
import type { Expense, ExpenseStatus } from "@/types/expense";

// ==========================================
// Props Interface
// ==========================================

interface ViewExpenseModalProps {
    isOpen: boolean;
    expense: Expense | null;
    onClose: () => void;
}

// ==========================================
// Static Visual Configurations
// ==========================================

interface StatusVisual {
    label: string;
    badgeClass: string;
    icon: React.ReactElement;
}

const STATUS_CONFIG: Record<string, StatusVisual> = {
    pending: {
        label: "Pending Review",
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
        label: "Reimbursed / Paid",
        badgeClass: "bg-slate-100 text-slate-900 border-slate-300",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
};

// ==========================================
// Sub-Components
// ==========================================

const MetaTile = memo(function MetaTile({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Icon className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{label}</span>
            </div>
            <div className="font-semibold text-slate-800 mt-1 text-xs">{value}</div>
        </div>
    );
});

const ReceiptViewer = memo(function ReceiptViewer({ url }: { url: string }) {
    const isImage = url.startsWith("data:image/") || /\.(jpeg|jpg|png|webp|gif)($|\?)/i.test(url);
    const isPdf = url.startsWith("data:application/pdf") || /\.pdf($|\?)/i.test(url);

    if (isImage) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block rounded-xl overflow-hidden border border-slate-200 bg-slate-50 transition-all hover:border-slate-400 cursor-pointer"
            >
                <img
                    src={url}
                    alt="Receipt preview"
                    className="w-full max-h-72 object-contain mx-auto transition duration-150 group-hover:opacity-95"
                />
                <div className="px-3 py-2 bg-white/90 backdrop-blur-xs border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        Receipt Image
                    </span>
                    <span className="flex items-center gap-1 text-slate-900 group-hover:underline">
                        View full size <ExternalLink className="w-3 h-3" />
                    </span>
                </div>
            </a>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/80 transition group cursor-pointer"
        >
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-slate-700" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                        {isPdf ? "PDF Invoice Document" : "Attached Receipt File"}
                    </p>
                    <p className="text-[11px] text-slate-500">Click to open document in new tab</p>
                </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors shrink-0" />
        </a>
    );
});

// ==========================================
// Main Component
// ==========================================

export default function ViewExpenseModal({
    isOpen,
    expense,
    onClose,
}: ViewExpenseModalProps) {
    if (!expense) return null;

    const statusMeta = STATUS_CONFIG[expense.status] ?? STATUS_CONFIG.pending;
    const employeeDisplayName =
        typeof expense.employeeId === "object" && expense.employeeId !== null
            ? expense.employeeId.fullName
            : expense.employeeName ?? "Unknown Staff";

    const formattedAmount = new Intl.NumberFormat("en-BD", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    }).format(expense.amount);

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 8 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-bold text-slate-900 truncate">
                                    {expense.title}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-medium text-slate-700">{employeeDisplayName}</span>
                                    <span className="text-slate-300">·</span>
                                    <span>{formatDate(expense.expenseDate)}</span>
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close modal"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0 ml-2 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Financial Highlight Banner */}
                            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl shadow-sm">
                                <div>
                                    <span className="text-[10px] uppercase font-semibold text-slate-300 tracking-wider block">
                                        Claim Total
                                    </span>
                                    <span className="text-2xl font-black font-mono tracking-tight text-white mt-0.5 block">
                                        ৳{formattedAmount}
                                    </span>
                                </div>

                                <span
                                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusMeta.badgeClass}`}
                                >
                                    {statusMeta.icon}
                                    <span>{statusMeta.label}</span>
                                </span>
                            </div>

                            {/* Detail Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                <MetaTile
                                    icon={Layers}
                                    label="Category"
                                    value={
                                        <span className="capitalize">
                                            {(expense.category ?? "other").replace(/_/g, " ")}
                                        </span>
                                    }
                                />
                                <MetaTile
                                    icon={Calendar}
                                    label="Expense Date"
                                    value={formatDate(expense.expenseDate)}
                                />
                                {Boolean(expense.guests) && (
                                    <MetaTile
                                        icon={Users2}
                                        label="Guests"
                                        value={`${expense.guests} Attendees`}
                                    />
                                )}
                                <MetaTile
                                    icon={Clock3}
                                    label="Submitted"
                                    value={formatDateTime(expense.submittedAt || expense.createdAt)}
                                />
                            </div>

                            {/* Description */}
                            {expense.description && (
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                        Details & Notes
                                    </span>
                                    <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {expense.description}
                                    </p>
                                </div>
                            )}

                            {/* Location Information */}
                            {expense.location?.label && (
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                        Logged Location
                                    </span>
                                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                                        <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span className="truncate">{expense.location.label}</span>
                                    </div>
                                </div>
                            )}

                            {/* GPS Audit Verification */}
                            {expense.gpsVerified && (
                                <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl flex items-start gap-2.5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                    <div className="text-xs">
                                        <p className="font-semibold text-emerald-900">
                                            GPS Tag Verified
                                        </p>
                                        {expense.gpsVerification?.note && (
                                            <p className="text-emerald-700 mt-0.5">
                                                {expense.gpsVerification.note}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Receipt Evidence */}
                            {expense.receiptUrl && (
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                                        Attached Receipt
                                    </span>
                                    <ReceiptViewer url={expense.receiptUrl} />
                                </div>
                            )}

                            {/* Rejection Notification Box */}
                            {expense.status === "rejected" && expense.rejectionReason && (
                                <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl">
                                    <p className="text-xs font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                        Rejection Justification
                                    </p>
                                    <p className="text-xs text-rose-700 leading-relaxed">
                                        {expense.rejectionReason}
                                    </p>
                                    {expense.approvedBy && (
                                        <p className="text-[11px] text-rose-500 mt-2">
                                            Audited by {expense.approvedBy.fullName}
                                            {expense.approvedAt && ` on ${formatDateTime(expense.approvedAt)}`}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Approval Info Box */}
                            {expense.status === "approved" && expense.approvedBy && (
                                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                    <div className="text-xs">
                                        <p className="font-semibold text-slate-900">
                                            Approved by {expense.approvedBy.fullName}
                                        </p>
                                        {expense.approvedAt && (
                                            <p className="text-slate-500 mt-0.5">
                                                Authorized on {formatDateTime(expense.approvedAt)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}