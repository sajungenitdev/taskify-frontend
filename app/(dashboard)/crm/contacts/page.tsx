// app/(dashboard)/crm/contacts/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
    Plus,
    Search,
    Users,
    Filter,
    RefreshCw,
    Flame,
    Thermometer,
    Snowflake,
    X,
    Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { ContactTable } from "@/components/crm/ContactTable";
import { AddContactModal } from "@/components/crm/modals/AddContactModal";
import { EditContactModal } from "@/components/crm/modals/EditContactModal";
import { useContacts } from "@/hooks/crm/useContacts";
import { contactApi } from "@/lib/api/crm.api";
import type { Contact } from "@/types/crm/crm.types";

// ==========================================
// Types & Domain Definitions
// ==========================================

export type ContactTagFilter = "all" | "hot" | "warm" | "cold";

interface TagPillOption {
    readonly value: ContactTagFilter;
    readonly label: string;
    readonly icon?: React.ComponentType<{ className?: string }>;
    readonly activeClass: string;
}

// ==========================================
// Static Visual Configurations
// ==========================================

const TAG_OPTIONS: readonly TagPillOption[] = [
    {
        value: "all",
        label: "All Leads",
        activeClass: "bg-slate-900 text-white shadow-xs",
    },
    {
        value: "hot",
        label: "Hot",
        icon: Flame,
        activeClass: "bg-rose-600 text-white shadow-xs",
    },
    {
        value: "warm",
        label: "Warm",
        icon: Thermometer,
        activeClass: "bg-amber-500 text-white shadow-xs",
    },
    {
        value: "cold",
        label: "Cold",
        icon: Snowflake,
        activeClass: "bg-sky-600 text-white shadow-xs",
    },
];

// ==========================================
// Main Component
// ==========================================

