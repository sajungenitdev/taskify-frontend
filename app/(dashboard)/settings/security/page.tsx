// app/settings/security/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Shield,
    Lock,
    Key,
    Mail,
    Globe,
    Server,
    Save,
    RefreshCw,
    Plus,
    Trash2,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Clock,
    Smartphone,
    Laptop,
    Monitor,
    MapPin,
    Fingerprint,
    ShieldCheck,
    Timer,
    Gauge,
    Network,
    Users,
    History,
    Activity,
    LogOut,
    Loader2,
    Bell,
    ChevronRight,
    Sparkles,
    Zap,
    Settings2,
    UserCheck,
    Eye,
    EyeOff,
    Copy,
    Check,
} from "lucide-react";

import { apiService } from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";

// ============================================================
// TYPES
// ============================================================
interface PasswordPolicy {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expireDays: number;
}

interface SecuritySettings {
    passwordPolicy: PasswordPolicy;
    passwordHistoryCount: number;
    enforcePasswordExpiry: boolean;
    logoutOnPasswordChange: boolean;
    sessionTimeout: number;
    sessionConcurrency: boolean;
    rememberMeDuration: number;
    autoLogoutInactive: boolean;
    inactivityTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    twoFactorAuth: boolean;
    mfaMethods: string[];
    ipWhitelist: string[];
    allowedDomains: string[];
    securityQuestions: string[];
    requireSecurityQuestions: boolean;
    rateLimitEnabled: boolean;
    rateLimitMaxRequests: number;
    rateLimitTimeWindow: number;
    securityAlertsEnabled: boolean;
    securityAlertEmail: string;
}

interface SecurityLog {
    id: string | number;
    event: string;
    user: string;
    email: string;
    ip: string;
    timestamp: string | Date;
    status: "success" | "failed" | "warning" | "info";
    details: string;
}

interface Session {
    id: string;
    device: string;
    ip: string;
    location: string;
    browser: string;
    os: string;
    loginTime: string | Date;
    lastActivity: string | Date;
    isCurrent: boolean;
}

interface TabConfig {
    id: number;
    icon: React.ElementType;
    label: string;
    description: string;
}

