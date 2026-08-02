// app/(dashboard)/settings/email/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
    Mail,
    Send,
    Settings,
    Save,
    RefreshCw,
    Loader2,
    CheckCircle,
    AlertCircle,
    Home,
    ChevronRight,
    Eye,
    EyeOff,
    Lock,
    Bell,
    MessageSquare,
    FileText,
    Users,
    Building2,
    Globe,
    Clock,
    Calendar,
    DollarSign,
    User,
    Shield,
    Key,
    Server,
    Cloud,
    Smartphone,
    Laptop,
    Monitor,
    Moon,
    Sun,
    Palette,
    Type,
    Languages,
    UserCheck,
    UserX,
    UserPlus,
    Zap,
    Sparkles,
    Award,
    Trophy,
    BarChart3,
    PieChart,
    LineChart,
    TrendingUp,
    Activity,
    Heart,
    Star,
    Flag,
    Filter,
    Search,
    X,
    Plus,
    Minus,
    Edit2,
    Trash2,
    Copy,
    Check,
    Download,
    Upload,
    Printer,
    Share2,
    Link2,
    ExternalLink,
    Info,
    HelpCircle,
    LifeBuoy,
    BookOpen,
    GraduationCap,
    Rocket,
    Gift,
    Crown,
    Medal,
    Target,
    Zap as ZapIcon,
    AtSign,
    Send as SendIcon,
    MailOpen,
    MailCheck,
    MailX,
    MailWarning,
    Inbox,
    Paperclip,
    Tag,
    Clock as ClockIcon,
    Calendar as CalendarIcon,
    AlertTriangle,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import api from "@/lib/axios";

// ============================================================
// TYPES
// ============================================================
interface EmailSettings {
    // SMTP Settings
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword: string;
    smtpFromEmail: string;
    smtpFromName: string;
    smtpReplyTo: string;

    // Email Templates
    welcomeEmailEnabled: boolean;
    welcomeEmailSubject: string;
    welcomeEmailTemplate: string;

    passwordResetEnabled: boolean;
    passwordResetSubject: string;
    passwordResetTemplate: string;

    taskAssignedEnabled: boolean;
    taskAssignedSubject: string;
    taskAssignedTemplate: string;

    taskCompletedEnabled: boolean;
    taskCompletedSubject: string;
    taskCompletedTemplate: string;

    taskRejectedEnabled: boolean;
    taskRejectedSubject: string;
    taskRejectedTemplate: string;

    leaveApprovedEnabled: boolean;
    leaveApprovedSubject: string;
    leaveApprovedTemplate: string;

    leaveRejectedEnabled: boolean;
    leaveRejectedSubject: string;
    leaveRejectedTemplate: string;

    kpiReportEnabled: boolean;
    kpiReportSubject: string;
    kpiReportTemplate: string;

    // Email Notifications
    notifyOnTaskAssignment: boolean;
    notifyOnTaskUpdate: boolean;
    notifyOnTaskCompletion: boolean;
    notifyOnTaskApproval: boolean;
    notifyOnTaskRejection: boolean;
    notifyOnLeaveRequest: boolean;
    notifyOnLeaveApproval: boolean;
    notifyOnLeaveRejection: boolean;
    notifyOnKPIUpdate: boolean;
    notifyOnProjectUpdate: boolean;
    notifyOnTeamUpdate: boolean;
    notifyOnSystemUpdate: boolean;

    // Email Settings
    sendEmailOnError: boolean;
    errorRecipientEmail: string;
    emailQueueEnabled: boolean;
    maxEmailsPerMinute: number;
    testEmailRecipient: string;

    // Signature
    emailSignature: string;
    emailFooter: string;
    emailHeader: string;
}

