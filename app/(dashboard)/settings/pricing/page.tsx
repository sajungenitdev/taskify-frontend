// app/(dashboard)/pricing/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Loader2,
    Eye,
    EyeOff,
    Users,
    Crown,
    Star,
    TrendingUp,
    Briefcase,
    User,
    X,
    Save,
    Check,
    AlertCircle,
    DollarSign,
    Calendar,
    Clock,
    Zap,
    Gift,
    Tag,
    Layers,
    List,
    Sparkles,
    ArrowUpRight,
    CheckCircle2,
    Circle,
    Settings2,
    Copy,
    MoreVertical,
    MoveUp,
    MoveDown,
} from "lucide-react";
import { apiService } from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface PricingPlan {
    _id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    isPopular: boolean;
    isActive: boolean;
    billingCycle: "monthly" | "quarterly" | "semiannual" | "yearly" | "one-time";
    price: number;
    currency: string;
    discount: number;
    originalPrice: number;
    features: string[];
    limits: {
        users: number;
        projects: number;
        tasks: number;
        storage: number;
        teamMembers: number;
    };
    trialDays: number;
    badge: string;
    color: string;
    order: number;
    isOneTime: boolean;
    contactSales: boolean;
}

const defaultPlan: Partial<PricingPlan> = {
    name: "",
    description: "",
    icon: "Users",
    isPopular: false,
    isActive: true,
    billingCycle: "monthly",
    price: 0,
    currency: "BDT",
    discount: 0,
    originalPrice: 0,
    features: [],
    limits: {
        users: 1,
        projects: 0,
        tasks: 0,
        storage: 0,
        teamMembers: 0,
    },
    trialDays: 7,
    badge: "",
    color: "indigo",
    order: 0,
    isOneTime: false,
    contactSales: false,
};

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24,
        },
    },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: {
            duration: 0.2,
        },
    },
};

