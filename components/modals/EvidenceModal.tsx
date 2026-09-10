"use client";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";

interface Props {
    isOpen: boolean;
    evidenceText: string;
    submitting: boolean;
    onClose: () => void;
    onTextChange: (v: string) => void;
    onSubmit: () => void;
}

export function EvidenceModal({ isOpen, evidenceText, submitting, onClose, onTextChange, onSubmit }: Props) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-[440px] p-6 sm:p-8 overflow-y-auto max-h-[90vh]"
            >
                <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-xl font-bold">
                        📎
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Upload Evidence</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Attach proof of task completion. Required before submitting.
                        </p>
                    </div>
                </div>

                <div className="space-y-5 mt-6">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: "📷", label: "Photo / Image" },
                            { icon: "📄", label: "PDF / Document" },
                            { icon: "🔗", label: "URL / Link" },
                            { icon: "📍", label: "GPS Location" },
                        ].map((o) => (
                            <div
                                key={o.label}
                                className="border border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-gray-50/50 hover:bg-blue-50/20 group"
                            >
                                <span className="text-2xl mb-1.5 block">{o.icon}</span>
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-600 block">{o.label}</span>
                            </div>
                        ))}
                    </div>

                    <div>
                        <input
                            type="text"
                            value={evidenceText}
                            onChange={(e) => onTextChange(e.target.value)}
                            placeholder="Add a note about this evidence (optional)"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold rounded-xl text-sm shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={submitting}
                            className="flex-1 py-3 bg-[#1A60FF] hover:bg-blue-600 text-white font-semibold rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Evidence"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}