export default function ContactsPage() {
    const [searchInput, setSearchInput] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");
    const [selectedTag, setSelectedTag] = useState<ContactTagFilter>("all");
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [editing, setEditing] = useState<Contact | null>(null);

    // Debounce search input to minimize API load
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data, loading, refetch } = useContacts({
        search: debouncedSearch || undefined,
        tag: selectedTag === "all" ? undefined : selectedTag,
    });

    const contactsList = useMemo(() => (Array.isArray(data) ? data : []), [data]);

    // Derived KPI metrics
    const stats = useMemo(() => {
        let hotCount = 0;
        let warmCount = 0;
        let coldCount = 0;

        for (const c of contactsList) {
            const tag = (c.tag || "").toLowerCase();
            if (tag === "hot") hotCount++;
            else if (tag === "warm") warmCount++;
            else if (tag === "cold") coldCount++;
        }

        return { total: contactsList.length, hotCount, warmCount, coldCount };
    }, [contactsList]);

    // Execute archive/delete action
    const executeArchive = useCallback(
        async (contactId: string, toastId: string) => {
            toast.dismiss(toastId);
            const loadingToast = toast.loading("Archiving contact record...");

            try {
                await contactApi.remove(contactId);
                toast.success("Contact archived successfully", { id: loadingToast });
                refetch();
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : "Failed to archive contact";
                toast.error(message, { id: loadingToast });
            }
        },
        [refetch]
    );

    // Modern In-Toast Confirmation replacing window.confirm()
    const handleDelete = useCallback(
        (contact: Contact) => {
            toast(
                (t) => (
                    <div className="flex flex-col gap-2.5 py-1 text-slate-900">
                        <div>
                            <p className="text-xs font-bold text-slate-900">
                                Archive {contact.name}?
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                This record will be moved out of your active pipeline.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => toast.dismiss(t.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => executeArchive(contact._id, t.id)}
                                className="px-3 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <Trash2 className="w-3 h-3" />
                                Archive
                            </button>
                        </div>
                    </div>
                ),
                {
                    duration: 7000,
                    position: "top-center",
                    style: {
                        borderRadius: "1rem",
                        border: "1px solid #e2e8f0",
                        padding: "0.85rem 1rem",
                        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15)",
                        background: "#ffffff",
                    },
                }
            );
        },
        [executeArchive]
    );

    const handleClearFilters = useCallback(() => {
        setSearchInput("");
        setDebouncedSearch("");
        setSelectedTag("all");
    }, []);

    const hasActiveFilters = Boolean(searchInput || selectedTag !== "all");

    return (
        <main className="min-h-screen bg-slate-50/70 pb-16 text-slate-900">
            <div className="mx-auto container space-y-6 p-6 lg:p-8">
                {/* Modern Header Banner */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10 shrink-0">
                            <Users className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Contacts Directory
                            </h1>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">
                                Manage prospective leads, active client accounts, and stakeholders
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={loading}
                            aria-label="Refresh Contacts"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50 cursor-pointer"
                            title="Refresh Directory"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-slate-900" : ""}`} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Contact</span>
                        </button>
                    </div>
                </header>

                {/* Executive Metric Cards */}
                <section
                    aria-label="Contact Summary Metrics"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                >
                    <StatMiniTile
                        label="Total Results"
                        value={stats.total}
                        colorClass="text-slate-950"
                    />
                    <StatMiniTile
                        label="Hot Leads"
                        value={stats.hotCount}
                        colorClass="text-rose-600"
                        icon={Flame}
                        iconBg="bg-rose-50 text-rose-600"
                    />
                    <StatMiniTile
                        label="Warm Leads"
                        value={stats.warmCount}
                        colorClass="text-amber-600"
                        icon={Thermometer}
                        iconBg="bg-amber-50 text-amber-600"
                    />
                    <StatMiniTile
                        label="Cold Leads"
                        value={stats.coldCount}
                        colorClass="text-sky-600"
                        icon={Snowflake}
                        iconBg="bg-sky-50 text-sky-600"
                    />
                </section>

                {/* Sleek Search & Filter Bar */}
                <section
                    aria-label="Search and Filters"
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs"
                >
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, company, or email..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => setSearchInput("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                aria-label="Clear Search Input"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Tag Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                        <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1 mr-1" />
                        {TAG_OPTIONS.map((opt) => {
                            const isActive = selectedTag === opt.value;
                            const Icon = opt.icon;

                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setSelectedTag(opt.value)}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${isActive
                                            ? opt.activeClass
                                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50"
                                        }`}
                                >
                                    {Icon && <Icon className="h-3 w-3" />}
                                    <span>{opt.label}</span>
                                </button>
                            );
                        })}

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-900 hover:underline px-2.5 py-1 ml-1 cursor-pointer transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </section>

                {/* Contacts Table Wrapper */}
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                    <ContactTable
                        contacts={contactsList}
                        loading={loading}
                        onDelete={handleDelete}
                        onEdit={setEditing}
                    />
                </section>
            </div>

            {/* Add Contact Modal Dialog */}
            <AddContactModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onCreated={() => refetch()}
            />

            {/* Edit Contact Modal Dialog */}
            <EditContactModal
                open={!!editing}
                onOpenChange={(o) => !o && setEditing(null)}
                contact={editing}
                onUpdated={() => {
                    setEditing(null);
                    refetch();
                }}
            />
        </main>
    );
}

// ==========================================
// Sub-Components
// ==========================================

interface StatMiniTileProps {
    label: string;
    value: number;
    colorClass: string;
    icon?: React.ComponentType<{ className?: string }>;
    iconBg?: string;
}

const StatMiniTile = memo(function StatMiniTile({
    label,
    value,
    colorClass,
    icon: Icon,
    iconBg = "bg-slate-50 text-slate-400",
}: StatMiniTileProps) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between transition hover:border-slate-300">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                </p>
                <p className={`text-xl font-bold font-mono tracking-tight mt-1 ${colorClass}`}>
                    {value.toLocaleString()}
                </p>
            </div>
            {Icon && (
                <div className={`p-2.5 rounded-xl border border-slate-100 ${iconBg}`}>
                    <Icon className="w-4 h-4" />
                </div>
            )}
        </div>
    );
});