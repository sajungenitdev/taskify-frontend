// app/(dashboard)/settings/general/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
    Settings,
    Save,
    RefreshCw,
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Home,
    ChevronRight,
    Globe,
    Clock,
    Calendar,
    DollarSign,
    Users,
    Building2,
    Shield,
    Bell,
    Mail,
    MessageSquare,
    Eye,
    EyeOff,
    Lock,
    Key,
    User,
    Briefcase,
    FileText,
    Database,
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import api from "@/lib/axios";

// ============================================================
// TYPES
// ============================================================
interface BrandingImages {
    logo: string;
    favicon: string;
    loginBackground: string;
    dashboardBanner: string;
    emailHeader: string;
    emailFooter: string;
}

interface GeneralSettings {
    // System Settings
    systemName: string;
    systemLogo: string;
    systemEmail: string;
    systemPhone: string;
    systemAddress: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    weekStartDay: string;
    currency: string;
    currencySymbol: string;

    // Branding Images
    brandingImages: BrandingImages;

    // Authentication
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    defaultRole: string;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        expireDays: number;
    };

    // Security
    twoFactorAuth: boolean;
    ipWhitelist: string[];
    allowedDomains: string[];
    maintenanceMode: boolean;
    maintenanceMessage: string;

    // Notifications
    emailNotifications: boolean;
    pushNotifications: boolean;
    desktopNotifications: boolean;
    notificationSound: boolean;

    // Preferences
    language: string;
    theme: "light" | "dark" | "system";
    sidebarCollapsed: boolean;
    compactMode: boolean;

    // Features
    enableKPIModule: boolean;
    enableTimesheetModule: boolean;
    enableLeaveModule: boolean;
    enableChatModule: boolean;
    enableReportingModule: boolean;
    enableAIAssistant: boolean;

    // Integrations
    enableSlackIntegration: boolean;
    slackWebhookUrl: string;
    enableDiscordIntegration: boolean;
    discordWebhookUrl: string;
}

// ============================================================
// DEFAULT SETTINGS
// ============================================================
const DEFAULT_SETTINGS: GeneralSettings = {
    systemName: "Task Management System",
    systemLogo: "",
    systemEmail: "admin@example.com",
    systemPhone: "+1 (555) 000-0000",
    systemAddress: "123 Main St, Suite 100, New York, NY 10001",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    weekStartDay: "Sunday",
    currency: "USD",
    currencySymbol: "$",

    brandingImages: {
        logo: "",
        favicon: "",
        loginBackground: "",
        dashboardBanner: "",
        emailHeader: "",
        emailFooter: "",
    },

    allowRegistration: true,
    requireEmailVerification: true,
    defaultRole: "employee",
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expireDays: 90,
    },

    twoFactorAuth: false,
    ipWhitelist: [],
    allowedDomains: [],
    maintenanceMode: false,
    maintenanceMessage: "System is currently under maintenance. Please check back later.",

    emailNotifications: true,
    pushNotifications: true,
    desktopNotifications: false,
    notificationSound: true,

    language: "en",
    theme: "system",
    sidebarCollapsed: false,
    compactMode: false,

    enableKPIModule: true,
    enableTimesheetModule: true,
    enableLeaveModule: true,
    enableChatModule: false,
    enableReportingModule: true,
    enableAIAssistant: false,

    enableSlackIntegration: false,
    slackWebhookUrl: "",
    enableDiscordIntegration: false,
    discordWebhookUrl: "",
};

