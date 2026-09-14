"use client";

import React, { memo, useCallback } from "react";
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
    Download,
    Printer,
    FileSpreadsheet,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/utils/formatters";
import type { Expense } from "@/types/expense";

// ==========================================
// Props
// ==========================================
interface ViewExpenseModalProps {
    isOpen: boolean;
    expense: Expense | null;
    onClose: () => void;
}

// ==========================================
// Status Config
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
// Helpers
// ==========================================

const detectFileKind = (url: string): "image" | "pdf" | "unknown" => {
    if (!url) return "unknown";
    if (url.startsWith("data:image/")) return "image";
    if (url.startsWith("data:application/pdf")) return "pdf";
    if (/\.(jpeg|jpg|png|webp|gif)($|\?)/i.test(url)) return "image";
    if (/\.pdf($|\?)/i.test(url)) return "pdf";
    return "unknown";
};

const getExtension = (url: string, fallback = "bin"): string => {
    if (url.startsWith("data:image/")) {
        const mime = url.split(";")[0].split(":")[1];
        return mime.split("/")[1] || "png";
    }
    if (url.startsWith("data:application/pdf")) return "pdf";
    const clean = url.split("?")[0];
    const ext = clean.split(".").pop();
    return ext && ext.length <= 5 ? ext.toLowerCase() : fallback;
};

/**
 * Convert a base64 data URL into a temporary blob URL.
 * Browsers block top-level navigation to `data:` URLs — opening them via
 * a `blob:` URL renders the file correctly in a new tab.
 */
const openFileInNewTab = (url: string) => {
    if (!url) return;

    // Non-base64 URLs work fine as-is
    if (!url.startsWith("data:")) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
    }

    try {
        const [header, base64] = url.split(",");
        const mimeMatch = header.match(/data:([^;]+)/);
        const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const blob = new Blob([bytes], { type: mime });
        const blobUrl = URL.createObjectURL(blob);

        const newTab = window.open(blobUrl, "_blank", "noopener,noreferrer");

        // Give the tab time to load before revoking
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);

        if (!newTab) {
            // Popup blocked — fall back to a download
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = "receipt";
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
    } catch (err) {
        console.error("openFileInNewTab error:", err);
    }
};

const downloadFile = (url: string, filename: string) => {
    try {
        if (url.startsWith("data:")) {
            const [header, base64] = url.split(",");
            const mimeMatch = header.match(/data:([^;]+)/);
            const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } else {
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
    } catch (err) {
        console.error("downloadFile error:", err);
    }
};

const formatAmount = (amount: number): string =>
    new Intl.NumberFormat("en-BD", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    }).format(amount);

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

