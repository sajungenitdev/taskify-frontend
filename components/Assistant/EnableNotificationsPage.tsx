// components/Assistant/EnableNotificationsPage.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface EnableNotificationsPageProps {
    isOpen: boolean;
    onClose: () => void;
    onEnable?: () => void;
    onSkip?: () => void;
}

export default function EnableNotificationsPage({
    isOpen,
    onClose,
    onEnable,
    onSkip,
}: EnableNotificationsPageProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsVisible(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    const handleEnable = async () => {
        setIsLoading(true);
        try {
            if ("Notification" in window) {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    toast.success("🔔 Notifications enabled successfully!");
                    onEnable?.();
                    onClose();
                } else {
                    toast.info("Notifications disabled. You can enable them later from settings.");
                    onSkip?.();
                    onClose();
                }
            } else {
                toast.info("Notifications are not supported in this browser.");
                onEnable?.();
                onClose();
            }
        } catch (error) {
            console.error("Notification error:", error);
            onSkip?.();
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        onSkip?.();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1528]/80 backdrop-blur-sm pointer-events-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full max-w-[500px]"
                    >
                        {/* Step Bar Header */}
                        <div className="mb-4 bg-[#0F1D32] border border-gray-800 rounded-xl p-4 shadow-lg">
                            <div className="text-xs text-gray-400 font-medium mb-2">
                                Almost done! — Step 3 of 3
                            </div>
                            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full w-full rounded-full"></div>
                            </div>
                        </div>

                        {/* Main Card */}
                        <div className="relative bg-white rounded-3xl p-8 sm:p-10 shadow-2xl text-center">
                            {/* Close Button */}
                            <button
                                onClick={handleSkip}
                                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>

                            {/* Bell Icon */}
                            <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center text-4xl">
                                🔔
                            </div>

                            {/* Heading */}
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
                                Enable Desktop Notifications
                            </h1>
                            <p className="text-gray-500 text-sm font-normal max-w-[380px] mx-auto leading-relaxed mb-6">
                                Get instant alerts for deadlines, task assignments, and approvals — right on your desktop, even when this tab isn't active. No app required.
                            </p>

                            {/* Notification Feature Box */}
                            <div className="bg-[#0F1D32] text-left rounded-2xl p-5 mb-6 text-sm text-gray-200 space-y-2.5 shadow-inner">
                                <p className="text-xs font-medium text-gray-400 mb-3">
                                    You will receive:
                                </p>
                                <div className="flex items-center gap-2.5">
                                    <span>🌅</span>
                                    <span>Morning briefing at 8:00 AM</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span>⏰</span>
                                    <span>Deadline warnings (24h + 4h before)</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span>🚨</span>
                                    <span>Overdue task alerts instantly</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span>✅</span>
                                    <span>Task assignment notifications</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleEnable}
                                    disabled={isLoading}
                                    className="w-full bg-[#1A60FF] hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Enabling...
                                        </>
                                    ) : (
                                        "Allow Notifications"
                                    )}
                                </button>
                                <button
                                    onClick={handleSkip}
                                    disabled={isLoading}
                                    className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium py-3.5 rounded-xl transition-all text-sm"
                                >
                                    Skip for now (not recommended)
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}