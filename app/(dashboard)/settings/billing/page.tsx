// app/(dashboard)/billing/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    CreditCard,
    Users,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Loader2,
    Search,
    AlertTriangle,
} from "lucide-react";
import { apiService } from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface BillingAccount {
    id: string;
    name: string;
    email: string;
    plan: string;
    status: "active" | "trial" | "expired" | "cancelled" | "suspended";
    joinedDate: string;
    trialEndDate?: string;
    subscriptionEndDate?: string;
    amount: number;
    currency: string;
    billingCycle: string;
    company?: string;
    phone?: string;
    role?: string;
    lastLogin?: string;
    totalSpent?: number;
}

export default function BillingPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<BillingAccount[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        fetchBillingData();
    }, []);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            const accountsRes = await apiService.get("/billing/accounts");

            if (accountsRes.success) {
                console.log("📊 Accounts received:", accountsRes.data);
                console.log("📊 Total accounts:", accountsRes.data.length);

                const processedAccounts = accountsRes.data.map((account: BillingAccount) => ({
                    ...account,
                    currency: account.currency || "USD",
                    amount: account.amount || 0,
                    plan: account.plan || "free",
                    status: account.status || "active",
                    billingCycle: account.billingCycle || "monthly",
                    trialEndDate: account.trialEndDate || null,
                    joinedDate: account.joinedDate || new Date().toISOString(),
                }));

                setAccounts(processedAccounts);
            }
        } catch (error) {
            console.error("Error fetching billing data:", error);
            toast.error("Failed to load billing data");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            paid: "bg-green-100 text-green-700 border-green-200",
            pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
            overdue: "bg-red-100 text-red-700 border-red-200",
            cancelled: "bg-gray-100 text-gray-700 border-gray-200",
            active: "bg-green-100 text-green-700 border-green-200",
            expired: "bg-red-100 text-red-700 border-red-200",
            trial: "bg-blue-100 text-blue-700 border-blue-200",
            completed: "bg-green-100 text-green-700 border-green-200",
            failed: "bg-red-100 text-red-700 border-red-200",
            refunded: "bg-purple-100 text-purple-700 border-purple-200",
            draft: "bg-gray-100 text-gray-700 border-gray-200",
            suspended: "bg-orange-100 text-orange-700 border-orange-200",
        };
        return colors[status] || colors.pending;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "paid":
            case "active":
            case "completed":
                return <CheckCircle className="w-4 h-4" />;
            case "pending":
            case "trial":
                return <Clock className="w-4 h-4" />;
            case "overdue":
            case "expired":
            case "failed":
                return <AlertCircle className="w-4 h-4" />;
            case "cancelled":
                return <XCircle className="w-4 h-4" />;
            case "suspended":
                return <AlertTriangle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const formatCurrency = (amount: number, currency: string = "USD") => {
        try {
            let cleanCurrency = currency?.toString().trim() || "USD";
            cleanCurrency = cleanCurrency.replace(/[$€£¥₹]/g, "").trim();
            if (!cleanCurrency) cleanCurrency = "USD";
            if (cleanCurrency.length !== 3) cleanCurrency = "USD";

            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: cleanCurrency.toUpperCase(),
            }).format(amount || 0);
        } catch (error) {
            return `$${(amount || 0).toFixed(2)}`;
        }
    };

    const formatDate = (date: string) => {
        if (!date) return "N/A";
        try {
            return new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "N/A";
        }
    };

    const filteredAccounts = accounts.filter(account => {
        const matchesSearch = account.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            account.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || account.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <p className="text-gray-500 text-sm">Loading accounts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 container mx-auto container">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Billing Accounts</h1>
                            <p className="text-indigo-100 text-sm">
                                Manage all user billing accounts and subscriptions
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={fetchBillingData}
                            className="px-4 py-2 bg-white text-indigo-600 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Accounts Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Filters */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Accounts</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {filteredAccounts.length} {filteredAccounts.length === 1 ? 'account' : 'accounts'} found
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="trial">Trial</option>
                                <option value="expired">Expired</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {filteredAccounts.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No accounts found</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {accounts.length > 0 ? 'Try adjusting your filters' : 'Users will appear here once they register'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trial</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredAccounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                                    {account.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {account.name || 'Unknown User'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {account.email || 'No email'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900 dark:text-white capitalize">
                                                {account.plan || 'free'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status || 'active')}`}>
                                                {getStatusIcon(account.status || 'active')}
                                                {(account.status || 'active').charAt(0).toUpperCase() + (account.status || 'active').slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {account.trialEndDate ? (
                                                <div className="text-sm">
                                                    <span className={new Date(account.trialEndDate) > new Date() ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}>
                                                        {new Date(account.trialEndDate) > new Date() ? 'Active' : 'Expired'}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                                        Ends {formatDate(account.trialEndDate)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">No trial</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {account.joinedDate ? formatDate(account.joinedDate) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(account.amount || 0, account.currency)}
                                                </p>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    /{account.billingCycle || 'monthly'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                {account.role || 'user'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                {filteredAccounts.length > 0 && (
                    <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Showing {filteredAccounts.length} of {accounts.length} accounts</span>
                            <span>Last updated: {new Date().toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}