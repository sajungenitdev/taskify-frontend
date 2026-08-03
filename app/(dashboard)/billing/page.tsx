// app/(dashboard)/billing/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    CreditCard,
    FileText,
    Repeat,
    Wallet,
    History,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Plus,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    User,
    Building2,
    Mail,
    Phone,
} from "lucide-react";
import { apiService } from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

interface BillingSummary {
    totalSpent: number;
    currentBalance: number;
    overdueAmount: number;
    upcomingInvoices: number;
    activeSubscriptions: number;
    lastPayment: string;
    nextPayment: string;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    status: "paid" | "pending" | "overdue" | "cancelled";
    issuedDate: string;
    dueDate: string;
    paidDate?: string;
    description: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
}

interface Subscription {
    id: string;
    plan: string;
    status: "active" | "cancelled" | "expired" | "trial";
    startDate: string;
    endDate: string;
    price: number;
    currency: string;
    billingCycle: "monthly" | "yearly" | "quarterly";
    features: string[];
}

export default function BillingPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<BillingSummary | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    useEffect(() => {
        fetchBillingData();
    }, []);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            // Fetch billing data from API
            const [summaryRes, invoicesRes, subscriptionsRes] = await Promise.all([
                apiService.get("/billing/summary"),
                apiService.get("/billing/invoices"),
                apiService.get("/billing/subscriptions"),
            ]);

            if (summaryRes.success) setSummary(summaryRes.data);
            if (invoicesRes.success) setInvoices(invoicesRes.data);
            if (subscriptionsRes.success) setSubscriptions(subscriptionsRes.data);
        } catch (error) {
            console.error("Error fetching billing data:", error);
            toast.error("Failed to load billing data");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            paid: "bg-green-100 text-green-700 border-green-200",
            pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
            overdue: "bg-red-100 text-red-700 border-red-200",
            cancelled: "bg-gray-100 text-gray-700 border-gray-200",
            active: "bg-green-100 text-green-700 border-green-200",
            expired: "bg-red-100 text-red-700 border-red-200",
            trial: "bg-blue-100 text-blue-700 border-blue-200",
        };
        return colors[status as keyof typeof colors] || colors.pending;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "paid":
            case "active":
                return <CheckCircle className="w-4 h-4" />;
            case "pending":
            case "trial":
                return <Clock className="w-4 h-4" />;
            case "overdue":
            case "expired":
                return <AlertCircle className="w-4 h-4" />;
            case "cancelled":
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const formatCurrency = (amount: number, currency: string = "USD") => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">Loading billing data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 container mx-auto max-w-7xl">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                            <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Billing</h1>
                            <p className="text-indigo-100 text-sm">
                                Manage your billing, invoices, and subscriptions
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

                {/* Summary Stats */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-indigo-100 text-xs">Total Spent</p>
                            <p className="text-white text-xl font-bold">
                                {formatCurrency(summary.totalSpent)}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-indigo-100 text-xs">Current Balance</p>
                            <p className={`text-xl font-bold ${summary.currentBalance > 0 ? "text-green-300" : "text-white"}`}>
                                {formatCurrency(summary.currentBalance)}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-indigo-100 text-xs">Active Subscriptions</p>
                            <p className="text-white text-xl font-bold">{summary.activeSubscriptions}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-indigo-100 text-xs">Next Payment</p>
                            <p className="text-white text-xl font-bold">
                                {summary.nextPayment ? formatDate(summary.nextPayment) : "N/A"}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <button className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Invoices</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">View all invoices</p>
                        </div>
                    </div>
                </button>
                <button className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <Repeat className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Subscriptions</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Manage plans</p>
                        </div>
                    </div>
                </button>
                <button className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                            <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Payment Methods</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Add payment method</p>
                        </div>
                    </div>
                </button>
                <button className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                            <History className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">History</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">View transactions</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Invoices</h2>
                    <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                        View All <TrendingUp className="w-4 h-4" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Invoice
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {invoices.slice(0, 5).map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {invoice.invoiceNumber}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {invoice.description}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {formatDate(invoice.issuedDate)}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(invoice.amount, invoice.currency)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                            {getStatusIcon(invoice.status)}
                                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedInvoice(invoice);
                                                    setShowInvoiceModal(true);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="View Invoice"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Download PDF">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Subscriptions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {subscriptions.map((subscription) => (
                        <div
                            key={subscription.id}
                            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {subscription.plan}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {subscription.billingCycle}
                                    </p>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                                    {getStatusIcon(subscription.status)}
                                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                                </span>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {formatCurrency(subscription.price, subscription.currency)}
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                    /{subscription.billingCycle}
                                </span>
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>Start: {formatDate(subscription.startDate)}</span>
                                <span>End: {formatDate(subscription.endDate)}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {subscription.features.slice(0, 3).map((feature, index) => (
                                    <span key={index} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs text-gray-600 dark:text-gray-300">
                                        {feature}
                                    </span>
                                ))}
                                {subscription.features.length > 3 && (
                                    <span className="px-2 py-0.5 text-xs text-gray-400">
                                        +{subscription.features.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invoice Detail Modal */}
            {showInvoiceModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                    <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Invoice {selectedInvoice.invoiceNumber}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Issued: {formatDate(selectedInvoice.issuedDate)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowInvoiceModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <XCircle className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Invoice Details */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                                        {getStatusIcon(selectedInvoice.status)}
                                        {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Due Date</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDate(selectedInvoice.dueDate)}
                                    </p>
                                </div>
                                {selectedInvoice.paidDate && (
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Paid Date</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {formatDate(selectedInvoice.paidDate)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Invoice Items */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Items</h4>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 dark:bg-gray-600">
                                            <tr>
                                                <th className="text-left px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300">Description</th>
                                                <th className="text-center px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300">Qty</th>
                                                <th className="text-right px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300">Unit Price</th>
                                                <th className="text-right px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {selectedInvoice.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.description}</td>
                                                    <td className="px-4 py-2 text-sm text-center text-gray-700 dark:text-gray-300">{item.quantity}</td>
                                                    <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                                                        {formatCurrency(item.unitPrice, selectedInvoice.currency)}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                        {formatCurrency(item.total, selectedInvoice.currency)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-100 dark:bg-gray-600">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Total
                                                </td>
                                                <td className="px-4 py-2 text-right text-sm font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    Close
                                </button>
                                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}