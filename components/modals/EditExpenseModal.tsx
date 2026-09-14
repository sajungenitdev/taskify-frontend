"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Upload, MapPin, Receipt, Info } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import type { Expense } from "@/types/expense";

interface Props {
    isOpen: boolean;
    expense: Expense | null;
    onClose: () => void;
    onUpdated: () => void;
}

const CATEGORIES = [
    { value: "transport", label: "Transport (CNG / Taxi / Bus)" },
    { value: "meals", label: "Meals (Client Lunch / Dinner)" },
    { value: "entertainment", label: "Entertainment" },
    { value: "office_supply", label: "Office Supply / Printing" },
    { value: "accommodation", label: "Accommodation / Hotel" },
    { value: "personal", label: "Personal" },
    { value: "other", label: "Other" },
];

const MAX_FILE_MB = 3;

export default function EditExpenseModal({
    isOpen,
    expense,
    onClose,
    onUpdated,
}: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("transport");
    const [amount, setAmount] = useState("");
    const [guests, setGuests] = useState("");
    const [expenseDate, setExpenseDate] = useState("");
    const [locationLabel, setLocationLabel] = useState("");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [receiptUrl, setReceiptUrl] = useState("");
    const [receiptName, setReceiptName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [locating, setLocating] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hydrate form when a new expense is passed in
    useEffect(() => {
        if (!isOpen || !expense) return;
        setTitle(expense.title || "");
        setDescription(expense.description || "");
        setCategory(expense.category || "transport");
        setAmount(String(expense.amount ?? ""));
        setGuests(expense.guests ? String(expense.guests) : "");
        setExpenseDate(
            expense.expenseDate
                ? new Date(expense.expenseDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0]
        );
        setLocationLabel(expense.location?.label || "");
        setCoords(
            typeof expense.location?.lat === "number" &&
                typeof expense.location?.lng === "number"
                ? { lat: expense.location.lat, lng: expense.location.lng }
                : null
        );
        setReceiptUrl(expense.receiptUrl || "");
        setReceiptName(expense.receiptUrl ? "Existing receipt" : "");
    }, [isOpen, expense]);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported by your browser");
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                toast.success("Location captured");
                setLocating(false);
            },
            () => {
                toast.error("Could not get location");
                setLocating(false);
            }
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            toast.error(`File must be under ${MAX_FILE_MB} MB`);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
        ];
        if (!allowed.includes(file.type)) {
            toast.error("Only images and PDFs are allowed");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.onload = () => {
            setReceiptUrl(reader.result as string);
            setReceiptName(file.name);
            setUploading(false);
        };
        reader.onerror = () => {
            toast.error("Failed to read the file");
            setUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveReceipt = () => {
        setReceiptUrl("");
        setReceiptName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async () => {
        if (!expense) return;
        if (!title.trim()) return toast.error("Title is required");
        const amountNum = parseFloat(amount);
        if (!amountNum || amountNum <= 0)
            return toast.error("Amount must be greater than 0");
        if (!expenseDate) return toast.error("Expense date is required");

        setSubmitting(true);
        try {
            const res = await api.put(`/expenses/${expense._id}`, {
                title: title.trim(),
                description: description.trim(),
                category,
                amount: amountNum,
                guests: category === "meals" ? parseInt(guests) || 0 : 0,
                expenseDate,
                location: {
                    lat: coords?.lat ?? null,
                    lng: coords?.lng ?? null,
                    label: locationLabel.trim(),
                },
                receiptUrl,
            });

            if (res.data.success) {
                toast.success("Expense updated successfully");
                onUpdated();
                onClose();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update expense");
        } finally {
            setSubmitting(false);
        }
    };

    const isImage =
        receiptUrl.startsWith("data:image/") && !receiptUrl.includes("pdf");

    return (
        <AnimatePresence>
            {isOpen && expense && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.18 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                    <Receipt className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">
                                        Edit Expense
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        Update details while the claim is still pending
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                    Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                    maxLength={200}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                        Category <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c.value} value={c.value}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                        Amount (৳) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                    />
                                </div>
                            </div>

                            {category === "meals" && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                        Number of Guests
                                    </label>
                                    <input
                                        type="number"
                                        value={guests}
                                        onChange={(e) => setGuests(e.target.value)}
                                        min="0"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                    Expense Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={expenseDate}
                                    onChange={(e) => setExpenseDate(e.target.value)}
                                    max={new Date().toISOString().split("T")[0]}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                    maxLength={1000}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                    Location
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={locationLabel}
                                        onChange={(e) => setLocationLabel(e.target.value)}
                                        placeholder="e.g. DPDC Head Office, Dhaka"
                                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGetLocation}
                                        disabled={locating}
                                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {locating ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <MapPin size={14} />
                                        )}
                                        {coords ? "Update" : "GPS"}
                                    </button>
                                </div>
                                {coords && (
                                    <p className="text-[11px] text-emerald-600 mt-1.5 flex items-center gap-1">
                                        <MapPin size={11} />
                                        Location captured: {coords.lat.toFixed(4)},{" "}
                                        {coords.lng.toFixed(4)}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                                    Receipt
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {receiptUrl ? (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                {isImage ? (
                                                    <img
                                                        src={receiptUrl}
                                                        alt="Receipt"
                                                        className="w-12 h-12 rounded-lg object-cover border border-emerald-300 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-white border border-emerald-300 flex items-center justify-center shrink-0">
                                                        <Receipt size={20} className="text-emerald-600" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-emerald-800 truncate">
                                                        {receiptName || "Receipt attached"}
                                                    </p>
                                                    <p className="text-[11px] text-emerald-600">
                                                        Ready to save
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleRemoveReceipt}
                                                className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg shrink-0"
                                                title="Remove"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="w-full py-3 border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl text-sm text-gray-500 hover:text-indigo-600 transition flex items-center justify-center gap-2"
                                    >
                                        {uploading ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Upload size={14} />
                                        )}
                                        {uploading
                                            ? "Reading file..."
                                            : `Click to attach receipt (max ${MAX_FILE_MB} MB)`}
                                    </button>
                                )}
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                                <Info size={14} className="text-blue-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    You can only edit a claim while it's pending. Once approved or
                                    rejected, editing is disabled.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={submitting}
                                className="flex-1 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !title.trim() || !amount}
                                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 size={14} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}