const ReceiptViewer = memo(function ReceiptViewer({
    url,
    onDownload,
}: {
    url: string;
    onDownload: () => void;
}) {
    const kind = detectFileKind(url);

    if (kind === "image") {
        return (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <button
                    type="button"
                    onClick={() => openFileInNewTab(url)}
                    className="group relative block w-full cursor-pointer"
                    title="Click to view full size"
                >
                    <img
                        src={url}
                        alt="Receipt preview"
                        className="w-full max-h-72 object-contain mx-auto transition duration-150 group-hover:opacity-95"
                    />
                </button>
                <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        Receipt Image
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => openFileInNewTab(url)}
                            className="flex items-center gap-1 text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                        >
                            View full size <ExternalLink className="w-3 h-3" />
                        </button>
                        <button
                            type="button"
                            onClick={onDownload}
                            className="flex items-center gap-1 text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                        >
                            Download <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
            <div className="flex items-center justify-between p-3.5">
                <button
                    type="button"
                    onClick={() => openFileInNewTab(url)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                >
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                            {kind === "pdf" ? "PDF Invoice Document" : "Attached Receipt File"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                            Click to open in a new tab
                        </p>
                    </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => openFileInNewTab(url)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                        title="Open in new tab"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onDownload}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                        title="Download file"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
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
    // ----------------------------------------------------
    // Clean data for exports
    // ----------------------------------------------------
    const getExpenseExportData = useCallback(() => {
        if (!expense) return [];

        const employeeName =
            typeof expense.employeeId === "object" && expense.employeeId !== null
                ? expense.employeeId.fullName
                : expense.employeeName ?? "Unknown Staff";

        const employeeEmail =
            typeof expense.employeeId === "object" && expense.employeeId !== null
                ? (expense.employeeId as any).email || "—"
                : "—";

        return [
            { Field: "Expense ID", Value: expense._id },
            { Field: "Employee Name", Value: employeeName },
            { Field: "Employee Email", Value: employeeEmail },
            { Field: "Claim Title", Value: expense.title },
            {
                Field: "Category",
                Value: (expense.category ?? "other").replace(/_/g, " "),
            },
            { Field: "Amount (BDT)", Value: expense.amount },
            { Field: "Expense Date", Value: formatDate(expense.expenseDate) },
            {
                Field: "Status",
                Value:
                    STATUS_CONFIG[expense.status]?.label ||
                    expense.status.toUpperCase(),
            },
            { Field: "Location", Value: expense.location?.label || "N/A" },
            { Field: "GPS Verified", Value: expense.gpsVerified ? "Yes" : "No" },
            { Field: "Guests", Value: expense.guests || 0 },
            { Field: "Description", Value: expense.description || "N/A" },
            { Field: "Rejection Reason", Value: expense.rejectionReason || "N/A" },
            {
                Field: "Approved/Rejected By",
                Value: expense.approvedBy?.fullName || "N/A",
            },
            {
                Field: "Approval Date",
                Value: expense.approvedAt
                    ? formatDateTime(expense.approvedAt)
                    : "N/A",
            },
            {
                Field: "Submitted Date",
                Value: formatDateTime(expense.submittedAt || expense.createdAt),
            },
        ];
    }, [expense]);

    // ----------------------------------------------------
    // Download Receipt
    // ----------------------------------------------------
    const handleDownloadReceipt = useCallback(() => {
        if (!expense?.receiptUrl) return;
        const kind = detectFileKind(expense.receiptUrl);
        const ext = getExtension(
            expense.receiptUrl,
            kind === "pdf" ? "pdf" : "png"
        );
        const safeTitle =
            expense.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase() || "expense";
        downloadFile(
            expense.receiptUrl,
            `receipt_${safeTitle}_${expense._id}.${ext}`
        );
    }, [expense]);

    // ----------------------------------------------------
    // CSV Export
    // ----------------------------------------------------
    const handleDownloadCSV = useCallback(() => {
        if (!expense) return;

        const exportRows = getExpenseExportData();
        const safeTitle =
            expense.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase() || "expense";

        const csvContent =
            "Field,Value\r\n" +
            exportRows
                .map((row) => {
                    const val = String(row.Value).replace(/"/g, '""');
                    return `"${row.Field}","${val}"`;
                })
                .join("\r\n");

        // UTF-8 BOM so Excel opens it correctly
        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `expense_${safeTitle}_${expense._id}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }, [expense, getExpenseExportData]);

    // ----------------------------------------------------
    // Excel Export
    // ----------------------------------------------------
    const handleDownloadExcel = useCallback(async () => {
        if (!expense) return;

        const exportRows = getExpenseExportData();
        const safeTitle =
            expense.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase() || "expense";

        try {
            // Try to use the optional `xlsx` package
            const XLSX = await import("xlsx");
            const worksheet = XLSX.utils.json_to_sheet(exportRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Expense Details");

            worksheet["!cols"] = [{ wch: 25 }, { wch: 45 }];

            XLSX.writeFile(workbook, `expense_${safeTitle}_${expense._id}.xlsx`);
        } catch (e) {
            // Fallback: generate a simple HTML table Excel can open
            console.warn("xlsx not installed, using .xls HTML fallback:", e);

            let tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"/></head>
        <body>
          <table border="1">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold;">
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${exportRows
                    .map(
                        (r) =>
                            `<tr><td style="font-weight: bold; background-color: #f8fafc;">${r.Field}</td><td>${r.Value}</td></tr>`
                    )
                    .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `;

            const blob = new Blob([tableHtml], {
                type: "application/vnd.ms-excel;charset=utf-8",
            });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `expense_${safeTitle}_${expense._id}.xls`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        }
    }, [expense, getExpenseExportData]);

    // ----------------------------------------------------
    // PDF Export
    // ----------------------------------------------------
    const handleDownloadSummary = useCallback(async () => {
        if (!expense) return;

        const { default: jsPDF } = await import("jspdf");

        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = 20;

        // ---- Header ----
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Expense Report", margin, y);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(
            `Generated on ${new Date().toLocaleString()}`,
            pageWidth - margin,
            y,
            { align: "right" }
        );

        y += 4;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // ---- Amount block ----
        doc.setFillColor(15, 23, 42);
        doc.rect(margin, y, pageWidth - 2 * margin, 22, "F");

        doc.setTextColor(203, 213, 225);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("CLAIM TOTAL", margin + 5, y + 6);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text(`BDT ${formatAmount(expense.amount)}`, margin + 5, y + 16);

        const statusLabel =
            STATUS_CONFIG[expense.status]?.label || expense.status.toUpperCase();
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(statusLabel, pageWidth - margin - 5, y + 11, { align: "right" });

        y += 32;

        const employeeName =
            typeof expense.employeeId === "object" && expense.employeeId !== null
                ? expense.employeeId.fullName
                : expense.employeeName ?? "Unknown Staff";

        const employeeEmail =
            typeof expense.employeeId === "object" && expense.employeeId !== null
                ? (expense.employeeId as any).email || "—"
                : "—";

        const rows: [string, string][] = [
            ["Employee", employeeName],
            ["Email", employeeEmail],
            ["Title", expense.title],
            ["Category", (expense.category ?? "other").replace(/_/g, " ")],
            ["Expense Date", formatDate(expense.expenseDate)],
            [
                "Submitted",
                formatDateTime(expense.submittedAt || expense.createdAt),
            ],
        ];

        if (expense.guests) rows.push(["Guests", String(expense.guests)]);
        if (expense.location?.label)
            rows.push(["Location", expense.location.label]);
        if (expense.gpsVerified) rows.push(["GPS Verified", "Yes ✓"]);
        if (expense.description) rows.push(["Description", expense.description]);

        if (expense.status === "rejected" && expense.rejectionReason) {
            rows.push(["Rejection Reason", expense.rejectionReason]);
            if (expense.approvedBy) {
                rows.push(["Rejected By", expense.approvedBy.fullName]);
                if (expense.approvedAt)
                    rows.push(["Rejected At", formatDateTime(expense.approvedAt)]);
            }
        }

        if (expense.status === "approved" && expense.approvedBy) {
            rows.push(["Approved By", expense.approvedBy.fullName]);
            if (expense.approvedAt)
                rows.push(["Approved At", formatDateTime(expense.approvedAt)]);
        }

        const labelWidth = 45;
        const valueX = margin + labelWidth;
        const valueMaxWidth = pageWidth - margin - valueX;
        const lineHeight = 5;

        doc.setFontSize(10);
        rows.forEach(([label, value]) => {
            const wrapped: string[] = doc.splitTextToSize(
                String(value),
                valueMaxWidth
            );
            const rowHeight = Math.max(wrapped.length * lineHeight, lineHeight) + 3;

            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y - 4, pageWidth - 2 * margin, rowHeight, "F");

            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 116, 139);
            doc.text(label.toUpperCase(), margin + 2, y);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(15, 23, 42);
            doc.text(wrapped, valueX, y);

            y += rowHeight;

            if (y > 265) {
                doc.addPage();
                y = 20;
            }
        });

        // ---- Receipt preview (images only) ----
        if (
            expense.receiptUrl &&
            detectFileKind(expense.receiptUrl) === "image"
        ) {
            try {
                y += 6;
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(100, 116, 139);
                doc.text("ATTACHED RECEIPT", margin, y);
                y += 5;

                const imgProps = doc.getImageProperties(expense.receiptUrl);
                const maxW = pageWidth - 2 * margin;
                const maxH = 100;
                const ratio = Math.min(maxW / imgProps.width, maxH / imgProps.height);
                const w = imgProps.width * ratio;
                const h = imgProps.height * ratio;
                const x = margin + (maxW - w) / 2;

                doc.addImage(expense.receiptUrl, "PNG", x, y, w, h);
                y += h + 5;
            } catch (err) {
                console.warn("Could not embed receipt image in PDF:", err);
            }
        }

        // ---- Footer ----
        const pageCount = (doc as any).getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(
                `Expense ID: ${expense._id}    |    Page ${i} of ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: "center" }
            );
        }

        const safeTitle =
            expense.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase() || "expense";
        doc.save(`expense_${safeTitle}_${expense._id}.pdf`);
    }, [expense]);

    if (!expense) return null;

    const statusMeta = STATUS_CONFIG[expense.status] ?? STATUS_CONFIG.pending;
    const employeeDisplayName =
        typeof expense.employeeId === "object" && expense.employeeId !== null
            ? expense.employeeId.fullName
            : expense.employeeName ?? "Unknown Staff";

    const formattedAmount = formatAmount(expense.amount);

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
                        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-bold text-slate-900 truncate">
                                    {expense.title}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-medium text-slate-700">
                                        {employeeDisplayName}
                                    </span>
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
                                    value={formatDateTime(
                                        expense.submittedAt || expense.createdAt
                                    )}
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

                            {/* Location */}
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

                            {/* GPS Verification */}
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

                            {/* Receipt */}
                            {expense.receiptUrl && (
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                                        Attached Receipt
                                    </span>
                                    <ReceiptViewer
                                        url={expense.receiptUrl}
                                        onDownload={handleDownloadReceipt}
                                    />
                                </div>
                            )}

                            {/* Rejection Info */}
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
                                            {expense.approvedAt &&
                                                ` on ${formatDateTime(expense.approvedAt)}`}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Approval Info */}
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

                        {/* Footer with Export Controls */}
                        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* PDF */}
                                <button
                                    type="button"
                                    onClick={handleDownloadSummary}
                                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                                    title="Download formatted PDF report"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    PDF
                                </button>

                                {/* Excel */}
                                <button
                                    type="button"
                                    onClick={handleDownloadExcel}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                                    title="Download as Excel sheet"
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    Excel
                                </button>

                                {/* CSV */}
                                <button
                                    type="button"
                                    onClick={handleDownloadCSV}
                                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                    title="Download as CSV file"
                                >
                                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                                    CSV
                                </button>

                                {/* Receipt */}
                                {expense.receiptUrl && (
                                    <button
                                        type="button"
                                        onClick={handleDownloadReceipt}
                                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        title="Download attached original receipt file"
                                    >
                                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                                        Receipt
                                    </button>
                                )}

                                {/* Print */}
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                    title="Print claim report"
                                >
                                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                                    Print
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
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