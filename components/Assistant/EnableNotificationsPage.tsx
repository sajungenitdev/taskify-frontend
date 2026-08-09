// components/Assistant/EnableNotificationsPage.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, User, Camera, Bell, ArrowRight, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";

interface EnableNotificationsPageProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    onEnable?: () => void;
    onSkip?: () => void;
}

export default function EnableNotificationsPage({
    isOpen,
    onClose,
    onComplete,
    onEnable,
    onSkip,
}: EnableNotificationsPageProps) {
    const { user, refreshUser } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isVisible, setIsVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const totalSteps = 2;

    // Profile Form State
    const [formData, setFormData] = useState({
        fullName: "",
        employeeId: "",
        phoneNumber: "",
        dailyHoursTarget: 8,
        position: "",
        location: "",
        bio: "",
    });

    const [avatar, setAvatar] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Notification State
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
    const [isNotificationLoading, setIsNotificationLoading] = useState(false);

    // Animation states
    const [showStep1, setShowStep1] = useState(true);
    const [showStep2, setShowStep2] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsVisible(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            // Reset to step 1 when closed
            setTimeout(() => {
                setCurrentStep(1);
                setShowStep1(true);
                setShowStep2(false);
            }, 300);
        }
    }, [isOpen]);

    // Load user data when available
    useEffect(() => {
        if (user && isOpen) {
            const userSettings = (user as any)?.settings ?? {};
            setFormData({
                fullName: user.fullName || "",
                employeeId: user.employeeId || "",
                phoneNumber: user.phoneNumber || user.phone || "",
                dailyHoursTarget: userSettings.dailyHoursTarget || 8,
                position: user.position || "",
                location: user.location || "",
                bio: user.bio || "",
            });
            if (user.profilePhoto) {
                setAvatar(user.profilePhoto);
                setPreviewUrl(user.profilePhoto);
            }
        }
    }, [user, isOpen]);

    // Check notification permission on mount
    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "dailyHoursTarget" ? parseInt(value) || 8 : value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            setPreviewUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const uploadAvatar = async (): Promise<string | null> => {
        if (!avatarFile) return avatar;

        try {
            const formData = new FormData();
            formData.append("profilePhoto", avatarFile);

            const response = await api.post("/auth/profile/photo", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                toast.success("Profile photo uploaded successfully!");
                return response.data.data.profilePhoto || avatar;
            }
            return null;
        } catch (error: any) {
            console.error("Error uploading avatar:", error);
            if (error.response?.status === 403) {
                toast.error("You don't have permission to upload a profile photo.");
            } else {
                toast.error("Failed to upload profile photo");
            }
            return null;
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // 1. Upload avatar if changed
            let uploadedAvatar = avatar;
            if (avatarFile) {
                const result = await uploadAvatar();
                if (result) {
                    uploadedAvatar = result;
                }
            }

            // 2. Update user profile using /auth/profile endpoint
            const updateData = {
                fullName: formData.fullName,
                phone: formData.phoneNumber,
                phoneNumber: formData.phoneNumber,
                position: formData.position,
                location: formData.location,
                bio: formData.bio,
                settings: {
                    ...(user as any)?.settings,
                    dailyHoursTarget: formData.dailyHoursTarget,
                },
            };

            // ✅ Use auth/profile for self-update
            const response = await api.put("/auth/profile", updateData);

            if (response.data.success) {
                toast.success("Profile updated successfully!");
                await refreshUser?.();
                // Move to next step with animation
                setShowStep1(false);
                setTimeout(() => {
                    setCurrentStep(2);
                    setShowStep2(true);
                }, 300);
            } else {
                toast.error(response.data.message || "Failed to update profile");
            }
        } catch (error: any) {
            console.error("Error saving profile:", error);

            // ✅ Handle specific error cases
            if (error.response?.status === 403) {
                toast.error("You don't have permission to update your profile. Please contact your administrator.");
            } else if (error.response?.status === 401) {
                toast.error("Your session has expired. Please login again.");
            } else {
                toast.error(error.response?.data?.message || "Failed to save profile");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleEnableNotifications = async () => {
        setIsNotificationLoading(true);
        try {
            if ("Notification" in window) {
                const permission = await Notification.requestPermission();
                setNotificationPermission(permission);

                if (permission === "granted") {
                    toast.success("🔔 Notifications enabled successfully!");
                    localStorage.setItem("notificationsEnabled", "true");
                    localStorage.setItem("notificationsPageShown", "true");
                    onEnable?.();

                    // Send welcome notification
                    if ("serviceWorker" in navigator) {
                        try {
                            const registration = await navigator.serviceWorker.ready;
                            registration.showNotification("🎉 Welcome to TaskFlow!", {
                                body: "You'll now receive real-time updates for your tasks.",
                                icon: "/logo.png",
                            });
                        } catch (swError) {
                            console.log("Service worker notification not available");
                        }
                    }
                } else {
                    toast.error("Notifications disabled. You can enable them later from settings.");
                    localStorage.setItem("notificationsSkipped", "true");
                    localStorage.setItem("notificationsPageShown", "true");
                    onSkip?.();
                }

                // Complete onboarding
                setTimeout(() => {
                    localStorage.setItem("hasLoggedInBefore", "true");
                    localStorage.setItem("onboardingComplete", "true");
                    onComplete?.();
                    onClose();
                }, 500);
            } else {
                toast.error("Notifications are not supported in this browser.");
                localStorage.setItem("hasLoggedInBefore", "true");
                localStorage.setItem("onboardingComplete", "true");
                onComplete?.();
                onClose();
            }
        } catch (error) {
            console.error("Notification error:", error);
            localStorage.setItem("hasLoggedInBefore", "true");
            localStorage.setItem("onboardingComplete", "true");
            onComplete?.();
            onClose();
        } finally {
            setIsNotificationLoading(false);
        }
    };

    const handleSkip = () => {
        localStorage.setItem("hasLoggedInBefore", "true");
        localStorage.setItem("onboardingComplete", "true");
        localStorage.setItem("notificationsSkipped", "true");
        localStorage.setItem("notificationsPageShown", "true");
        onSkip?.();
        onComplete?.();
        onClose();
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setShowStep2(false);
            setTimeout(() => {
                setCurrentStep(1);
                setShowStep1(true);
            }, 300);
        }
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
                        <div className="mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-white/80 font-medium">
                                    Step {currentStep} of {totalSteps}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {[1, 2].map((step) => (
                                        <div
                                            key={step}
                                            className={`h-1.5 rounded-full transition-all duration-500 ${step === currentStep
                                                ? "bg-white w-8"
                                                : step < currentStep
                                                    ? "bg-white/60 w-4"
                                                    : "bg-white/30 w-4"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mt-2">
                                <div
                                    className="bg-white h-full rounded-full transition-all duration-700"
                                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-white/60 mt-2">
                                {currentStep === 1 ? "👤 Set up your profile" : "🔔 Enable notifications"}
                            </p>
                        </div>

                        {/* Step 1: Profile Setup */}
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && showStep1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative bg-white rounded-3xl p-8 sm:p-10 shadow-2xl"
                                >
                                    {/* Close Button */}
                                    <button
                                        onClick={handleSkip}
                                        className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
                                        aria-label="Close"
                                    >
                                        <X size={18} />
                                    </button>

                                    {/* Header */}
                                    <div className="text-center mb-8">
                                        <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center text-4xl bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl">
                                            👤
                                        </div>
                                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                            Welcome! Set Up Your Profile
                                        </h1>
                                        <p className="text-gray-500 text-sm font-normal mt-1">
                                            Tell us a bit about yourself to personalize your experience
                                        </p>
                                    </div>

                                    <form onSubmit={handleProfileSubmit} className="space-y-5">
                                        {/* Avatar Upload */}
                                        <div className="flex flex-col items-center">
                                            <div className="relative">
                                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-lg">
                                                    {previewUrl ? (
                                                        <img
                                                            src={previewUrl}
                                                            alt="Profile"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <User size={40} />
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition-colors"
                                                >
                                                    <Camera size={16} />
                                                </button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Upload photo (optional)
                                            </p>
                                        </div>

                                        {/* Full Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>

                                        {/* Employee ID */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Employee ID
                                            </label>
                                            <input
                                                type="text"
                                                name="employeeId"
                                                value={formData.employeeId}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                                placeholder="e.g., EMP-0042"
                                            />
                                        </div>

                                        {/* Phone Number */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                                placeholder="+880 1712 345678"
                                            />
                                        </div>

                                        {/* Daily Hours Target */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Daily Hours Target
                                            </label>
                                            <select
                                                name="dailyHoursTarget"
                                                value={formData.dailyHoursTarget}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                            >
                                                {[4, 6, 8, 10, 12].map((hours) => (
                                                    <option key={hours} value={hours}>
                                                        {hours} hours {hours === 8 ? "⭐ (standard)" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={handleSkip}
                                                className="flex-1 py-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-medium transition-all text-sm"
                                            >
                                                Skip for now
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        Continue
                                                        <ArrowRight size={16} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Step 2: Enable Notifications */}
                        <AnimatePresence mode="wait">
                            {currentStep === 2 && showStep2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative bg-white rounded-3xl p-8 sm:p-10 shadow-2xl"
                                >
                                    {/* Close Button */}
                                    <button
                                        onClick={handleSkip}
                                        className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
                                        aria-label="Close"
                                    >
                                        <X size={18} />
                                    </button>

                                    {/* Header */}
                                    <div className="text-center mb-6">
                                        <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center text-4xl bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl">
                                            🔔
                                        </div>
                                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                            Stay in the Loop!
                                        </h1>
                                        <p className="text-gray-500 text-sm font-normal max-w-[380px] mx-auto leading-relaxed mt-1">
                                            Get instant alerts for deadlines, task assignments, and approvals — right on your desktop.
                                        </p>
                                    </div>

                                    {/* Permission Status */}
                                    {notificationPermission === "granted" && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-emerald-700 text-sm">
                                            <CheckCircle size={18} className="text-emerald-500" />
                                            Notifications already enabled! ✅
                                        </div>
                                    )}

                                    {/* Notification Features */}
                                    <div className="bg-gradient-to-br from-[#0F1D32] to-[#1a2d4a] text-left rounded-2xl p-5 mb-6 text-sm text-gray-200 space-y-2.5 shadow-inner">
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
                                        <div className="flex items-center gap-2.5">
                                            <span>📊</span>
                                            <span>Weekly performance summaries</span>
                                        </div>
                                    </div>

                                    {/* Buttons */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleEnableNotifications}
                                            disabled={isNotificationLoading || notificationPermission === "granted"}
                                            className="w-full bg-[#1A60FF] hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isNotificationLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Enabling...
                                                </>
                                            ) : notificationPermission === "granted" ? (
                                                <>
                                                    <CheckCircle size={16} />
                                                    Already Enabled
                                                </>
                                            ) : (
                                                <>
                                                    <Bell size={16} />
                                                    Allow Notifications
                                                </>
                                            )}
                                        </button>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={handleBack}
                                                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                                            >
                                                <ArrowLeft size={16} />
                                                Back
                                            </button>
                                            <button
                                                onClick={handleSkip}
                                                className="flex-1 bg-white hover:bg-gray-50 text-gray-500 border border-gray-200 font-medium py-3 rounded-xl transition-all text-sm"
                                            >
                                                Finish
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}