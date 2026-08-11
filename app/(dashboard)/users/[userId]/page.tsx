"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Building2,
    Briefcase,
    Calendar,
    Loader2,
    AlertCircle,
    RefreshCw,
    Award,
    Star,
    Clock,
    CheckCircle2,
    Shield,
    Activity,
    ExternalLink,
    Layers,
    Globe,
    UserCheck,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion } from "framer-motion";

interface UserData {
    _id: string;
    fullName: string;
    email: string;
    employeeId: string;
    role: string;
    departmentId: string | null;
    department: {
        _id: string;
        name: string;
        code: string;
    } | null;
    position?: string;
    phone?: string;
    phoneNumber?: string;
    location?: string;
    bio?: string;
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt?: string;
    avatar?: string;
    profilePhoto?: string;
    jobTitle?: string;
    companyName?: string;
    website?: string;
    firstLogin?: boolean;
    onboardingCompleted?: boolean;
}

export default function UserDetailPage() {
    const { hasRole } = useAuth();
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;

    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get(`/users/${userId}`);
            if (response.data.success) {
                setUser(response.data.data);
            } else {
                setError("User record not found");
            }
        } catch (err: any) {
            console.error("Error fetching user:", err);
            if (err.response?.status === 404) {
                setError("User record not found");
            } else if (err.response?.status === 403) {
                setError("Restricted: You lack permission to access this profile");
            } else {
                setError("Failed to synchronize user dataset");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUser();
        }
    }, [userId]);

    const getRoleDisplayName = (role: string) => {
        const roleMap: Record<string, string> = {
            super_admin: "Super Admin",
            admin: "Administrator",
            hr_manager: "HR Manager",
            dept_manager: "Department Manager",
            project_manager: "Project Manager",
            line_manager: "Line Manager",
            employee: "Employee",
            user: "Standard User",
        };
        return roleMap[role] || role;
    };

    const getDepartmentName = (dept: any) => {
        if (!dept) return "Unassigned Unit";
        if (typeof dept === "string") return dept;
        if (dept.name) return `${dept.name} (${dept.code || ""})`;
        return "Unassigned Unit";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-xs font-medium text-slate-400">Loading user profile...</p>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center bg-white rounded-3xl p-8 border border-slate-100 shadow-xl max-w-md w-full space-y-4"
                >
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">{error || "User Not Found"}</h2>
                        <p className="text-slate-500 text-sm">The target profile does not exist or has been removed from the directory.</p>
                    </div>
                    <button
                        onClick={() => router.push("/users")}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20"
                    >
                        Return to Directory
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/60 antialiased">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Navigation & Toolbar Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition shadow-xs flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                    <button
                        onClick={fetchUser}
                        title="Refresh Profile Data"
                        className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin text-indigo-600" : ""} />
                    </button>
                </div>

                {/* Profile Card Container */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                    {/* Cover & Hero Identity Banner */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                        <div className="bg-linear-to-r from-indigo-900 via-slate-900 to-indigo-950 p-8 sm:p-10 text-white relative">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-3xl font-extrabold border-2 border-white/20 shadow-2xl shrink-0">
                                    {user.fullName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .substring(0, 2)
                                        .toUpperCase()}
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{user.fullName}</h1>
                                        <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-bold rounded-full">
                                            {getRoleDisplayName(user.role)}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 text-xs font-medium flex items-center gap-2 font-mono">
                                        <span>ID: {user.employeeId}</span>
                                        <span>•</span>
                                        <span>{getDepartmentName(user.department || user.departmentId)}</span>
                                    </p>
                                    <div className="flex items-center gap-2 pt-1">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${user.isActive ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                            }`}>
                                            {user.isActive ? "Active Account" : "Inactive Account"}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${user.isEmailVerified ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                            }`}>
                                            {user.isEmailVerified ? "Email Verified" : "Unverified Email"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Information Grid Sections */}
                        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Contact Information */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Credentials</h3>
                                <div className="space-y-3 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3.5 text-xs font-medium text-slate-700">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-indigo-600 shadow-xs">
                                            <Mail size={15} />
                                        </div>
                                        <span>{user.email}</span>
                                    </div>
                                    {(user.phone || user.phoneNumber) && (
                                        <div className="flex items-center gap-3.5 text-xs font-medium text-slate-700">
                                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-indigo-600 shadow-xs">
                                                <Phone size={15} />
                                            </div>
                                            <span>{user.phone || user.phoneNumber}</span>
                                        </div>
                                    )}
                                    {user.location && (
                                        <div className="flex items-center gap-3.5 text-xs font-medium text-slate-700">
                                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-indigo-600 shadow-xs">
                                                <MapPin size={15} />
                                            </div>
                                            <span>{user.location}</span>
                                        </div>
                                    )}
                                    {user.website && (
                                        <div className="flex items-center gap-3.5 text-xs font-medium text-slate-700">
                                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-indigo-600 shadow-xs">
                                                <Globe size={15} />
                                            </div>
                                            <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 font-bold">
                                                {user.website} <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Professional Scope */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Professional Placement</h3>
                                <div className="space-y-3 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3.5 text-xs font-medium text-slate-700">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-emerald-600 shadow-xs">
                                            <Building2 size={15} />
                                        </div>
                                        <span>{getDepartmentName(user.department || user.departmentId)}</span>
                                    </div>
                                    {user.jobTitle && (
                                        <div className="flex items-center gap-3.5 text-xs font-medium text-slate-700">
                                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-emerald-600 shadow-xs">
                                                <Briefcase size={15} />
                                            </div>
                                            <span>{user.jobTitle}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3.5 text-xs font-medium text-slate-700">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-emerald-600 shadow-xs">
                                            <Calendar size={15} />
                                        </div>
                                        <span>Joined on {new Date(user.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Bio Section */}
                        {user.bio && (
                            <div className="px-6 sm:px-8 pb-8">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Biographical Overview</h3>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                                    {user.bio}
                                </div>
                            </div>
                        )}

                        {/* Quick Action Navigation Buttons */}
                        <div className="p-6 sm:p-8 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center gap-3">
                            <Link
                                href={`/kpi/employee/${userId}`}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-2"
                            >
                                <Award size={14} />
                                Evaluate KPI Metrics
                            </Link>
                        </div>

                    </div>
                </motion.div>

            </div>
        </div>
    );
}