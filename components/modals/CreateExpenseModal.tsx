"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Loader2,
    Upload,
    MapPin,
    Receipt,
    Info,
    CheckCircle2,
    FileText,
    Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

// ==========================================
// Types & Domain Definitions
// ==========================================

export type ExpenseCategory =
    | "transport"
    | "meals"
    | "entertainment"
    | "office_supply"
    | "accommodation"
    | "personal"
    | "other";

export interface GeoCoordinates {
    lat: number;
    lng: number;
}

export interface ExpensePayload {
    title: string;
    description: string;
    category: ExpenseCategory;
    amount: number;
    currency: "BDT";
    guests: number;
    expenseDate: string;
    location: {
        lat: number | null;
        lng: number | null;
        label: string;
    };
    receiptUrl: string;
}

interface CreateExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

// ==========================================
// Constants & Static Options
// ==========================================

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
    { value: "transport", label: "Transport (CNG / Taxi / Bus)" },
    { value: "meals", label: "Meals (Client Lunch / Dinner)" },
    { value: "entertainment", label: "Entertainment" },
    { value: "office_supply", label: "Office Supply / Printing" },
    { value: "accommodation", label: "Accommodation / Hotel" },
    { value: "personal", label: "Personal" },
    { value: "other", label: "Other" },
];

const MAX_FILE_SIZE_MB = 3;
const MAX_PAYLOAD_BYTES = 8 * 1024 * 1024; // 8 MB safety threshold for base64

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
];

// ==========================================
// Main Component
// ==========================================

export default function CreateExpenseModal({
    isOpen,
    onClose,
    onCreated,
}: CreateExpenseModalProps) {
    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<ExpenseCategory>("transport");
    const [amount, setAmount] = useState("");
    const [guests, setGuests] = useState("");
    const [expenseDate, setExpenseDate] = useState(
        () => new Date().toISOString().split("T")[0]
    );
    const [locationLabel, setLocationLabel] = useState("");
    const [coords, setCoords] = useState<GeoCoordinates | null>(null);

    // File / Receipt State
    const [receiptUrl, setReceiptUrl] = useState("");
    const [receiptName, setReceiptName] = useState("");

    // Loading States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form when modal opens or closes
    const resetForm = useCallback(() => {
        setTitle("");
        setDescription("");
        setCategory("transport");
        setAmount("");
        setGuests("");
        setExpenseDate(new Date().toISOString().split("T")[0]);
        setLocationLabel("");
        setCoords(null);
        setReceiptUrl("");
        setReceiptName("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen, resetForm]);

    // Handle Geolocation Capture
    const handleGetLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                toast.success("GPS location tagged successfully");
                setIsLocating(false);
            },
            (error) => {
                toast.error("Unable to obtain GPS coordinates");
                setIsLocating(false);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    }, []);

    // Handle Receipt File Upload & Base64 Encoding
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            toast.error(`File size must not exceed ${MAX_FILE_SIZE_MB} MB`);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            toast.error("Only image formats (JPEG, PNG, WebP) and PDFs are supported");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result as string;
            setReceiptUrl(result);
            setReceiptName(file.name);
            toast.success("Receipt attached");
            setIsUploading(false);
        };

        reader.onerror = () => {
            toast.error("Failed to read receipt file");
            setIsUploading(false);
        };

        reader.readAsDataURL(file);
    };

    const handleRemoveReceipt = () => {
        setReceiptUrl("");
        setReceiptName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Form Submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            return toast.error("Expense title is required");
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return toast.error("Please enter a valid amount greater than 0");
        }

        if (!expenseDate) {
            return toast.error("Please select the expense date");
        }

        // Guard payload size to avoid HTTP 413
        if (receiptUrl) {
            const approxBytes = new Blob([receiptUrl]).size;
            if (approxBytes > MAX_PAYLOAD_BYTES) {
                return toast.error("Receipt file is too large for the server");
            }
        }

        const payload: ExpensePayload = {
            title: trimmedTitle,
            description: description.trim(),
            category,
            amount: numericAmount,
            currency: "BDT",
            guests: category === "meals" ? parseInt(guests, 10) || 0 : 0,
            expenseDate,
            location: {
                lat: coords?.lat ?? null,
                lng: coords?.lng ?? null,
                label: locationLabel.trim(),
            },
            receiptUrl,
        };

        setIsSubmitting(true);
        try {
            const response = await api.post<{ success: boolean }>("/expenses", payload);

            if (response.data.success) {
                toast.success("Expense submitted for manager approval");
                onCreated();
                onClose();
            }
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                (err.response?.status === 413
                    ? "Attachment size exceeds the server limit"
                    : "Failed to submit expense request");
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isImageReceipt =
        receiptUrl.startsWith("data:image/") && !receiptUrl.includes("pdf");

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 8 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 id="modal-title" className="text-base font-bold text-slate-900">
                                        Submit New Expense
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Provide payment details and receipts for managerial review
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close dialog"
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Title Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Expense Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Client visit — DPDC Head Office"
                                    maxLength={200}
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition"
                                />
                            </div>

                            {/* Category & Amount Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Category <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition"
                                    >
                                        {CATEGORY_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Amount (৳) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Meal Guests Field */}
                            {category === "meals" && (
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Number of Guests
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={guests}
                                        onChange={(e) => setGuests(e.target.value)}
                                        placeholder="Total attendees including yourself"
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition"
                                    />
                                </div>
                            )}

                            {/* Date Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Expense Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    max={new Date().toISOString().split("T")[0]}
                                    value={expenseDate}
                                    onChange={(e) => setExpenseDate(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition"
                                />
                            </div>

                            {/* Description Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Description / Note
                                </label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Additional context or invoice reference..."
                                    maxLength={1000}
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition"
                                />
                            </div>

                            {/* Location with GPS Verification */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Location (GPS Verification)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={locationLabel}
                                        onChange={(e) => setLocationLabel(e.target.value)}
                                        placeholder="e.g. Motijheel C/A, Dhaka"
                                        className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGetLocation}
                                        disabled={isLocating}
                                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isLocating ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <MapPin size={14} />
                                        )}
                                        {coords ? "Update GPS" : "Tag GPS"}
                                    </button>
                                </div>

                                {coords && (
                                    <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                                        <CheckCircle2 size={12} />
                                        Coordinates tagged: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                                    </p>
                                )}
                            </div>

                            {/* Receipt Upload Field */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Receipt or Proof (Max {MAX_FILE_SIZE_MB}MB)
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept={ALLOWED_MIME_TYPES.join(",")}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {receiptUrl ? (
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {isImageReceipt ? (
                                                <img
                                                    src={receiptUrl}
                                                    alt="Receipt Preview"
                                                    className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                                    <FileText className="w-5 h-5 text-slate-600" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-900 truncate">
                                                    {receiptName || "Attached Receipt"}
                                                </p>
                                                <p className="text-[11px] text-emerald-600 font-medium">
                                                    Ready for submission
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleRemoveReceipt}
                                            aria-label="Remove receipt"
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="w-full py-3.5 border border-dashed border-slate-300 hover:border-slate-900 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 bg-slate-50/50 hover:bg-slate-50"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 size={15} className="animate-spin text-slate-700" />
                                                <span>Reading file...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={15} className="text-slate-500" />
                                                <span>Upload photo or PDF receipt</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Policy Informational Note */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                                <Info size={15} className="text-slate-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    All submitted claims are audited against corporate policy. Ensure dates and
                                    receipt totals match before sending.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !title.trim() || !amount}
                                    className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                                >
                                    {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                                    Submit Claim
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}