// ============================================================
// DEFAULT SETTINGS
// ============================================================
const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPassword: "",
    smtpFromEmail: "",
    smtpFromName: "Task Management System",
    smtpReplyTo: "",

    welcomeEmailEnabled: true,
    welcomeEmailSubject: "Welcome to Task Management System",
    welcomeEmailTemplate: "Welcome {{name}}! Your account has been created successfully.",

    passwordResetEnabled: true,
    passwordResetSubject: "Password Reset Request",
    passwordResetTemplate: "Click the link below to reset your password: {{resetLink}}",

    taskAssignedEnabled: true,
    taskAssignedSubject: "New Task Assigned: {{taskTitle}}",
    taskAssignedTemplate: "Hello {{name}}, a new task '{{taskTitle}}' has been assigned to you.",

    taskCompletedEnabled: true,
    taskCompletedSubject: "Task Completed: {{taskTitle}}",
    taskCompletedTemplate: "Hello {{name}}, the task '{{taskTitle}}' has been marked as complete.",

    taskRejectedEnabled: true,
    taskRejectedSubject: "Task Rejected: {{taskTitle}}",
    taskRejectedTemplate: "Hello {{name}}, the task '{{taskTitle}}' has been rejected. Reason: {{reason}}",

    leaveApprovedEnabled: true,
    leaveApprovedSubject: "Leave Request Approved",
    leaveApprovedTemplate: "Hello {{name}}, your leave request has been approved.",

    leaveRejectedEnabled: true,
    leaveRejectedSubject: "Leave Request Rejected",
    leaveRejectedTemplate: "Hello {{name}}, your leave request has been rejected. Reason: {{reason}}",

    kpiReportEnabled: true,
    kpiReportSubject: "KPI Report for {{month}}",
    kpiReportTemplate: "Hello {{name}}, your KPI report for {{month}} is ready.",

    notifyOnTaskAssignment: true,
    notifyOnTaskUpdate: true,
    notifyOnTaskCompletion: true,
    notifyOnTaskApproval: true,
    notifyOnTaskRejection: true,
    notifyOnLeaveRequest: true,
    notifyOnLeaveApproval: true,
    notifyOnLeaveRejection: true,
    notifyOnKPIUpdate: true,
    notifyOnProjectUpdate: true,
    notifyOnTeamUpdate: true,
    notifyOnSystemUpdate: true,

    sendEmailOnError: true,
    errorRecipientEmail: "",
    emailQueueEnabled: true,
    maxEmailsPerMinute: 100,
    testEmailRecipient: "",

    emailSignature: "Best regards,\nThe Task Management Team",
    emailFooter: "© {{year}} Task Management System. All rights reserved.",
    emailHeader: "",
};