// ============================================================
// SECTION CONFIG
// ============================================================
const sections = [
    { id: "general", label: "General", icon: Settings },
    { id: "branding", label: "Branding", icon: Building2 },
    { id: "authentication", label: "Authentication", icon: Lock },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "features", label: "Features", icon: ZapIcon },
    { id: "integrations", label: "Integrations", icon: Cloud },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function GeneralSettingsPage() {
    const { user, hasRole } = useAuth();
    const router = useRouter();
    const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<string>("general");
    const [showPasswordPolicy, setShowPasswordPolicy] = useState(false);
    const [newDomain, setNewDomain] = useState("");
    const [newIp, setNewIp] = useState("");
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const canManageSettings = hasRole(["super_admin", "admin"]);

    // ============================================================
    // FETCH SETTINGS
    // ============================================================
    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/settings/general");
            if (response.data.success) {
                const data = response.data.data;
                setSettings({
                    ...DEFAULT_SETTINGS,
                    ...data,
                    brandingImages: {
                        ...DEFAULT_SETTINGS.brandingImages,
                        ...(data.brandingImages || {}),
                    },
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            // Try fallback endpoint
            try {
                const fallbackResponse = await api.get("/settings");
                if (fallbackResponse.data.success) {
                    const data = fallbackResponse.data.data;
                    setSettings({
                        ...DEFAULT_SETTINGS,
                        ...data,
                        brandingImages: {
                            ...DEFAULT_SETTINGS.brandingImages,
                            ...(data.brandingImages || {}),
                        },
                    });
                }
            } catch (fallbackError) {
                console.error("Fallback also failed:", fallbackError);
                setSettings(DEFAULT_SETTINGS);
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
            const response = await api.put("/settings/general", settings);
            if (response.data.success) {
                toast.success("Settings saved successfully!");
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error: any) {
            // Try fallback endpoint
            try {
                const fallbackResponse = await api.put("/settings", settings);
                if (fallbackResponse.data.success) {
                    toast.success("Settings saved successfully!");
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                }
            } catch (fallbackError: any) {
                toast.error(fallbackError.response?.data?.message || "Failed to save settings");
            }
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // UPDATE SETTINGS HELPERS
    // ============================================================
    const updateSettings = (key: keyof GeneralSettings, value: any) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const updateBrandingImage = (key: keyof BrandingImages, value: string) => {
        setSettings((prev) => ({
            ...prev,
            brandingImages: { ...prev.brandingImages, [key]: value },
        }));
    };

    const updatePasswordPolicy = (key: keyof GeneralSettings["passwordPolicy"], value: any) => {
        setSettings((prev) => ({
            ...prev,
            passwordPolicy: { ...prev.passwordPolicy, [key]: value },
        }));
    };

    const addIpToWhitelist = () => {
        if (newIp && !settings.ipWhitelist.includes(newIp)) {
            setSettings((prev) => ({
                ...prev,
                ipWhitelist: [...prev.ipWhitelist, newIp],
            }));
            setNewIp("");
        }
    };

    const removeIpFromWhitelist = (ip: string) => {
        setSettings((prev) => ({
            ...prev,
            ipWhitelist: prev.ipWhitelist.filter((i) => i !== ip),
        }));
    };

    const addAllowedDomain = () => {
        if (newDomain && !settings.allowedDomains.includes(newDomain)) {
            setSettings((prev) => ({
                ...prev,
                allowedDomains: [...prev.allowedDomains, newDomain],
            }));
            setNewDomain("");
        }
    };

    const removeAllowedDomain = (domain: string) => {
        setSettings((prev) => ({
            ...prev,
            allowedDomains: prev.allowedDomains.filter((d) => d !== domain),
        }));
    };

    // ============================================================
    // UPLOAD BRANDING IMAGE
    // ============================================================
    const handleImageUpload = async (key: keyof BrandingImages, file: File, maxSizeMB: number) => {
        // Validate file size
        const maxSize = maxSizeMB * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error(`File size exceeds ${maxSizeMB}MB limit`);
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload JPEG, PNG, GIF, WebP, or SVG.');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const base64Data = event.target?.result as string;

                // Update local state immediately for preview
                updateBrandingImage(key, base64Data);

                // Try to upload via API
                try {
                    const response = await api.post('/settings/branding/upload', {
                        imageType: key,
                        imageData: base64Data,
                    });

                    if (response.data.success) {
                        toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} uploaded successfully`);
                        await fetchSettings();
                    }
                } catch (error) {
                    // If API fails, we already have the image in local state
                    // Just save settings
                    await handleSaveSettings();
                    toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} uploaded successfully (local)`);
                }
            } catch (error) {
                toast.error(`Failed to upload ${key}`);
                // Revert the local state
                fetchSettings();
            }
        };
        reader.readAsDataURL(file);
    };

    // ============================================================
    // DELETE BRANDING IMAGE
    // ============================================================
    const deleteBrandingImage = async (key: keyof BrandingImages) => {
        try {
            updateBrandingImage(key, "");

            try {
                const response = await api.delete(`/settings/branding/${key}`);
                if (response.data.success) {
                    toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} deleted successfully`);
                    await fetchSettings();
                }
            } catch (error) {
                // If API fails, we already removed from local state
                await handleSaveSettings();
                toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} deleted successfully (local)`);
            }
        } catch (error) {
            toast.error(`Failed to delete ${key}`);
            fetchSettings();
        }
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
                    <p className="text-gray-500 text-sm">Loading settings...</p>
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
                        <Settings className="w-10 h-10 text-rose-500" />
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
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-indigo-50/20">
            <div className="p-4 md:p-6 lg:p-8">
                <div className="container mx-auto">
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
                        <span className="text-gray-700 font-medium">General</span>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                                <Settings className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                    General Settings
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    Configure system-wide settings and preferences
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
                                className="px-6 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-xl disabled:opacity-50"
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

                    {/* Main Content */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Sidebar */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:w-64 shrink-0"
                        >
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm p-2 sticky top-6">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    const isActive = activeSection === section.id;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                                ? "bg-linear-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                                                }`}
                                        >
                                            <Icon size={18} className={isActive ? "text-indigo-500" : "text-gray-400"} />
                                            <span className="text-sm">{section.label}</span>
                                            {isActive && (
                                                <div className="ml-auto w-1.5 h-6 bg-linear-to-b from-indigo-500 to-purple-500 rounded-full" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1"
                        >
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm p-6">
                                <AnimatePresence mode="wait">
                                    {/* General Settings */}
                                    {activeSection === "general" && (
                                        <GeneralSection
                                            settings={settings}
                                            updateSettings={updateSettings}
                                        />
                                    )}

                                    {/* Branding Settings */}
                                    {activeSection === "branding" && (
                                        <BrandingSection
                                            settings={settings}
                                            updateBrandingImage={updateBrandingImage}
                                            deleteBrandingImage={deleteBrandingImage}
                                            handleImageUpload={handleImageUpload}
                                            updateSettings={updateSettings}
                                        />
                                    )}

                                    {/* Authentication Settings */}
                                    {activeSection === "authentication" && (
                                        <AuthenticationSection
                                            settings={settings}
                                            updateSettings={updateSettings}
                                            updatePasswordPolicy={updatePasswordPolicy}
                                            showPasswordPolicy={showPasswordPolicy}
                                            setShowPasswordPolicy={setShowPasswordPolicy}
                                        />
                                    )}

                                    {/* Security Settings */}
                                    {activeSection === "security" && (
                                        <SecuritySection
                                            settings={settings}
                                            updateSettings={updateSettings}
                                            newIp={newIp}
                                            setNewIp={setNewIp}
                                            addIpToWhitelist={addIpToWhitelist}
                                            removeIpFromWhitelist={removeIpFromWhitelist}
                                            newDomain={newDomain}
                                            setNewDomain={setNewDomain}
                                            addAllowedDomain={addAllowedDomain}
                                            removeAllowedDomain={removeAllowedDomain}
                                        />
                                    )}

                                    {/* Notifications Settings */}
                                    {activeSection === "notifications" && (
                                        <NotificationsSection
                                            settings={settings}
                                            updateSettings={updateSettings}
                                        />
                                    )}

                                    {/* Preferences Settings */}
                                    {activeSection === "preferences" && (
                                        <PreferencesSection
                                            settings={settings}
                                            updateSettings={updateSettings}
                                        />
                                    )}

                                    {/* Features Settings */}
                                    {activeSection === "features" && (
                                        <FeaturesSection
                                            settings={settings}
                                            updateSettings={updateSettings}
                                        />
                                    )}

                                    {/* Integrations Settings */}
                                    {activeSection === "integrations" && (
                                        <IntegrationsSection
                                            settings={settings}
                                            updateSettings={updateSettings}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// GENERAL SECTION
// ============================================================
function GeneralSection({
    settings,
    updateSettings,
}: {
    settings: GeneralSettings;
    updateSettings: (key: keyof GeneralSettings, value: any) => void;
}) {
    return (
        <motion.div
            key="general"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <h2 className="text-lg font-semibold text-gray-800">General Settings</h2>
            <p className="text-sm text-gray-500">
                Configure basic system information and preferences
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        System Name
                    </label>
                    <input
                        type="text"
                        value={settings.systemName}
                        onChange={(e) => updateSettings("systemName", e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        System Email
                    </label>
                    <input
                        type="email"
                        value={settings.systemEmail}
                        onChange={(e) => updateSettings("systemEmail", e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        System Phone
                    </label>
                    <input
                        type="text"
                        value={settings.systemPhone}
                        onChange={(e) => updateSettings("systemPhone", e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Currency
                    </label>
                    <select
                        value={settings.currency}
                        onChange={(e) => updateSettings("currency", e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                        <option value="USD">USD - US Dollar ($)</option>
                        <option value="EUR">EUR - Euro (€)</option>
                        <option value="GBP">GBP - British Pound (£)</option>
                        <option value="BDT">BDT - Bangladeshi Taka (৳)</option>
                        <option value="INR">INR - Indian Rupee (₹)</option>
                        <option value="CAD">CAD - Canadian Dollar (C$)</option>
                        <option value="AUD">AUD - Australian Dollar (A$)</option>
                        <option value="JPY">JPY - Japanese Yen (¥)</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        System Address
                    </label>
                    <textarea
                        value={settings.systemAddress}
                        onChange={(e) => updateSettings("systemAddress", e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                    />
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// BRANDING SECTION
// ============================================================
function BrandingSection({
    settings,
    updateBrandingImage,
    deleteBrandingImage,
    handleImageUpload,
    updateSettings,
}: {
    settings: GeneralSettings;
    updateBrandingImage: (key: keyof BrandingImages, value: string) => void;
    deleteBrandingImage: (key: keyof BrandingImages) => void;
    handleImageUpload: (key: keyof BrandingImages, file: File, maxSizeMB: number) => void;
    updateSettings: (key: keyof GeneralSettings, value: any) => void;
}) {
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const imageConfigs = [
        { key: 'logo' as keyof BrandingImages, label: 'Logo', desc: 'Upload your company logo', maxSize: 5 },
        { key: 'favicon' as keyof BrandingImages, label: 'Favicon', desc: 'Upload your favicon', maxSize: 1 },
        { key: 'loginBackground' as keyof BrandingImages, label: 'Login Background', desc: 'Upload login page background', maxSize: 5 },
        { key: 'dashboardBanner' as keyof BrandingImages, label: 'Dashboard Banner', desc: 'Upload dashboard banner', maxSize: 5 },
        { key: 'emailHeader' as keyof BrandingImages, label: 'Email Header', desc: 'Upload email header image', maxSize: 2 },
        { key: 'emailFooter' as keyof BrandingImages, label: 'Email Footer', desc: 'Upload email footer image', maxSize: 2 },
    ];

    return (
        <motion.div
            key="branding"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <h2 className="text-lg font-semibold text-gray-800">Branding</h2>
            <p className="text-sm text-gray-500">
                Configure system branding and upload images
            </p>

            <div className="space-y-4">
                {imageConfigs.map((image) => {
                    const imageValue = settings.brandingImages?.[image.key] || '';

                    return (
                        <div key={image.key} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {image.label}
                                    </label>
                                    <p className="text-xs text-gray-400">{image.desc}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Max size: {image.maxSize}MB</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {imageValue && (
                                        <div className="relative">
                                            <img
                                                src={imageValue}
                                                alt={image.label}
                                                className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-white p-1"
                                            />
                                            <button
                                                onClick={() => deleteBrandingImage(image.key)}
                                                className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}

                                    <label className="cursor-pointer">
                                        <div className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition text-sm flex items-center gap-2 border border-indigo-200">
                                            <Upload size={16} />
                                            {imageValue ? 'Change' : 'Upload'}
                                        </div>
                                        <input
                                            ref={(el) => { fileInputRefs.current[image.key] = el; }}
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleImageUpload(image.key, file, image.maxSize);
                                                }
                                                e.target.value = '';
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                            {imageValue && (
                                <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                                    <CheckCircle size={12} />
                                    Image uploaded successfully
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Theme Preview */}
            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Theme Preview</h4>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => updateSettings("theme", "light")}
                        className={`p-3 rounded-xl border-2 transition-all ${settings.theme === "light"
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                    >
                        <Sun size={24} className={settings.theme === "light" ? "text-indigo-600" : "text-gray-400"} />
                        <span className="text-xs text-gray-600 mt-1 block">Light</span>
                    </button>
                    <button
                        onClick={() => updateSettings("theme", "dark")}
                        className={`p-3 rounded-xl border-2 transition-all ${settings.theme === "dark"
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                    >
                        <Moon size={24} className={settings.theme === "dark" ? "text-indigo-600" : "text-gray-400"} />
                        <span className="text-xs text-gray-600 mt-1 block">Dark</span>
                    </button>
                    <button
                        onClick={() => updateSettings("theme", "system")}
                        className={`p-3 rounded-xl border-2 transition-all ${settings.theme === "system"
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                    >
                        <Monitor size={24} className={settings.theme === "system" ? "text-indigo-600" : "text-gray-400"} />
                        <span className="text-xs text-gray-600 mt-1 block">System</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// AUTHENTICATION SECTION
// ============================================================
function AuthenticationSection({
    settings,
    updateSettings,
    updatePasswordPolicy,
    showPasswordPolicy,
    setShowPasswordPolicy,
}: {
    settings: GeneralSettings;
    updateSettings: (key: keyof GeneralSettings, value: any) => void;
    updatePasswordPolicy: (key: keyof GeneralSettings["passwordPolicy"], value: any) => void;
    showPasswordPolicy: boolean;
    setShowPasswordPolicy: (show: boolean) => void;
}) {
    return (
        <motion.div
            key="authentication"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <h2 className="text-lg font-semibold text-gray-800">Authentication</h2>
            <p className="text-sm text-gray-500">
                Configure authentication and security settings
            </p>

            <div className="space-y-4">
                <ToggleItem
                    label="Allow Registration"
                    description="Allow new users to register"
                    checked={settings.allowRegistration}
                    onChange={(checked) => updateSettings("allowRegistration", checked)}
                />

                <ToggleItem
                    label="Email Verification"
                    description="Require email verification for new users"
                    checked={settings.requireEmailVerification}
                    onChange={(checked) => updateSettings("requireEmailVerification", checked)}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Session Timeout (minutes)
                    </label>
                    <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => updateSettings("sessionTimeout", parseInt(e.target.value) || 60)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Max Login Attempts
                    </label>
                    <input
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => updateSettings("maxLoginAttempts", parseInt(e.target.value) || 5)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                </div>

                <div>
                    <button
                        onClick={() => setShowPasswordPolicy(!showPasswordPolicy)}
                        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                    >
                        {showPasswordPolicy ? <ChevronRight size={16} className="rotate-90" /> : <ChevronRight size={16} />}
                        Password Policy Settings
                    </button>

                    <AnimatePresence>
                        {showPasswordPolicy && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 p-4 bg-gray-50/80 rounded-xl border border-gray-200 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Minimum Password Length
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.passwordPolicy.minLength}
                                            onChange={(e) => updatePasswordPolicy("minLength", parseInt(e.target.value) || 8)}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <ToggleItem
                                            label="Require Uppercase"
                                            checked={settings.passwordPolicy.requireUppercase}
                                            onChange={(checked) => updatePasswordPolicy("requireUppercase", checked)}
                                        />
                                        <ToggleItem
                                            label="Require Lowercase"
                                            checked={settings.passwordPolicy.requireLowercase}
                                            onChange={(checked) => updatePasswordPolicy("requireLowercase", checked)}
                                        />
                                        <ToggleItem
                                            label="Require Numbers"
                                            checked={settings.passwordPolicy.requireNumbers}
                                            onChange={(checked) => updatePasswordPolicy("requireNumbers", checked)}
                                        />
                                        <ToggleItem
                                            label="Require Special Characters"
                                            checked={settings.passwordPolicy.requireSpecialChars}
                                            onChange={(checked) => updatePasswordPolicy("requireSpecialChars", checked)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Password Expiry (days)
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.passwordPolicy.expireDays}
                                            onChange={(e) => updatePasswordPolicy("expireDays", parseInt(e.target.value) || 90)}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Set to 0 for no expiry</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// SECURITY SECTION
// ============================================================
function SecuritySection({
    settings,
    updateSettings,
    newIp,
    setNewIp,
    addIpToWhitelist,
    removeIpFromWhitelist,
    newDomain,
    setNewDomain,
    addAllowedDomain,
    removeAllowedDomain,
}: {
    settings: GeneralSettings;
    updateSettings: (key: keyof GeneralSettings, value: any) => void;
    newIp: string;
    setNewIp: (ip: string) => void;
    addIpToWhitelist: () => void;
    removeIpFromWhitelist: (ip: string) => void;
    newDomain: string;
    setNewDomain: (domain: string) => void;
    addAllowedDomain: () => void;
    removeAllowedDomain: (domain: string) => void;
}) {
    return (
        <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <h2 className="text-lg font-semibold text-gray-800">Security</h2>
            <p className="text-sm text-gray-500">
                Configure security settings and access controls
            </p>

            <div className="space-y-4">
                <ToggleItem
                    label="Two-Factor Authentication"
                    description="Require 2FA for all users"
                    checked={settings.twoFactorAuth}
                    onChange={(checked) => updateSettings("twoFactorAuth", checked)}
                />

                <ToggleItem
                    label="Maintenance Mode"
                    description="Put the system in maintenance mode"
                    checked={settings.maintenanceMode}
                    onChange={(checked) => updateSettings("maintenanceMode", checked)}
                />

                {settings.maintenanceMode && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Maintenance Message
                        </label>
                        <textarea
                            value={settings.maintenanceMessage}
                            onChange={(e) => updateSettings("maintenanceMessage", e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        IP Whitelist
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newIp}
                            onChange={(e) => setNewIp(e.target.value)}
                            placeholder="Enter IP address (e.g., 192.168.1.1)"
                            className="flex-1 px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                        <button
                            onClick={addIpToWhitelist}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {settings.ipWhitelist.map((ip) => (
                            <span
                                key={ip}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700"
                            >
                                {ip}
                                <button
                                    onClick={() => removeIpFromWhitelist(ip)}
                                    className="text-gray-400 hover:text-rose-500 transition"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                        {settings.ipWhitelist.length === 0 && (
                            <span className="text-xs text-gray-400">No IPs whitelisted</span>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Allowed Email Domains
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            placeholder="Enter domain (e.g., company.com)"
                            className="flex-1 px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                        <button
                            onClick={addAllowedDomain}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {settings.allowedDomains.map((domain) => (
                            <span
                                key={domain}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700"
                            >
                                {domain}
                                <button
                                    onClick={() => removeAllowedDomain(domain)}
                                    className="text-gray-400 hover:text-rose-500 transition"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                        {settings.allowedDomains.length === 0 && (
                            <span className="text-xs text-gray-400">No domains restricted</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// NOTIFICATIONS SECTION
// ============================================================
function NotificationsSection({
    settings,
    updateSettings,
}: {
    settings: GeneralSettings;
    updateSettings: (key: keyof GeneralSettings, value: any) => void;
}) {
    const notificationItems = [
        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send email notifications' },
        { key: 'pushNotifications', label: 'Push Notifications', desc: 'Send push notifications' },
        { key: 'desktopNotifications', label: 'Desktop Notifications', desc: 'Show desktop notifications' },
        { key: 'notificationSound', label: 'Notification Sound', desc: 'Play sound for notifications' },
    ];

    return (
        <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
            <p className="text-sm text-gray-500">
                Configure notification preferences
            </p>

            <div className="space-y-3">
                {notificationItems.map((item) => (
                    <ToggleItem
                        key={item.key}
                        label={item.label}
                        description={item.desc}
                        checked={settings[item.key as keyof GeneralSettings] as boolean}
                        onChange={(checked) => updateSettings(item.key as keyof GeneralSettings, checked)}
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ============================================================
// PREFERENCES SECTION
// ============================================================
function PreferencesSection({
    settings,
    updateSettings,
}: {
    settings: GeneralSettings;
    updateSettings: (key: keyof GeneralSettings, value: any) => void;
}) {
    return (
        <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <h2 className="text-lg font-semibold text-gray-800">Preferences</h2>
            <p className="text-sm text-gray-500">
                Configure system preferences and defaults
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Default Language
                    </label>
                    <select
                        value={settings.language}
                        onChange={(e) => updateSettings("language", e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                        <option value="ja">Japanese</option>
                        <option value="bn">Bengali</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Timezone
                    </label>
                    <select
                        value={settings.timezone}
                        onChange={(e) => updateSettings("timezone", e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (EST)</option>
                        <option value="America/Chicago">Central Time (CST)</option>
                        <option value="America/Denver">Mountain Time (MST)</option>
                        <option value="America/Los_Angeles">Pacific Time (PST)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Dubai">Dubai (GST)</option>
                        <option value="Asia/Kolkata">India (IST)</option>
                        <option value="Asia/Dhaka">Bangladesh (BST)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                        <option value="Australia/Sydney">Sydney (AEST)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Date Format
                    </label>
                    <select
                        value={settings.dateFormat}
                        onChange={(e) => updateSettings("dateFormat", e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="MMMM D, YYYY">MMMM D, YYYY</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Time Format
                    </label>
                    <select
                        value={settings.timeFormat}
                        onChange={(e) => updateSettings("timeFormat", e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                        <option value="12h">12-hour (AM/PM)</option>
                        <option value="24h">24-hour</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Week Start Day
                    </label>
                    <select
                        value={settings.weekStartDay}
                        onChange={(e) => updateSettings("weekStartDay", e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                        <option value="Sunday">Sunday</option>
                        <option value="Monday">Monday</option>
                        <option value="Saturday">Saturday</option>
                    </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Compact Mode</p>
                        <p className="text-xs text-gray-400">Use compact UI layout</p>
                    </div>
                    <Toggle
                        checked={settings.compactMode}
                        onChange={(checked) => updateSettings("compactMode", checked)}
                    />
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// FEATURES SECTION
// ============================================================
function FeaturesSection({
    settings,
    updateSettings,
}: {
    settings: GeneralSettings;
    updateSettings: (key: keyof GeneralSettings, value: any) => void;
}) {
    const featureItems = [
        { key: 'enableKPIModule', label: 'KPI Module', desc: 'Enable Key Performance Indicators', icon: Trophy },
        { key: 'enableTimesheetModule', label: 'Timesheet Module', desc: 'Enable time tracking', icon: Clock },
        { key: 'enableLeaveModule', label: 'Leave Management', desc: 'Enable leave requests', icon: Calendar },
        { key: 'enableChatModule', label: 'Chat Module', desc: 'Enable team chat', icon: MessageSquare },
        { key: 'enableReportingModule', label: 'Reporting Module', desc: 'Enable reports and analytics', icon: BarChart3 },
        { key: 'enableAIAssistant', label: 'AI Assistant', desc: 'Enable AI-powered assistant', icon: Sparkles },
    ];

    return (
        <motion.div
            key="features"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <h2 className="text-lg font-semibold text-gray-800">Features</h2>
            <p className="text-sm text-gray-500">
                Enable or disable system features
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {featureItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.key}
                            className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    <Icon size={18} className="text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                                    <p className="text-xs text-gray-400">{item.desc}</p>
                                </div>
                            </div>
                            <Toggle
                                checked={settings[item.key as keyof GeneralSettings] as boolean}
                                onChange={(checked) => updateSettings(item.key as keyof GeneralSettings, checked)}
                            />
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}

// ============================================================
// INTEGRATIONS SECTION
// ============================================================
function IntegrationsSection({
    settings,
    updateSettings,
}: {
    settings: GeneralSettings;
    updateSettings: (key: keyof GeneralSettings, value: any) => void;
}) {
    return (
        <motion.div
            key="integrations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <h2 className="text-lg font-semibold text-gray-800">Integrations</h2>
            <p className="text-sm text-gray-500">
                Configure third-party integrations
            </p>

            {/* Slack Integration */}
            <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <Cloud size={18} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">Slack Integration</p>
                            <p className="text-xs text-gray-400">Send notifications to Slack</p>
                        </div>
                    </div>
                    <Toggle
                        checked={settings.enableSlackIntegration}
                        onChange={(checked) => updateSettings("enableSlackIntegration", checked)}
                    />
                </div>
                {settings.enableSlackIntegration && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Slack Webhook URL
                        </label>
                        <input
                            type="text"
                            value={settings.slackWebhookUrl}
                            onChange={(e) => updateSettings("slackWebhookUrl", e.target.value)}
                            placeholder="https://hooks.slack.com/services/..."
                            className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                    </div>
                )}
            </div>

            {/* Discord Integration */}
            <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                            <Cloud size={18} className="text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">Discord Integration</p>
                            <p className="text-xs text-gray-400">Send notifications to Discord</p>
                        </div>
                    </div>
                    <Toggle
                        checked={settings.enableDiscordIntegration}
                        onChange={(checked) => updateSettings("enableDiscordIntegration", checked)}
                    />
                </div>
                {settings.enableDiscordIntegration && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Discord Webhook URL
                        </label>
                        <input
                            type="text"
                            value={settings.discordWebhookUrl}
                            onChange={(e) => updateSettings("discordWebhookUrl", e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                    </div>
                )}
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