export default function PricingAdminPage() {
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
    const [formData, setFormData] = useState<Partial<PricingPlan>>(defaultPlan);
    const [featureInput, setFeatureInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await apiService.get("/pricing-plans");
            if (response.success) {
                setPlans(response.data);
            }
        } catch (error: any) {
            console.error("Error fetching plans:", error);
            toast.error(error.response?.data?.message || "Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleOpenModal = (plan?: PricingPlan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData(plan);
        } else {
            setEditingPlan(null);
            setFormData(defaultPlan);
        }
        setErrors({});
        setFeatureInput("");
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPlan(null);
        setFormData(defaultPlan);
        setFeatureInput("");
        setErrors({});
        setIsSubmitting(false);
    };

    const handleAddFeature = () => {
        if (featureInput.trim()) {
            setFormData({
                ...formData,
                features: [...(formData.features || []), featureInput.trim()],
            });
            setFeatureInput("");
        }
    };

    const handleRemoveFeature = (index: number) => {
        setFormData({
            ...formData,
            features: (formData.features || []).filter((_, i) => i !== index),
        });
    };

    const handleFeatureKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddFeature();
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) {
            newErrors.name = "Plan name is required";
        }
        if (!formData.description?.trim()) {
            newErrors.description = "Description is required";
        }
        if (formData.price === undefined || formData.price < 0) {
            newErrors.price = "Price must be 0 or greater";
        }
        if (formData.trialDays === undefined || formData.trialDays < 0) {
            newErrors.trialDays = "Trial days must be 0 or greater";
        }
        if ((formData.features || []).length === 0) {
            newErrors.features = "At least one feature is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                name: formData.name?.trim(),
                features: formData.features || [],
                limits: {
                    users: formData.limits?.users || 1,
                    projects: formData.limits?.projects || 0,
                    tasks: formData.limits?.tasks || 0,
                    storage: formData.limits?.storage || 0,
                    teamMembers: formData.limits?.teamMembers || 0,
                },
            };

            let response;
            if (editingPlan) {
                response = await apiService.put(`/pricing-plans/${editingPlan._id}`, payload);
            } else {
                response = await apiService.post("/pricing-plans", payload);
            }

            if (response.success) {
                toast.success(editingPlan ? "Plan updated successfully" : "Plan created successfully");
                handleCloseModal();
                fetchPlans();
            }
        } catch (error: any) {
            console.error("Error saving plan:", error);
            toast.error(error.response?.data?.message || "Failed to save plan");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;
        try {
            const response = await apiService.delete(`/pricing-plans/${id}`);
            if (response.success) {
                toast.success("Plan deleted successfully");
                fetchPlans();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete plan");
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            const response = await apiService.patch(`/pricing-plans/${id}/toggle`);
            if (response.success) {
                toast.success("Plan status updated");
                fetchPlans();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update plan status");
        }
    };

    const getIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            Users: Users,
            User: User,
            Crown: Crown,
            Star: Star,
            TrendingUp: TrendingUp,
            Briefcase: Briefcase,
            Zap: Zap,
            Gift: Gift,
            Tag: Tag,
            Layers: Layers,
            List: List,
            Sparkles: Sparkles,
        };
        return icons[iconName] || Users;
    };

    const iconOptions = ["Users", "User", "Crown", "Star", "TrendingUp", "Briefcase", "Zap", "Gift", "Tag", "Layers", "Sparkles"];
    const colorOptions = [
        { name: "Indigo", value: "indigo", bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400", ring: "ring-indigo-500" },
        { name: "Emerald", value: "emerald", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500" },
        { name: "Blue", value: "blue", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500" },
        { name: "Purple", value: "purple", bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500" },
        { name: "Pink", value: "pink", bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-600 dark:text-pink-400", ring: "ring-pink-500" },
        { name: "Orange", value: "orange", bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400", ring: "ring-orange-500" },
        { name: "Teal", value: "teal", bg: "bg-teal-50 dark:bg-teal-900/20", text: "text-teal-600 dark:text-teal-400", ring: "ring-teal-500" },
        { name: "Red", value: "red", bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", ring: "ring-red-500" },
        { name: "Yellow", value: "yellow", bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-600 dark:text-yellow-400", ring: "ring-yellow-500" },
    ];
    const billingCycleOptions = [
        { value: "monthly", label: "Monthly", icon: Calendar },
        { value: "quarterly", label: "Quarterly", icon: Clock },
        { value: "semiannual", label: "Semiannual", icon: Clock },
        { value: "yearly", label: "Yearly", icon: Calendar },
        { value: "one-time", label: "One-Time", icon: DollarSign },
    ];

    const getCycleLabel = (cycle: string) => {
        const found = billingCycleOptions.find(c => c.value === cycle);
        return found ? found.label : cycle;
    };

    const getPriceDisplay = (plan: PricingPlan) => {
        if (plan.contactSales) return "Contact Sales";
        if (plan.isOneTime) {
            return `${plan.currency} ${plan.price.toLocaleString()}`;
        }
        const finalPrice = plan.discount > 0
            ? plan.price * (1 - plan.discount / 100)
            : plan.price;
        return `${plan.currency} ${Math.round(finalPrice).toLocaleString()}`;
    };

    const getOriginalPriceDisplay = (plan: PricingPlan) => {
        if (plan.discount > 0 && plan.price > 0) {
            return `${plan.currency} ${plan.price.toLocaleString()}`;
        }
        return null;
    };

    const getSavingsDisplay = (plan: PricingPlan) => {
        if (plan.discount > 0) {
            return `Save ${plan.discount}%`;
        }
        return null;
    };

    const getBadgeColor = (badge: string) => {
        const colors: Record<string, string> = {
            popular: "bg-gradient-to-r from-amber-400 to-orange-500 text-white",
            'best-value': "bg-gradient-to-r from-emerald-400 to-teal-500 text-white",
            enterprise: "bg-gradient-to-r from-purple-400 to-indigo-500 text-white",
        };
        return colors[badge] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    };

    const filteredPlans = plans.filter(plan => {
        const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" ||
            (filterStatus === "active" && plan.isActive) ||
            (filterStatus === "inactive" && !plan.isActive);
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading pricing plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 container mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"
            >
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
                            <Tag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                                Pricing Plans
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Manage your subscription pricing plans
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={fetchPlans}
                        className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 text-gray-600 dark:text-gray-400"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Plan</span>
                    </motion.button>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
                {[
                    { label: "Total Plans", value: plans.length, icon: Layers, color: "indigo" },
                    { label: "Active Plans", value: plans.filter(p => p.isActive).length, icon: Eye, color: "emerald" },
                    { label: "Popular Plans", value: plans.filter(p => p.isPopular).length, icon: Crown, color: "amber" },
                    { label: "With Trial", value: plans.filter(p => p.trialDays > 0).length, icon: Gift, color: "purple" },
                ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -4 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20`}>
                                    <Icon className={`w-4 h-4 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col sm:flex-row gap-3 mb-6"
            >
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search plans..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 pl-10 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <div className="flex gap-2">
                    {["all", "active", "inactive"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status as any)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${filterStatus === status
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Plans Grid */}
            {filteredPlans.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700"
                >
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tag className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No pricing plans found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        {searchTerm || filterStatus !== "all" ? "Try adjusting your filters" : "Create your first pricing plan to get started"}
                    </p>
                    {(searchTerm || filterStatus !== "all") ? (
                        <button
                            onClick={() => { setSearchTerm(""); setFilterStatus("all"); }}
                            className="mt-4 px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition inline-flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Clear Filters
                        </button>
                    ) : (
                        <button
                            onClick={() => handleOpenModal()}
                            className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition inline-flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                        >
                            <Plus className="w-4 h-4" />
                            Create First Plan
                        </button>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                    {filteredPlans.map((plan) => {
                        const Icon = getIcon(plan.icon);
                        const isActive = plan.isActive;
                        const priceDisplay = getPriceDisplay(plan);
                        const originalPrice = getOriginalPriceDisplay(plan);
                        const savings = getSavingsDisplay(plan);
                        const colorConfig = colorOptions.find(c => c.value === plan.color) || colorOptions[0];

                        return (
                            <motion.div
                                key={plan._id}
                                variants={itemVariants}
                                whileHover={{ y: -4 }}
                                className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-all duration-300 ${isActive
                                    ? 'border-gray-200 dark:border-gray-700 hover:shadow-xl'
                                    : 'border-red-200 dark:border-red-800/50 opacity-70 hover:opacity-100'
                                    }`}
                            >
                                {/* Status indicator */}
                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${colorConfig.bg}`}>
                                                <Icon className={`w-5 h-5 ${colorConfig.text}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {getCycleLabel(plan.billingCycle)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleToggleStatus(plan._id)}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                                title={isActive ? "Deactivate" : "Activate"}
                                            >
                                                {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleOpenModal(plan)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleDelete(plan._id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {plan.isPopular && (
                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-medium flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                Popular
                                            </span>
                                        )}
                                        {plan.badge && (
                                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getBadgeColor(plan.badge)}`}>
                                                {plan.badge.charAt(0).toUpperCase() + plan.badge.slice(1)}
                                            </span>
                                        )}
                                        {plan.trialDays > 0 && (
                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                                                <Gift className="w-3 h-3" />
                                                {plan.trialDays} days trial
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                                        {plan.description}
                                    </p>

                                    {/* Price */}
                                    <div className="mb-4">
                                        {plan.contactSales ? (
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                Contact Sales
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                                    {priceDisplay}
                                                </span>
                                                {!plan.isOneTime && (
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                                        /{plan.billingCycle}
                                                    </span>
                                                )}
                                                {originalPrice && (
                                                    <span className="text-sm text-gray-400 line-through ml-2">
                                                        {originalPrice}
                                                    </span>
                                                )}
                                                {savings && (
                                                    <span className="inline-block ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                                        {savings}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Limits */}
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <span className="flex items-center gap-1">👤 {plan.limits.users || '∞'} Users</span>
                                        <span className="flex items-center gap-1">📁 {plan.limits.projects || '∞'} Projects</span>
                                        <span className="flex items-center gap-1">📋 {plan.limits.tasks || '∞'} Tasks</span>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            Features
                                        </p>
                                        <ul className="space-y-1">
                                            {(plan.features || []).slice(0, 4).map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-1">{feature}</span>
                                                </li>
                                            ))}
                                            {(plan.features || []).length > 4 && (
                                                <li className="text-xs text-gray-400 pl-6">
                                                    +{plan.features.length - 4} more features
                                                </li>
                                            )}
                                            {(plan.features || []).length === 0 && (
                                                <li className="text-sm text-gray-400 italic">No features added</li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <MoveUp className="w-3 h-3" />
                                            Order: {plan.order}
                                        </span>
                                        <span className="font-mono">ID: {plan._id.slice(-6)}</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${editingPlan ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-indigo-50 dark:bg-indigo-900/30'}`}>
                                        {editingPlan ? <Edit className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {editingPlan ? 'Update pricing plan details' : 'Add a new pricing plan'}
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleCloseModal}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </motion.button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Plan Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            placeholder="e.g., Pro Plan"
                                        />
                                        {errors.name && (
                                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Badge (Optional)
                                        </label>
                                        <select
                                            value={formData.badge || ''}
                                            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition"
                                        >
                                            <option value="">None</option>
                                            <option value="popular">🔥 Popular</option>
                                            <option value="best-value">⭐ Best Value</option>
                                            <option value="enterprise">🏢 Enterprise</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        placeholder="Describe this plan..."
                                    />
                                    {errors.description && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                {/* Icon & Color */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Icon
                                        </label>
                                        <select
                                            value={formData.icon || 'Users'}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition"
                                        >
                                            {iconOptions.map((icon) => (
                                                <option key={icon} value={icon}>{icon}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Color
                                        </label>
                                        <select
                                            value={formData.color || 'indigo'}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition"
                                        >
                                            {colorOptions.map((color) => (
                                                <option key={color.value} value={color.value}>
                                                    {color.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Trial Days
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.trialDays || 7}
                                            onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition"
                                        />
                                        {errors.trialDays && (
                                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {errors.trialDays}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Display Order
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.order || 0}
                                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition"
                                        />
                                    </div>
                                </div>

                                {/* Billing Cycle */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Billing Cycle <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                        {billingCycleOptions.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <motion.button
                                                    key={option.value}
                                                    type="button"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        setFormData({
                                                            ...formData,
                                                            billingCycle: option.value as any,
                                                            isOneTime: option.value === 'one-time',
                                                            contactSales: false,
                                                        });
                                                    }}
                                                    className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${formData.billingCycle === option.value
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-lg shadow-indigo-500/10'
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                                        }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {option.label}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Price <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                                                {formData.currency || 'BDT'}
                                            </span>
                                            <input
                                                type="number"
                                                value={formData.price || 0}
                                                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                                className={`w-full pl-16 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition ${errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                placeholder="0"
                                            />
                                        </div>
                                        {errors.price && (
                                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {errors.price}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Discount (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.discount || 0}
                                            onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition"
                                            placeholder="0"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Currency
                                        </label>
                                        <select
                                            value={formData.currency || 'BDT'}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition"
                                        >
                                            <option value="BDT">BDT (৳)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Toggle Options */}
                                <div className="flex flex-wrap gap-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPopular || false}
                                            onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Mark as Popular</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive ?? true}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.contactSales || false}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                contactSales: e.target.checked,
                                                price: e.target.checked ? 0 : formData.price,
                                            })}
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Contact Sales (Enterprise)</span>
                                    </label>
                                </div>

                                {/* Limits */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Limits (0 = Unlimited)
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Users</label>
                                            <input
                                                type="number"
                                                value={formData.limits?.users || 1}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    limits: { ...formData.limits, users: parseInt(e.target.value) || 1 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white text-sm"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Projects</label>
                                            <input
                                                type="number"
                                                value={formData.limits?.projects || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    limits: { ...formData.limits, projects: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tasks</label>
                                            <input
                                                type="number"
                                                value={formData.limits?.tasks || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    limits: { ...formData.limits, tasks: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Team Members</label>
                                            <input
                                                type="number"
                                                value={formData.limits?.teamMembers || 0}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    limits: { ...formData.limits, teamMembers: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Features <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={featureInput}
                                            onChange={(e) => setFeatureInput(e.target.value)}
                                            onKeyPress={handleFeatureKeyPress}
                                            className={`flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white transition ${errors.features ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            placeholder="Add a feature (press Enter)"
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={handleAddFeature}
                                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add
                                        </motion.button>
                                    </div>
                                    {errors.features && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.features}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                                        {(formData.features || []).map((feature, index) => (
                                            <motion.span
                                                key={index}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-full text-sm shadow-sm border border-gray-200 dark:border-gray-600"
                                            >
                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                {feature}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFeature(index)}
                                                    className="text-gray-400 hover:text-red-600 transition ml-0.5"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </motion.span>
                                        ))}
                                        {(formData.features || []).length === 0 && (
                                            <span className="text-sm text-gray-400 italic">No features added yet</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 font-medium"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center gap-2 font-medium shadow-lg shadow-indigo-500/25"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                {editingPlan ? 'Update Plan' : 'Create Plan'}
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Custom Search Icon component
const SearchIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);