// ============================================================
// TEMPLATE VARIABLES
// ============================================================
const TEMPLATE_VARIABLES = [
    { name: "{{name}}", description: "User's full name" },
    { name: "{{email}}", description: "User's email" },
    { name: "{{taskTitle}}", description: "Task title" },
    { name: "{{taskDescription}}", description: "Task description" },
    { name: "{{taskDeadline}}", description: "Task deadline" },
    { name: "{{taskPriority}}", description: "Task priority" },
    { name: "{{taskStatus}}", description: "Task status" },
    { name: "{{projectName}}", description: "Project name" },
    { name: "{{assigneeName}}", description: "Assignee name" },
    { name: "{{assignerName}}", description: "Assigner name" },
    { name: "{{reason}}", description: "Reason for rejection" },
    { name: "{{month}}", description: "Month name" },
    { name: "{{year}}", description: "Year" },
    { name: "{{date}}", description: "Current date" },
    { name: "{{time}}", description: "Current time" },
    { name: "{{resetLink}}", description: "Password reset link" },
    { name: "{{loginLink}}", description: "Login page link" },
    { name: "{{dashboardLink}}", description: "Dashboard link" },
    { name: "{{supportEmail}}", description: "Support email" },
    { name: "{{companyName}}", description: "Company name" },
    { name: "{{signature}}", description: "Email signature" },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function EmailSettingsPage() {
    const { user, hasRole } = useAuth();
    const router = useRouter();
    const [settings, setSettings] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState<"smtp" | "templates" | "notifications">("smtp");
    const [showVariables, setShowVariables] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("welcome");

    const canManageSettings = hasRole(["super_admin", "admin"]);

    // ============================================================
    // FETCH SETTINGS
    // ============================================================
    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/settings/email");
            if (response.data.success) {
                setSettings({ ...DEFAULT_EMAIL_SETTINGS, ...response.data.data });
            } else {
                setSettings(DEFAULT_EMAIL_SETTINGS);
            }
        } catch (error) {
            console.error("Error fetching email settings:", error);
            // Try fallback
            try {
                const fallbackResponse = await api.get("/settings/email/general");
                if (fallbackResponse.data.success) {
                    setSettings({ ...DEFAULT_EMAIL_SETTINGS, ...fallbackResponse.data.data });
                }
            } catch (fallbackError) {
                setSettings(DEFAULT_EMAIL_SETTINGS);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // ============================================================
    // SAVE SETTINGS
    // ============================================================
    const handleSaveSettings = async () => {
        setSaving(true);
        setSaved(false);
        try {
            // Create a copy and conditionally remove password
            const dataToSend: any = { ...settings };

            // Only delete if it exists and is empty or undefined
            if (dataToSend.smtpPassword === '' || dataToSend.smtpPassword === undefined || dataToSend.smtpPassword === null) {
                delete dataToSend.smtpPassword;
            }

            const response = await api.put("/settings/email", dataToSend);
            if (response.data.success) {
                toast.success("Email settings saved successfully!");
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error: any) {
            // Try fallback
            try {
                const fallbackResponse = await api.put("/settings/email/general", settings);
                if (fallbackResponse.data.success) {
                    toast.success("Email settings saved successfully!");
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                }
            } catch (fallbackError: any) {
                toast.error(fallbackError.response?.data?.message || "Failed to save email settings");
            }
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // TEST EMAIL
    // ============================================================
    const handleTestEmail = async () => {
        if (!settings.testEmailRecipient) {
            toast.error("Please enter a test email recipient");
            return;
        }

        setTesting(true);
        try {
            const response = await api.post("/settings/email/test", {
                recipient: settings.testEmailRecipient,
            });
            if (response.data.success) {
                toast.success(`Test email sent to ${settings.testEmailRecipient}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send test email");
        } finally {
            setTesting(false);
        }
    };

    // ============================================================
    // UPDATE SETTINGS HELPER
    // ============================================================
    const updateSettings = (key: keyof EmailSettings, value: any) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    // ============================================================
    // EFFECTS
    // ============================================================
    useEffect(() => {
        if (!canManageSettings) {
            toast.error("You don't have permission to access settings");
            router.push("/dashboard");
            return;
        }
        fetchSettings();
    }, [canManageSettings, router, fetchSettings]);

    // ============================================================
    // LOADING STATE
    // ============================================================
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    <p className="text-gray-500 text-sm">Loading email settings...</p>
                </div>
            </div>
        );
    }

    // ============================================================
    // ACCESS DENIED
    // ============================================================
    if (!canManageSettings) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md">
                    <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-10 h-10 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                        Access Denied
                    </h2>
                    <p className="text-gray-500">
                        You don't have permission to view this page
                    </p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/20">
            <div className="p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumb */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-sm mb-6"
                    >
                        <Link
                            href="/dashboard"
                            className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
                        >
                            <Home size={14} />
                            Dashboard
                        </Link>
                        <ChevronRight size={14} className="text-gray-300" />
                        <Link
                            href="/settings"
                            className="text-gray-400 hover:text-gray-600 transition"
                        >
                            Settings
                        </Link>
                        <ChevronRight size={14} className="text-gray-300" />
                        <span className="text-gray-700 font-medium">Email</span>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                    Email Settings
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    Configure SMTP, email templates, and notification preferences
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchSettings}
                                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-gray-50/80 text-gray-600 hover:text-gray-800 rounded-xl transition text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
                            >
                                <RefreshCw size={16} />
                                Reset
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : saved ? (
                                    <CheckCircle size={18} className="text-emerald-300" />
                                ) : (
                                    <Save size={18} />
                                )}
                                {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
                            </button>
                        </div>
                    </motion.div>

                    {/* Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex border-b border-gray-200 bg-white/80 backdrop-blur-sm rounded-t-2xl px-4 overflow-x-auto"
                    >
                        {[
                            { id: "smtp", label: "SMTP Configuration", icon: Settings },
                            { id: "templates", label: "Email Templates", icon: FileText },
                            { id: "notifications", label: "Notifications", icon: Bell },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap ${isActive
                                        ? "text-indigo-600"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    <Icon size={16} className="inline mr-2" />
                                    {tab.label}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>

                    {/* Content */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-b-2xl border border-t-0 border-gray-200 p-6 shadow-sm">
                        <AnimatePresence mode="wait">
                            {/* SMTP Configuration */}
                            {activeTab === "smtp" && (
                                <SmtpTab
                                    settings={settings}
                                    updateSettings={updateSettings}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                    testing={testing}
                                    handleTestEmail={handleTestEmail}
                                />
                            )}

                            {/* Email Templates */}
                            {activeTab === "templates" && (
                                <TemplatesTab
                                    settings={settings}
                                    updateSettings={updateSettings}
                                    showVariables={showVariables}
                                    setShowVariables={setShowVariables}
                                    selectedTemplate={selectedTemplate}
                                    setSelectedTemplate={setSelectedTemplate}
                                />
                            )}

                            {/* Notifications */}
                            {activeTab === "notifications" && (
                                <NotificationsTab
                                    settings={settings}
                                    updateSettings={updateSettings}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// SMTP TAB
// ============================================================
function SmtpTab({
    settings,
    updateSettings,
    showPassword,
    setShowPassword,
    testing,
    handleTestEmail,
}: {
    settings: EmailSettings;
    updateSettings: (key: keyof EmailSettings, value: any) => void;
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
    testing: boolean;
    handleTestEmail: () => void;
}) {
    return (
        <motion.div
            key="smtp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <h2 className="text-lg font-semibold text-gray-800">SMTP Configuration</h2>
            <p className="text-sm text-gray-500">
                Configure your SMTP server settings for sending emails
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        SMTP Host *
                    </label>
                    <input
                        type="text"
                        value={settings.smtpHost}
                        onChange={(e) => updateSettings("smtpHost", e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        SMTP Port *
                    </label>
                    <input
                        type="number"
                        value={settings.smtpPort}
                        onChange={(e) => updateSettings("smtpPort", parseInt(e.target.value) || 587)}
                        placeholder="587"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Use Secure Connection (SSL/TLS)</p>
                        <p className="text-xs text-gray-400">Enable for port 465 or 587</p>
                    </div>
                    <Toggle
                        checked={settings.smtpSecure}
                        onChange={(checked) => updateSettings("smtpSecure", checked)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        SMTP Username *
                    </label>
                    <input
                        type="text"
                        value={settings.smtpUser}
                        onChange={(e) => updateSettings("smtpUser", e.target.value)}
                        placeholder="user@example.com"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        SMTP Password *
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={settings.smtpPassword}
                            onChange={(e) => updateSettings("smtpPassword", e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Leave blank to keep current password</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        From Email *
                    </label>
                    <input
                        type="email"
                        value={settings.smtpFromEmail}
                        onChange={(e) => updateSettings("smtpFromEmail", e.target.value)}
                        placeholder="noreply@example.com"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        From Name
                    </label>
                    <input
                        type="text"
                        value={settings.smtpFromName}
                        onChange={(e) => updateSettings("smtpFromName", e.target.value)}
                        placeholder="Task Management System"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Reply-To Email
                    </label>
                    <input
                        type="email"
                        value={settings.smtpReplyTo}
                        onChange={(e) => updateSettings("smtpReplyTo", e.target.value)}
                        placeholder="reply@example.com"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                </div>
            </div>

            {/* Test Email Section */}
            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Test Email</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <input
                            type="email"
                            value={settings.testEmailRecipient}
                            onChange={(e) => updateSettings("testEmailRecipient", e.target.value)}
                            placeholder="Enter email to send test"
                            className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                    </div>
                    <button
                        onClick={handleTestEmail}
                        disabled={testing || !settings.testEmailRecipient}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                    >
                        {testing ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                        Send Test Email
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    A test email will be sent to verify your SMTP configuration
                </p>
            </div>
        </motion.div>
    );
}

// ============================================================
// TEMPLATES TAB
// ============================================================
function TemplatesTab({
    settings,
    updateSettings,
    showVariables,
    setShowVariables,
    selectedTemplate,
    setSelectedTemplate,
}: {
    settings: EmailSettings;
    updateSettings: (key: keyof EmailSettings, value: any) => void;
    showVariables: boolean;
    setShowVariables: (show: boolean) => void;
    selectedTemplate: string;
    setSelectedTemplate: (template: string) => void;
}) {
    const templates = [
        { id: "welcome", label: "Welcome Email", enabled: settings.welcomeEmailEnabled, subject: settings.welcomeEmailSubject, template: settings.welcomeEmailTemplate },
        { id: "passwordReset", label: "Password Reset", enabled: settings.passwordResetEnabled, subject: settings.passwordResetSubject, template: settings.passwordResetTemplate },
        { id: "taskAssigned", label: "Task Assigned", enabled: settings.taskAssignedEnabled, subject: settings.taskAssignedSubject, template: settings.taskAssignedTemplate },
        { id: "taskCompleted", label: "Task Completed", enabled: settings.taskCompletedEnabled, subject: settings.taskCompletedSubject, template: settings.taskCompletedTemplate },
        { id: "taskRejected", label: "Task Rejected", enabled: settings.taskRejectedEnabled, subject: settings.taskRejectedSubject, template: settings.taskRejectedTemplate },
        { id: "leaveApproved", label: "Leave Approved", enabled: settings.leaveApprovedEnabled, subject: settings.leaveApprovedSubject, template: settings.leaveApprovedTemplate },
        { id: "leaveRejected", label: "Leave Rejected", enabled: settings.leaveRejectedEnabled, subject: settings.leaveRejectedSubject, template: settings.leaveRejectedTemplate },
        { id: "kpiReport", label: "KPI Report", enabled: settings.kpiReportEnabled, subject: settings.kpiReportSubject, template: settings.kpiReportTemplate },
    ];

    const currentTemplate = templates.find(t => t.id === selectedTemplate) || templates[0];

    const getTemplateKey = (id: string): keyof EmailSettings => {
        const map: Record<string, keyof EmailSettings> = {
            welcome: "welcomeEmailEnabled",
            passwordReset: "passwordResetEnabled",
            taskAssigned: "taskAssignedEnabled",
            taskCompleted: "taskCompletedEnabled",
            taskRejected: "taskRejectedEnabled",
            leaveApproved: "leaveApprovedEnabled",
            leaveRejected: "leaveRejectedEnabled",
            kpiReport: "kpiReportEnabled",
        };
        return map[id] || "welcomeEmailEnabled";
    };

    const getSubjectKey = (id: string): keyof EmailSettings => {
        const map: Record<string, keyof EmailSettings> = {
            welcome: "welcomeEmailSubject",
            passwordReset: "passwordResetSubject",
            taskAssigned: "taskAssignedSubject",
            taskCompleted: "taskCompletedSubject",
            taskRejected: "taskRejectedSubject",
            leaveApproved: "leaveApprovedSubject",
            leaveRejected: "leaveRejectedSubject",
            kpiReport: "kpiReportSubject",
        };
        return map[id] || "welcomeEmailSubject";
    };

    const getTemplateKeyContent = (id: string): keyof EmailSettings => {
        const map: Record<string, keyof EmailSettings> = {
            welcome: "welcomeEmailTemplate",
            passwordReset: "passwordResetTemplate",
            taskAssigned: "taskAssignedTemplate",
            taskCompleted: "taskCompletedTemplate",
            taskRejected: "taskRejectedTemplate",
            leaveApproved: "leaveApprovedTemplate",
            leaveRejected: "leaveRejectedTemplate",
            kpiReport: "kpiReportTemplate",
        };
        return map[id] || "welcomeEmailTemplate";
    };

    return (
        <motion.div
            key="templates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <h2 className="text-lg font-semibold text-gray-800">Email Templates</h2>
            <p className="text-sm text-gray-500">
                Customize email templates for different system events
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template List */}
                <div className="lg:col-span-1">
                    <div className="space-y-2">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => setSelectedTemplate(template.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between ${selectedTemplate === template.id
                                    ? "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200"
                                    : "bg-gray-50/80 border border-gray-200 hover:bg-gray-100"
                                    }`}
                            >
                                <span className="text-sm font-medium text-gray-700">{template.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${template.enabled
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-gray-200 text-gray-500"
                                        }`}>
                                        {template.enabled ? "Active" : "Disabled"}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Template Editor */}
                <div className="lg:col-span-2">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-700">
                                {currentTemplate.label} Template
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Enable</span>
                                <Toggle
                                    checked={currentTemplate.enabled}
                                    onChange={(checked) => {
                                        const key = getTemplateKey(selectedTemplate);
                                        updateSettings(key, checked);
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Subject
                            </label>
                            <input
                                type="text"
                                value={currentTemplate.subject}
                                onChange={(e) => {
                                    const key = getSubjectKey(selectedTemplate);
                                    updateSettings(key, e.target.value);
                                }}
                                className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Template Content
                            </label>
                            <textarea
                                value={currentTemplate.template}
                                onChange={(e) => {
                                    const key = getTemplateKeyContent(selectedTemplate);
                                    updateSettings(key, e.target.value);
                                }}
                                rows={6}
                                className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none font-mono"
                            />
                        </div>

                        {/* Variables */}
                        <div>
                            <button
                                onClick={() => setShowVariables(!showVariables)}
                                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                            >
                                {showVariables ? <ChevronRight size={16} className="rotate-90" /> : <ChevronRight size={16} />}
                                Available Template Variables
                            </button>

                            <AnimatePresence>
                                {showVariables && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-3 p-3 bg-gray-50/80 rounded-xl border border-gray-200 grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {TEMPLATE_VARIABLES.map((variable) => (
                                                <div
                                                    key={variable.name}
                                                    className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200"
                                                >
                                                    <code className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                        {variable.name}
                                                    </code>
                                                    <span className="text-xs text-gray-500">{variable.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Email Signature */}
                        <div className="border-t border-gray-200 pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email Signature
                            </label>
                            <textarea
                                value={settings.emailSignature}
                                onChange={(e) => updateSettings("emailSignature", e.target.value)}
                                rows={2}
                                placeholder="Best regards,&#10;The Task Management Team"
                                className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// NOTIFICATIONS TAB
// ============================================================
function NotificationsTab({
    settings,
    updateSettings,
}: {
    settings: EmailSettings;
    updateSettings: (key: keyof EmailSettings, value: any) => void;
}) {
    const notificationGroups = [
        {
            title: "Task Notifications",
            items: [
                { key: "notifyOnTaskAssignment", label: "Task Assignment", desc: "Notify when a task is assigned" },
                { key: "notifyOnTaskUpdate", label: "Task Updates", desc: "Notify when a task is updated" },
                { key: "notifyOnTaskCompletion", label: "Task Completion", desc: "Notify when a task is completed" },
                { key: "notifyOnTaskApproval", label: "Task Approval", desc: "Notify when a task is approved" },
                { key: "notifyOnTaskRejection", label: "Task Rejection", desc: "Notify when a task is rejected" },
            ],
        },
        {
            title: "Leave Notifications",
            items: [
                { key: "notifyOnLeaveRequest", label: "Leave Requests", desc: "Notify on leave requests" },
                { key: "notifyOnLeaveApproval", label: "Leave Approval", desc: "Notify on leave approval" },
                { key: "notifyOnLeaveRejection", label: "Leave Rejection", desc: "Notify on leave rejection" },
            ],
        },
        {
            title: "System Notifications",
            items: [
                { key: "notifyOnKPIUpdate", label: "KPI Updates", desc: "Notify when KPIs are updated" },
                { key: "notifyOnProjectUpdate", label: "Project Updates", desc: "Notify on project updates" },
                { key: "notifyOnTeamUpdate", label: "Team Updates", desc: "Notify on team changes" },
                { key: "notifyOnSystemUpdate", label: "System Updates", desc: "Notify on system updates" },
            ],
        },
    ];

    return (
        <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <h2 className="text-lg font-semibold text-gray-800">Email Notifications</h2>
            <p className="text-sm text-gray-500">
                Configure which notifications should be sent via email
            </p>

            {notificationGroups.map((group) => (
                <div key={group.title}>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">{group.title}</h3>
                    <div className="space-y-2">
                        {group.items.map((item) => (
                            <ToggleItem
                                key={item.key}
                                label={item.label}
                                description={item.desc}
                                checked={settings[item.key as keyof EmailSettings] as boolean}
                                onChange={(checked) => updateSettings(item.key as keyof EmailSettings, checked)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Email Queue Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleItem
                        label="Enable Email Queue"
                        description="Queue emails for batch sending"
                        checked={settings.emailQueueEnabled}
                        onChange={(checked) => updateSettings("emailQueueEnabled", checked)}
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Max Emails Per Minute
                        </label>
                        <input
                            type="number"
                            value={settings.maxEmailsPerMinute}
                            onChange={(e) => updateSettings("maxEmailsPerMinute", parseInt(e.target.value) || 100)}
                            className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// TOGGLE ITEM COMPONENT
// ============================================================
function ToggleItem({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-200">
            <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                {description && <p className="text-xs text-gray-400">{description}</p>}
            </div>
            <Toggle checked={checked} onChange={onChange} />
        </div>
    );
}

// ============================================================
// TOGGLE COMPONENT
// ============================================================
function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    );
}