// ============================================================
// COMPONENT
// ============================================================
const SecuritySettingsPage: React.FC = () => {
    const { user } = useAuth();

    // State
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [testing, setTesting] = useState<boolean>(false);
    const [settings, setSettings] = useState<SecuritySettings | null>(null);
    const [securityQuestions, setSecurityQuestions] = useState<string[]>([]);
    const [newQuestion, setNewQuestion] = useState<string>("");
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "warning" | "info";
    }>({
        open: false,
        message: "",
        severity: "success",
    });
    const [logsPage, setLogsPage] = useState<number>(0);
    const [logsRowsPerPage, setLogsRowsPerPage] = useState<number>(5);
    const [logsTotal, setLogsTotal] = useState<number>(0);
    const [openQuestionDialog, setOpenQuestionDialog] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [ipInput, setIpInput] = useState<string>("");
    const [domainInput, setDomainInput] = useState<string>("");
    const [testEmail, setTestEmail] = useState<string>("");
    const [copied, setCopied] = useState<boolean>(false);

    // Form state
    const [formData, setFormData] = useState<SecuritySettings>({
        passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            expireDays: 90,
        },
        passwordHistoryCount: 5,
        enforcePasswordExpiry: false,
        logoutOnPasswordChange: true,
        sessionTimeout: 60,
        sessionConcurrency: false,
        rememberMeDuration: 30,
        autoLogoutInactive: true,
        inactivityTimeout: 30,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        twoFactorAuth: false,
        mfaMethods: ["authenticator", "sms", "email"],
        ipWhitelist: [],
        allowedDomains: [],
        securityQuestions: [],
        requireSecurityQuestions: false,
        rateLimitEnabled: true,
        rateLimitMaxRequests: 100,
        rateLimitTimeWindow: 60,
        securityAlertsEnabled: true,
        securityAlertEmail: "",
    });

    // ============================================================
    // TABS CONFIGURATION
    // ============================================================
    const tabs: TabConfig[] = [
        { id: 0, icon: Lock, label: "Password Policy", description: "Configure password requirements and security rules" },
        { id: 1, icon: Timer, label: "Session", description: "Manage user sessions and timeout settings" },
        { id: 2, icon: ShieldCheck, label: "Login Security", description: "Configure login attempts and authentication" },
        { id: 3, icon: Network, label: "Access Control", description: "Manage IP whitelist and access restrictions" },
        { id: 4, icon: Gauge, label: "Rate Limiting", description: "Configure API rate limiting rules" },
        { id: 5, icon: History, label: "Logs & Sessions", description: "View security logs and active sessions" },
    ];

    // ============================================================
    // FETCH DATA
    // ============================================================
    const fetchSecuritySettings = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            const response = await apiService.get<SecuritySettings>("/settings/security");
            if (response.success && response.data) {
                const data = response.data;
                setSettings(data);
                setFormData(data);
                setSecurityQuestions(data.securityQuestions || []);
            }
        } catch (error) {
            console.error("Error fetching security settings:", error);
            showSnackbar("Failed to load security settings", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSecurityLogs = useCallback(async (): Promise<void> => {
        try {
            const response = await apiService.get<{ logs: SecurityLog[]; pagination: { total: number } }>(
                "/settings/security/logs",
                { params: { limit: 50, page: 1 } }
            );
            if (response.success) {
                setLogs(response.data?.logs || []);
                setLogsTotal(response.data?.pagination?.total || 0);
            }
        } catch (error) {
            console.error("Error fetching security logs:", error);
        }
    }, []);

    const fetchActiveSessions = useCallback(async (): Promise<void> => {
        try {
            const response = await apiService.get<{ sessions: Session[]; total: number }>(
                "/settings/security/sessions"
            );
            if (response.success) {
                setSessions(response.data?.sessions || []);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    }, []);

    // Initial load
    useEffect(() => {
        const loadData = async (): Promise<void> => {
            await Promise.all([
                fetchSecuritySettings(),
                fetchSecurityLogs(),
                fetchActiveSessions(),
            ]);
        };
        loadData();
    }, [fetchSecuritySettings, fetchSecurityLogs, fetchActiveSessions]);

    // ============================================================
    // HANDLERS
    // ============================================================
    const handleInputChange = <K extends keyof SecuritySettings>(
        field: K,
        value: SecuritySettings[K]
    ): void => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePasswordPolicyChange = <K extends keyof PasswordPolicy>(
        field: K,
        value: PasswordPolicy[K]
    ): void => {
        setFormData((prev) => ({
            ...prev,
            passwordPolicy: { ...prev.passwordPolicy, [field]: value },
        }));
    };

    const handleSave = async (): Promise<void> => {
        try {
            setSaving(true);
            const response = await apiService.put<SecuritySettings>("/settings/security", formData);
            if (response.success) {
                showSnackbar("Security settings updated successfully", "success");
                await fetchSecuritySettings();
            }
        } catch (error) {
            console.error("Error saving security settings:", error);
            showSnackbar("Failed to save settings", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleAddQuestion = async (): Promise<void> => {
        if (!newQuestion.trim()) {
            showSnackbar("Please enter a security question", "warning");
            return;
        }
        try {
            const response = await apiService.post<{ securityQuestions: string[] }>(
                "/settings/security/questions",
                { question: newQuestion.trim() }
            );
            if (response.success) {
                setSecurityQuestions(response.data?.securityQuestions || []);
                setNewQuestion("");
                setOpenQuestionDialog(false);
                showSnackbar("Security question added successfully", "success");
            }
        } catch (error) {
            console.error("Error adding question:", error);
            showSnackbar("Failed to add question", "error");
        }
    };

    const handleRemoveQuestion = async (question: string): Promise<void> => {
        try {
            const response = await apiService.delete<{ securityQuestions: string[] }>(
                `/settings/security/questions/${encodeURIComponent(question)}`
            );
            if (response.success) {
                setSecurityQuestions(response.data?.securityQuestions || []);
                showSnackbar("Security question removed successfully", "success");
            }
        } catch (error) {
            console.error("Error removing question:", error);
            showSnackbar("Failed to remove question", "error");
        }
    };

    const handleAddIP = (): void => {
        const trimmedIP = ipInput.trim();
        if (!trimmedIP) {
            showSnackbar("Please enter an IP address", "warning");
            return;
        }
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(trimmedIP)) {
            showSnackbar("Invalid IP address format", "error");
            return;
        }
        if (formData.ipWhitelist.includes(trimmedIP)) {
            showSnackbar("IP address already in whitelist", "warning");
            return;
        }
        setFormData((prev) => ({
            ...prev,
            ipWhitelist: [...prev.ipWhitelist, trimmedIP],
        }));
        setIpInput("");
    };

    const handleRemoveIP = (ip: string): void => {
        setFormData((prev) => ({
            ...prev,
            ipWhitelist: prev.ipWhitelist.filter((item) => item !== ip),
        }));
    };

    const handleAddDomain = (): void => {
        const trimmedDomain = domainInput.trim();
        if (!trimmedDomain) {
            showSnackbar("Please enter a domain", "warning");
            return;
        }
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(trimmedDomain)) {
            showSnackbar("Invalid domain format (e.g., example.com)", "error");
            return;
        }
        if (formData.allowedDomains.includes(trimmedDomain)) {
            showSnackbar("Domain already in allowed list", "warning");
            return;
        }
        setFormData((prev) => ({
            ...prev,
            allowedDomains: [...prev.allowedDomains, trimmedDomain],
        }));
        setDomainInput("");
    };

    const handleRemoveDomain = (domain: string): void => {
        setFormData((prev) => ({
            ...prev,
            allowedDomains: prev.allowedDomains.filter((item) => item !== domain),
        }));
    };

    const handleRevokeSession = async (sessionId: string): Promise<void> => {
        if (!confirm("Are you sure you want to revoke this session?")) return;
        try {
            const response = await apiService.delete(`/settings/security/sessions/${sessionId}`);
            if (response.success) {
                showSnackbar("Session revoked successfully", "success");
                await fetchActiveSessions();
            }
        } catch (error) {
            console.error("Error revoking session:", error);
            showSnackbar("Failed to revoke session", "error");
        }
    };

    const handleTestLockout = async (): Promise<void> => {
        if (!testEmail) {
            showSnackbar("Please enter an email to test lockout", "warning");
            return;
        }
        try {
            setTesting(true);
            const response = await apiService.post<{ maxAttempts: number; lockoutDuration: number }>(
                "/settings/security/test-lockout",
                { email: testEmail }
            );
            if (response.success) {
                showSnackbar(
                    `Lockout test initiated for ${testEmail}. Max attempts: ${response.data?.maxAttempts}`,
                    "info"
                );
            }
        } catch (error) {
            console.error("Error testing lockout:", error);
            showSnackbar("Failed to test lockout", "error");
        } finally {
            setTesting(false);
        }
    };

    const showSnackbar = (
        message: string,
        severity: "success" | "error" | "warning" | "info"
    ): void => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = (): void => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    const handleCopyToClipboard = (text: string): void => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    const getStatusIcon = (status: string): React.ReactNode => {
        switch (status) {
            case "success":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "failed":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "warning":
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            default:
                return <Activity className="h-4 w-4 text-blue-500" />;
        }
    };

    const getDeviceIcon = (device: string): React.ReactNode => {
        const lowerDevice = device.toLowerCase();
        if (lowerDevice.includes("iphone") || lowerDevice.includes("android")) {
            return <Smartphone className="h-5 w-5" />;
        }
        if (lowerDevice.includes("laptop") || lowerDevice.includes("macbook")) {
            return <Laptop className="h-5 w-5" />;
        }
        return <Monitor className="h-5 w-5" />;
    };

    const getEventColor = (event: string): string => {
        const upperEvent = event.toUpperCase();
        if (upperEvent.includes("SUCCESS") || upperEvent.includes("ENABLED")) return "success";
        if (upperEvent.includes("FAILURE") || upperEvent.includes("REJECTED")) return "error";
        if (upperEvent.includes("LOCKED") || upperEvent.includes("WARNING")) return "warning";
        return "default";
    };

    const formatDate = (date: string | Date): string => {
        return new Date(date).toLocaleString();
    };

    const getStrengthColor = (length: number): string => {
        if (length < 6) return "bg-red-500";
        if (length < 10) return "bg-yellow-500";
        if (length < 14) return "bg-blue-500";
        return "bg-green-500";
    };

    // ============================================================
    // RENDER LOADING
    // ============================================================
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 animate-pulse">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                                <div className="space-y-3">
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // MAIN RENDER
    // ============================================================
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Modern Header with Gradient */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

                    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                                    Security Settings
                                    <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
                                        v2.0
                                    </span>
                                </h1>
                                <p className="text-blue-100 text-sm mt-1">
                                    Manage your system security and authentication settings
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full md:w-auto px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 group"
                        >
                            {saving ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-blue-100 text-xs">Active Sessions</p>
                            <p className="text-white text-xl font-bold">{sessions.length}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-blue-100 text-xs">Security Logs</p>
                            <p className="text-white text-xl font-bold">{logs.length}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-blue-100 text-xs">2FA Status</p>
                            <p className="text-white text-xl font-bold">{formData.twoFactorAuth ? "Enabled" : "Disabled"}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-blue-100 text-xs">Rate Limiting</p>
                            <p className="text-white text-xl font-bold">{formData.rateLimitEnabled ? "Active" : "Inactive"}</p>
                        </div>
                    </div>
                </div>

                {/* Modern Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-2 mb-6 overflow-x-auto">
                    <div className="flex space-x-1 min-w-max">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                    px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${isActive
                                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        }
                  `}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? "text-blue-500" : ""}`} />
                                    <span>{tab.label}</span>
                                    {isActive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {/* Tab 1: Password Policy */}
                    {activeTab === 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                                        <Key className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Password Requirements</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Configure password complexity rules</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Password Strength Indicator */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Minimum Length: <span className="font-bold text-blue-600 dark:text-blue-400">{formData.passwordPolicy.minLength}</span>
                                            </label>
                                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                {formData.passwordPolicy.minLength < 6 ? "Weak" : formData.passwordPolicy.minLength < 10 ? "Medium" : formData.passwordPolicy.minLength < 14 ? "Strong" : "Very Strong"}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="4"
                                            max="20"
                                            value={formData.passwordPolicy.minLength}
                                            onChange={(e) =>
                                                handlePasswordPolicyChange("minLength", parseInt(e.target.value))
                                            }
                                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                                            <span>4</span>
                                            <span>8</span>
                                            <span>12</span>
                                            <span>16</span>
                                            <span>20</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: "requireUppercase", label: "Uppercase (A-Z)" },
                                            { key: "requireLowercase", label: "Lowercase (a-z)" },
                                            { key: "requireNumbers", label: "Numbers (0-9)" },
                                            { key: "requireSpecialChars", label: "Special (!@#$%)" },
                                        ].map(({ key, label }) => (
                                            <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.passwordPolicy[key as keyof PasswordPolicy] as boolean}
                                                    onChange={(e) =>
                                                        handlePasswordPolicyChange(key as keyof PasswordPolicy, e.target.checked)
                                                    }
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Password Expiry (Days)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.passwordPolicy.expireDays}
                                            onChange={(e) =>
                                                handlePasswordPolicyChange("expireDays", parseInt(e.target.value) || 0)
                                            }
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">0 = Never expires</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Password History Count
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.passwordHistoryCount}
                                            onChange={(e) =>
                                                handleInputChange("passwordHistoryCount", parseInt(e.target.value) || 0)
                                            }
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Number of previous passwords to remember</p>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.enforcePasswordExpiry}
                                                onChange={(e) =>
                                                    handleInputChange("enforcePasswordExpiry", e.target.checked)
                                                }
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Enforce Password Expiry</span>
                                        </label>
                                        <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.logoutOnPasswordChange}
                                                onChange={(e) =>
                                                    handleInputChange("logoutOnPasswordChange", e.target.checked)
                                                }
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Logout on Password Change</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                                        <Shield className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Password Policy Preview</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Review your password requirements</p>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="h-4 w-4 text-yellow-500" />
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Password must meet the following requirements:</p>
                                    </div>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            At least <span className="font-bold text-gray-900 dark:text-white">{formData.passwordPolicy.minLength}</span> characters
                                        </li>
                                        {formData.passwordPolicy.requireUppercase && (
                                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                At least one uppercase letter (A-Z)
                                            </li>
                                        )}
                                        {formData.passwordPolicy.requireLowercase && (
                                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                At least one lowercase letter (a-z)
                                            </li>
                                        )}
                                        {formData.passwordPolicy.requireNumbers && (
                                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                At least one number (0-9)
                                            </li>
                                        )}
                                        {formData.passwordPolicy.requireSpecialChars && (
                                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                At least one special character (!@#$%)
                                            </li>
                                        )}
                                        {formData.passwordPolicy.expireDays > 0 && (
                                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <Clock className="h-4 w-4 text-orange-500" />
                                                Expires after <span className="font-bold text-gray-900 dark:text-white">{formData.passwordPolicy.expireDays}</span> days
                                            </li>
                                        )}
                                        {formData.enforcePasswordExpiry && (
                                            <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <Shield className="h-4 w-4 text-blue-500" />
                                                Password expiry is enforced
                                            </li>
                                        )}
                                    </ul>

                                    {/* Password Strength Demo */}
                                    <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Password Strength Demo</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${getStrengthColor(formData.passwordPolicy.minLength)}`}
                                                    style={{ width: `${Math.min((formData.passwordPolicy.minLength / 20) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                {formData.passwordPolicy.minLength < 6 ? "Weak" :
                                                    formData.passwordPolicy.minLength < 10 ? "Medium" :
                                                        formData.passwordPolicy.minLength < 14 ? "Strong" : "Very Strong"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Session Management */}
                    {activeTab === 1 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-xl">
                                        <Timer className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Session Configuration</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage session timeouts and behavior</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Session Timeout (Minutes)
                                        </label>
                                        <input
                                            type="number"
                                            min="5"
                                            max="1440"
                                            value={formData.sessionTimeout}
                                            onChange={(e) =>
                                                handleInputChange("sessionTimeout", parseInt(e.target.value) || 0)
                                            }
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Time before inactive session expires</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Remember Me Duration (Days)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.rememberMeDuration}
                                            onChange={(e) =>
                                                handleInputChange("rememberMeDuration", parseInt(e.target.value) || 0)
                                            }
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">How long to remember users</p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.sessionConcurrency}
                                                onChange={(e) =>
                                                    handleInputChange("sessionConcurrency", e.target.checked)
                                                }
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Allow Multiple Sessions</span>
                                        </label>
                                        <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.autoLogoutInactive}
                                                onChange={(e) =>
                                                    handleInputChange("autoLogoutInactive", e.target.checked)
                                                }
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Auto Logout Inactive Users</span>
                                        </label>
                                    </div>

                                    {formData.autoLogoutInactive && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Inactivity Timeout (Minutes)
                                            </label>
                                            <input
                                                type="number"
                                                min="5"
                                                value={formData.inactivityTimeout}
                                                onChange={(e) =>
                                                    handleInputChange("inactivityTimeout", parseInt(e.target.value) || 0)
                                                }
                                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Time before inactive user is logged out</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                            <Users className="h-5 w-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Sessions</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Currently active user sessions</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={fetchActiveSessions}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </button>
                                </div>

                                {sessions.length === 0 ? (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl text-sm text-center">
                                        No active sessions found
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                                    <th className="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Device</th>
                                                    <th className="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-400">IP</th>
                                                    <th className="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                                                    <th className="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sessions.map((session) => (
                                                    <tr key={session.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                                                        <td className="py-3 px-3">
                                                            <div className="flex items-center gap-2">
                                                                {getDeviceIcon(session.device)}
                                                                <div>
                                                                    <div className="font-medium text-gray-900 dark:text-white">{session.device}</div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{session.browser}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                                <MapPin className="h-3 w-3" />
                                                                {session.ip}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${session.isCurrent
                                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                                    }`}
                                                            >
                                                                <span className={`w-1.5 h-1.5 rounded-full ${session.isCurrent ? "bg-blue-500" : "bg-green-500"}`}></span>
                                                                {session.isCurrent ? "Current" : "Active"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            {!session.isCurrent && (
                                                                <button
                                                                    onClick={() => handleRevokeSession(session.id)}
                                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded-lg transition-colors"
                                                                >
                                                                    <LogOut className="h-3 w-3" />
                                                                    Revoke
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Login Security */}
                    {activeTab === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl">
                                        <ShieldCheck className="h-5 w-5 text-red-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Login Security</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Configure login attempts and 2FA</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Max Login Attempts
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.maxLoginAttempts}
                                            onChange={(e) =>
                                                handleInputChange("maxLoginAttempts", parseInt(e.target.value) || 0)
                                            }
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Failed attempts before lockout</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Lockout Duration (Minutes)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.lockoutDuration}
                                            onChange={(e) =>
                                                handleInputChange("lockoutDuration", parseInt(e.target.value) || 0)
                                            }
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">How long to lock the account</p>
                                    </div>

                                    <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.twoFactorAuth}
                                            onChange={(e) =>
                                                handleInputChange("twoFactorAuth", e.target.checked)
                                            }
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>Require Two-Factor Authentication</span>
                                    </label>

                                    {formData.twoFactorAuth && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                MFA Methods
                                            </label>
                                            <select
                                                multiple
                                                value={formData.mfaMethods}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "mfaMethods",
                                                        Array.from(e.target.selectedOptions, (option) => option.value)
                                                    )
                                                }
                                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white h-24 transition-all"
                                            >
                                                <option value="authenticator">🔐 Authenticator App</option>
                                                <option value="sms">📱 SMS</option>
                                                <option value="email">✉️ Email</option>
                                            </select>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Test Lockout Mechanism
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="email"
                                                placeholder="Enter email to test"
                                                value={testEmail}
                                                onChange={(e) => setTestEmail(e.target.value)}
                                                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                            />
                                            <button
                                                onClick={handleTestLockout}
                                                disabled={testing}
                                                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {testing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Zap className="h-4 w-4" />
                                                )}
                                                {testing ? "Testing..." : "Test"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl">
                                        <Bell className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Alerts</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Configure security notification settings</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.securityAlertsEnabled}
                                            onChange={(e) =>
                                                handleInputChange("securityAlertsEnabled", e.target.checked)
                                            }
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>Enable Security Alerts</span>
                                    </label>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Alert Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="email"
                                                value={formData.securityAlertEmail}
                                                onChange={(e) =>
                                                    handleInputChange("securityAlertEmail", e.target.value)
                                                }
                                                disabled={!formData.securityAlertsEnabled}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 transition-all"
                                                placeholder="Enter alert email"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email address to receive security alerts</p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Security Alert Types</p>
                                                <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-1">
                                                    <li>• Failed login attempts</li>
                                                    <li>• Password changes</li>
                                                    <li>• Account lockouts</li>
                                                    <li>• Suspicious activity</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Access Control */}
                    {activeTab === 3 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl">
                                            <Server className="h-5 w-5 text-cyan-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">IP Whitelist</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage allowed IP addresses</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Enter IP (e.g., 192.168.1.1)"
                                            value={ipInput}
                                            onChange={(e) => setIpInput(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && handleAddIP()}
                                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                        />
                                        <button
                                            onClick={handleAddIP}
                                            className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                                        {formData.ipWhitelist.length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 w-full text-center py-4">
                                                No IPs in whitelist
                                            </p>
                                        ) : (
                                            formData.ipWhitelist.map((ip) => (
                                                <span
                                                    key={ip}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm group hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    {ip}
                                                    <button
                                                        onClick={() => handleRemoveIP(ip)}
                                                        className="hover:text-red-600 transition-colors ml-1"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Add IP addresses that are allowed to access the system</p>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                                            <Globe className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Allowed Domains</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage allowed email domains</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Enter domain (e.g., example.com)"
                                            value={domainInput}
                                            onChange={(e) => setDomainInput(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && handleAddDomain()}
                                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                        />
                                        <button
                                            onClick={handleAddDomain}
                                            className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                                        {formData.allowedDomains.length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 w-full text-center py-4">
                                                No domains in allowed list
                                            </p>
                                        ) : (
                                            formData.allowedDomains.map((domain) => (
                                                <span
                                                    key={domain}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm group hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    {domain}
                                                    <button
                                                        onClick={() => handleRemoveDomain(domain)}
                                                        className="hover:text-red-600 transition-colors ml-1"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Add domains that are allowed to register</p>
                                </div>
                            </div>

                            {/* Security Questions */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                                            <Fingerprint className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Questions</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Configure security questions for account recovery</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setOpenQuestionDialog(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Question
                                    </button>
                                </div>

                                <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.requireSecurityQuestions}
                                        onChange={(e) =>
                                            handleInputChange("requireSecurityQuestions", e.target.checked)
                                        }
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Require Security Questions for Account Recovery</span>
                                </label>

                                {securityQuestions.length === 0 ? (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl text-sm text-center mt-4">
                                        No security questions configured. Add security questions for account recovery.
                                    </div>
                                ) : (
                                    <ul className="mt-4 space-y-2">
                                        {securityQuestions.map((q, index) => (
                                            <li
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{q}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveQuestion(q)}
                                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 5: Rate Limiting */}
                    {activeTab === 4 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-xl">
                                        <Gauge className="h-5 w-5 text-pink-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rate Limiting</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Configure API rate limiting rules</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.rateLimitEnabled}
                                            onChange={(e) =>
                                                handleInputChange("rateLimitEnabled", e.target.checked)
                                            }
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>Enable Rate Limiting</span>
                                    </label>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Max Requests
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.rateLimitMaxRequests}
                                            onChange={(e) =>
                                                handleInputChange("rateLimitMaxRequests", parseInt(e.target.value) || 0)
                                            }
                                            disabled={!formData.rateLimitEnabled}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 transition-all"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum number of requests allowed</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Time Window (Seconds)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.rateLimitTimeWindow}
                                            onChange={(e) =>
                                                handleInputChange("rateLimitTimeWindow", parseInt(e.target.value) || 0)
                                            }
                                            disabled={!formData.rateLimitEnabled}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 transition-all"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Time window for rate limiting</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
                                        <Activity className="h-5 w-5 text-teal-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rate Limit Preview</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Current rate limit configuration</p>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                            <p className={`text-lg font-bold ${formData.rateLimitEnabled ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                                {formData.rateLimitEnabled ? "Enabled" : "Disabled"}
                                            </p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Max Requests</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{formData.rateLimitMaxRequests}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Time Window</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{formData.rateLimitTimeWindow}s</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Rate</p>
                                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                {(formData.rateLimitMaxRequests / formData.rateLimitTimeWindow).toFixed(1)}/s
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                                            {formData.rateLimitEnabled
                                                ? "Rate limiting is active and protecting your API"
                                                : "Rate limiting is disabled. Enable it to protect your API from abuse."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 6: Logs & Sessions */}
                    {activeTab === 5 && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                                        <History className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Logs</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">View and monitor security events</p>
                                    </div>
                                </div>
                                <button
                                    onClick={fetchSecurityLogs}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    <span className="text-sm hidden sm:inline">Refresh</span>
                                </button>
                            </div>

                            {logs.length === 0 ? (
                                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl text-sm text-center">
                                    No security logs found
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                                    <th className="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Event</th>
                                                    <th className="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-400">User</th>
                                                    <th className="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-400">IP</th>
                                                    <th className="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Time</th>
                                                    <th className="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                                                    <th className="text-left py-3 px-3 font-medium text-gray-600 dark:text-gray-400">Details</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {logs
                                                    .slice(
                                                        logsPage * logsRowsPerPage,
                                                        logsPage * logsRowsPerPage + logsRowsPerPage
                                                    )
                                                    .map((log) => (
                                                        <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                            <td className="py-3 px-3">
                                                                <span
                                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getEventColor(log.event) === "success"
                                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                                        : getEventColor(log.event) === "error"
                                                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                                                            : getEventColor(log.event) === "warning"
                                                                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                                                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                                                        }`}
                                                                >
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${getEventColor(log.event) === "success"
                                                                        ? "bg-green-500"
                                                                        : getEventColor(log.event) === "error"
                                                                            ? "bg-red-500"
                                                                            : getEventColor(log.event) === "warning"
                                                                                ? "bg-yellow-500"
                                                                                : "bg-gray-500"
                                                                        }`}></span>
                                                                    {log.event}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3">
                                                                <div>
                                                                    <div className="font-medium text-gray-900 dark:text-white">{log.user}</div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{log.email}</div>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3">
                                                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                                    <Server className="h-3 w-3" />
                                                                    {log.ip}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{formatDate(log.timestamp)}</td>
                                                            <td className="py-3 px-3">{getStatusIcon(log.status)}</td>
                                                            <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{log.details}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            Showing {logsPage * logsRowsPerPage + 1} to{" "}
                                            {Math.min((logsPage + 1) * logsRowsPerPage, logsTotal || logs.length)} of{" "}
                                            {logsTotal || logs.length} entries
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={logsRowsPerPage}
                                                onChange={(e) => {
                                                    setLogsRowsPerPage(parseInt(e.target.value));
                                                    setLogsPage(0);
                                                }}
                                                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                            </select>
                                            <button
                                                onClick={() => setLogsPage(Math.max(0, logsPage - 1))}
                                                disabled={logsPage === 0}
                                                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setLogsPage(
                                                        Math.min(
                                                            Math.ceil((logsTotal || logs.length) / logsRowsPerPage) - 1,
                                                            logsPage + 1
                                                        )
                                                    )
                                                }
                                                disabled={
                                                    logsPage >=
                                                    Math.ceil((logsTotal || logs.length) / logsRowsPerPage) - 1
                                                }
                                                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Add Question Dialog - Modern */}
                {openQuestionDialog && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                                    <Plus className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Security Question</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter a new security question</p>
                                </div>
                            </div>

                            <input
                                type="text"
                                placeholder="Enter a security question"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Users will need to answer this for account recovery
                            </p>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setOpenQuestionDialog(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddQuestion}
                                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Question
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Snackbar - Modern */}
                {snackbar.open && (
                    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
                        <div
                            className={`px-6 py-3 rounded-xl shadow-lg text-white flex items-center gap-3 min-w-[300px] ${snackbar.severity === "success"
                                ? "bg-gradient-to-r from-green-500 to-green-600"
                                : snackbar.severity === "error"
                                    ? "bg-gradient-to-r from-red-500 to-red-600"
                                    : snackbar.severity === "warning"
                                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                        : "bg-gradient-to-r from-blue-500 to-blue-600"
                                }`}
                        >
                            <span className="flex-1">{snackbar.message}</span>
                            <button
                                onClick={handleCloseSnackbar}
                                className="ml-4 text-white/80 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecuritySettingsPage;