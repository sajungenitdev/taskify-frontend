// app/(dashboard)/tenders/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    Loader2,
    Play,
    Save,
    Search,
    X,
    Plus,
    Mail,
    UserCheck,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Building2,
    Globe,
    Calendar,
    FileText,
    TrendingUp,
} from "lucide-react";

/* ============================================================
 * Types
 * ============================================================ */
interface SelectableUser {
    _id: string;
    fullName: string;
    email: string;
    role?: string;
    department?: string;
}

interface TenderSettings {
    sectors: string[];
    customSectors: string[];
    productLines: string[];
    customProductLines: string[];
    valueMin: number | null;
    valueMax: number | null;
    securityMin: number | null;
    securityMax: number | null;
    performanceMin: number | null;
    performanceMax: number | null;
    tenderTypes: string[];
    customTenderTypes: string[];
    crawlTime: string;
    notificationRecipientIds: string[];
    customRangeNote?: string;
}

interface CrawlResult {
    tenderId?: string | null;
    title: string;
    tenderer: string;
    sourceSite: string;
    sourceUrl: string;
    budget: number;
    securityAmount: number;
    publishedAt: string | null;
    matchedOn: string[];
}

interface LastCrawl {
    at: string;
    sitesChecked: number;
    newFound: number;
    matched: number;
    emailed?: number;
    results?: CrawlResult[];
}

/* ============================================================
 * Constants
 * ============================================================ */
const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

const SECTORS = [
    "Government",
    "Power & Energy",
    "Telecom",
    "Oil & Gas",
    "Financial",
    "Education",
    "Healthcare",
];

const PRODUCT_LINES = [
    "Computer & Electronics",
    "IoT Sensors",
    "Networking Equipment",
    "Backup & Storage Solutions",
    "Laboratory Equipment",
    "Office Equipment",
    "Construction Materials",
    "Industrial Sensors",
    "Safety & Security Systems",
    "Software Licensing",
    "Power & Energy Equipment",
    "Medical Equipment",
    "Telecommunication Equipment",
    "Vehicles & Transport",
];

const TENDER_TYPES = ["eGP", "RFQ", "Direct"];

const DEFAULT_SETTINGS: TenderSettings = {
    sectors: ["Government", "Power & Energy", "Financial"],
    customSectors: [],
    productLines: [
        "Computer & Electronics",
        "IoT Sensors",
        "Industrial Sensors",
        "Software Licensing",
    ],
    customProductLines: [],
    valueMin: 500000,
    valueMax: null,
    securityMin: 10000,
    securityMax: 5000000,
    performanceMin: null,
    performanceMax: 20000000,
    tenderTypes: ["eGP", "RFQ"],
    customTenderTypes: [],
    crawlTime: "06:00",
    notificationRecipientIds: [],
    customRangeNote: "",
};

/* ============================================================
 * Helpers
 * ============================================================ */
function authHeaders(): HeadersInit {
    if (typeof window === "undefined")
        return { "Content-Type": "application/json" };
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

function formatBDT(n: number | null | undefined) {
    if (n == null || n === 0) return "—";
    return `৳${n.toLocaleString("en-IN")}`;
}
function parseBDT(v: string): number | null {
    const cleaned = v.replace(/[^\d]/g, "");
    return cleaned ? Number(cleaned) : null;
}
function formatDate(iso: string | null | undefined) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

/* ============================================================
 * Sub-components
 * ============================================================ */

/* ---------- Checkbox grid ---------- */
function CheckGrid({
    options,
    value,
    onChange,
    onAddCustom,
    customLabel,
    disabled,
}: {
    options: string[];
    value: string[];
    onChange: (v: string[]) => void;
    onAddCustom?: () => void;
    customLabel?: string;
    disabled?: boolean;
}) {
    const toggle = (opt: string) =>
        onChange(
            value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt],
        );
    return (
        <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {options.map((opt) => (
                    <label
                        key={opt}
                        className={`inline-flex cursor-pointer items-center gap-2 text-[13px] ${disabled ? "opacity-60" : ""
                            }`}
                    >
                        <input
                            type="checkbox"
                            checked={value.includes(opt)}
                            onChange={() => toggle(opt)}
                            disabled={disabled}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-[#a97400] focus:ring-[#a97400]"
                        />
                        <span className="text-slate-700">{opt}</span>
                    </label>
                ))}
            </div>
            {onAddCustom && (
                <button
                    type="button"
                    onClick={onAddCustom}
                    disabled={disabled}
                    className="mt-3 text-[12px] font-semibold text-[#a97400] hover:underline disabled:opacity-50"
                >
                    + {customLabel ?? "Add Custom"}
                </button>
            )}
        </>
    );
}

/* ---------- Range box ---------- */
function RangeBox({
    label,
    minValue,
    maxValue,
    onMinChange,
    onMaxChange,
    disabled,
}: {
    label: string;
    minValue: number | null;
    maxValue: number | null;
    onMinChange: (v: number | null) => void;
    onMaxChange: (v: number | null) => void;
    disabled?: boolean;
}) {
    return (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {label}
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Min (৳)
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={minValue == null ? "" : minValue.toLocaleString("en-IN")}
                        placeholder="No limit"
                        disabled={disabled}
                        onChange={(e) => onMinChange(parseBDT(e.target.value))}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-[13px] text-slate-800 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Max (৳)
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={maxValue == null ? "" : maxValue.toLocaleString("en-IN")}
                        placeholder="No limit"
                        disabled={disabled}
                        onChange={(e) => onMaxChange(parseBDT(e.target.value))}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-[13px] text-slate-800 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                </div>
            </div>
        </div>
    );
}

/* ---------- Notification recipients picker ---------- */
function NotificationRecipients({
    users,
    selectedIds,
    onChange,
    disabled,
}: {
    users: SelectableUser[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    disabled?: boolean;
}) {
    const [search, setSearch] = useState("");
    const [pickerOpen, setPickerOpen] = useState(false);

    const selected = users.filter((u) => selectedIds.includes(u._id));
    const available = users.filter((u) => !selectedIds.includes(u._id));
    const filtered = (() => {
        const q = search.trim().toLowerCase();
        if (!q) return available;
        return available.filter(
            (u) =>
                u.fullName.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q),
        );
    })();

    const add = (id: string) => {
        onChange([...selectedIds, id]);
        setSearch("");
        setPickerOpen(false);
    };
    const remove = (id: string) => {
        onChange(selectedIds.filter((x) => x !== id));
    };

    return (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <header className="mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Tender Notification Recipients
                </h3>
                <p className="mt-1 text-[12px] text-slate-500">
                    These users will be emailed when the daily crawl finds new tenders
                    matching your criteria.
                </p>
            </header>

            <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
                {selected.length === 0 ? (
                    <p className="py-2 text-center text-[12px] text-slate-400">
                        No recipients selected yet. Add someone below.
                    </p>
                ) : (
                    <ul className="flex flex-wrap gap-2">
                        {selected.map((u) => (
                            <li
                                key={u._id}
                                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-[#f4ead6] py-1 pl-1 pr-2.5 text-[12px] font-medium text-[#8a6a2b]"
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8a6a2b] text-[10px] font-bold text-white">
                                    {u.fullName.charAt(0).toUpperCase()}
                                </span>
                                <span className="flex flex-col leading-tight">
                                    <span className="font-semibold">{u.fullName}</span>
                                    <span className="text-[10px] text-[#8a6a2b]/80">
                                        {u.email}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => remove(u._id)}
                                    disabled={disabled}
                                    className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[#8a6a2b]/70 transition hover:bg-[#8a6a2b]/10 hover:text-[#8a6a2b] disabled:opacity-50"
                                    aria-label={`Remove ${u.fullName}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {!pickerOpen ? (
                <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    disabled={disabled || available.length === 0}
                    className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add recipient
                </button>
            ) : (
                <div className="mt-3 rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                        <Search className="h-3.5 w-3.5 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            disabled={disabled}
                            className="h-7 w-full border-none bg-transparent text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setPickerOpen(false);
                            }}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Cancel"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="max-h-[220px] overflow-y-auto p-1.5">
                        {filtered.length === 0 ? (
                            <p className="py-6 text-center text-[11px] text-slate-400">
                                {available.length === 0
                                    ? "All users are already recipients."
                                    : "No users match your search."}
                            </p>
                        ) : (
                            filtered.map((u) => (
                                <button
                                    key={u._id}
                                    type="button"
                                    onClick={() => add(u._id)}
                                    disabled={disabled}
                                    className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                                        {u.fullName.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[12px] font-semibold text-slate-800">
                                            {u.fullName}
                                        </span>
                                        <span className="block truncate text-[11px] text-slate-500">
                                            {u.email}
                                            {u.role ? ` · ${u.role}` : ""}
                                        </span>
                                    </span>
                                    <Plus className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {selected.length > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/40 px-3 py-2">
                    <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
                    <p className="text-[11px] leading-relaxed text-sky-800">
                        {selected.length} recipient
                        {selected.length === 1 ? "" : "s"} will be notified by email
                        whenever a new tender matches the criteria below.
                    </p>
                </div>
            )}
            {selected.length === 0 && available.length > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2">
                    <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <p className="text-[11px] leading-relaxed text-amber-800">
                        No recipients yet — no one will be emailed when a matching tender is
                        auto-discovered.
                    </p>
                </div>
            )}
        </section>
    );
}

/* ---------- Single crawl result card ---------- */
function CrawlResultCard({ result }: { result: CrawlResult }) {
    const manageUrl = result.tenderId
        ? `/tenders/manage?id=${result.tenderId}`
        : result.sourceUrl || "#";

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h4 className="text-[13px] font-bold leading-snug text-slate-900">
                        {result.title}
                    </h4>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        {result.tenderer && (
                            <span className="inline-flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {result.tenderer}
                            </span>
                        )}
                        {result.sourceSite && (
                            <span className="inline-flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {result.sourceSite}
                            </span>
                        )}
                        {result.publishedAt && (
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(result.publishedAt)}
                            </span>
                        )}
                    </div>
                </div>

                <a
                    href={manageUrl}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    <ExternalLink className="h-3 w-3" />
                    Open
                </a>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px]">
                <span className="text-slate-500">
                    Budget:{" "}
                    <strong className="font-mono font-semibold text-slate-800">
                        {formatBDT(result.budget)}
                    </strong>
                </span>
                <span className="text-slate-500">
                    Security:{" "}
                    <strong className="font-mono font-semibold text-slate-800">
                        {formatBDT(result.securityAmount)}
                    </strong>
                </span>
            </div>

            {result.matchedOn && result.matchedOn.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {result.matchedOn.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                        >
                            ✓ {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ============================================================
 * Main page
 * ============================================================ */
export default function TenderSettingsPage() {
    const [settings, setSettings] = useState<TenderSettings>(DEFAULT_SETTINGS);
    const [users, setUsers] = useState<SelectableUser[]>([]);
    const [lastCrawl, setLastCrawl] = useState<LastCrawl | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [crawling, setCrawling] = useState(false);
    const [resultsOpen, setResultsOpen] = useState(false);

    /* ---------- Fetch on mount ---------- */
    useEffect(() => {
        const load = async () => {
            try {
                /* 1. Settings */
                let sRes: any = { data: null };
                try {
                    const r = await fetch(`${API_BASE}/tenders/settings`, {
                        headers: authHeaders(),
                    });
                    if (r.ok) sRes = await r.json();
                } catch { }

                /* 2. Users — /users first, /auth/users fallback */
                let uRes: any = { data: [] };
                try {
                    const r = await fetch(`${API_BASE}/users`, {
                        headers: authHeaders(),
                    });
                    if (r.ok) uRes = await r.json();
                } catch { }
                if (!Array.isArray(uRes?.data) || uRes.data.length === 0) {
                    try {
                        const r = await fetch(`${API_BASE}/auth/users`, {
                            headers: authHeaders(),
                        });
                        if (r.ok) uRes = await r.json();
                    } catch { }
                }

                /* 3. Last crawl */
                let cRes: any = { data: null };
                try {
                    const r = await fetch(`${API_BASE}/tenders/crawl/last`, {
                        headers: authHeaders(),
                    });
                    if (r.ok) cRes = await r.json();
                } catch { }

                if (sRes?.data) setSettings({ ...DEFAULT_SETTINGS, ...sRes.data });
                setUsers(Array.isArray(uRes?.data) ? uRes.data : []);
                setLastCrawl(cRes?.data ?? null);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const patch = <K extends keyof TenderSettings>(
        key: K,
        value: TenderSettings[K],
    ) => setSettings((s) => ({ ...s, [key]: value }));

    /* ---------- Save ---------- */
    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        const loadingId = toast.loading("Saving settings...");
        try {
            const res = await fetch(`${API_BASE}/tenders/settings`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify(settings),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.success === false) {
                throw new Error(json.message || `Save failed (${res.status})`);
            }
            setSettings({ ...DEFAULT_SETTINGS, ...json.data });
            toast.success("Tender settings saved", { id: loadingId });
        } catch (e) {
            toast.error((e as Error).message || "Save failed", { id: loadingId });
        } finally {
            setSaving(false);
        }
    };

    /* ---------- Run crawl ---------- */
    const handleCrawl = async () => {
        if (crawling) return;
        setCrawling(true);
        const loadingId = toast.loading("Running crawl...");
        try {
            const res = await fetch(`${API_BASE}/tenders/crawl/run`, {
                method: "POST",
                headers: authHeaders(),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.success === false) {
                throw new Error(json.message || `Crawl failed (${res.status})`);
            }
            if (json.data) {
                setLastCrawl(json.data);
                setResultsOpen(true);
            }
            toast.success(
                `Crawl done — ${json.data?.matched ?? 0} matched of ${json.data?.newFound ?? 0} new`,
                { id: loadingId },
            );
        } catch (e) {
            toast.error((e as Error).message || "Crawl failed", { id: loadingId });
        } finally {
            setCrawling(false);
        }
    };

    /* ---------- Custom add helpers ---------- */
    const addCustom = (
        promptText: string,
        currentCustom: string[],
        currentMain: string[],
        customKey: keyof TenderSettings,
        mainKey: keyof TenderSettings,
    ) => {
        const v = window.prompt(promptText);
        if (!v?.trim()) return;
        const name = v.trim();
        if ([...currentMain, ...currentCustom].includes(name)) {
            toast.error(`"${name}" already exists`);
            return;
        }
        patch(customKey, [...currentCustom, name] as never);
        patch(mainKey, [...currentMain, name] as never);
    };

    /* ---------- Render ---------- */
    const allSectors = [...SECTORS, ...settings.customSectors];
    const allProductLines = [...PRODUCT_LINES, ...settings.customProductLines];
    const allTenderTypes = [...TENDER_TYPES, ...settings.customTenderTypes];

    if (loading) {
        return (
            <main className="min-h-screen bg-[#faf7f0] pb-24 text-slate-900">
                <div className="mx-auto max-w-[1400px] space-y-5 p-6 lg:p-8">
                    <div className="h-[80px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div className="h-[280px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
                        <div className="h-[280px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
                    </div>
                    <div className="h-[140px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
                </div>
            </main>
        );
    }

    const crawlResults = lastCrawl?.results ?? [];
    const hasResults = crawlResults.length > 0;

    return (
        <main className="min-h-screen bg-[#faf7f0] pb-24 text-slate-900">
            <div className="mx-auto max-w-[1400px] space-y-5 p-6 lg:p-8">
                {/* Header */}
                <header>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#a97400]">
                        Tender Management
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                        Tender Settings
                    </h1>
                    <p className="mt-1 text-[13px] text-slate-500">
                        Configure the automated daily tender search — sectors, product
                        lines, value ranges, notification recipients, and crawl schedule.
                    </p>
                </header>

                {/* Intro card */}
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Automated Daily Tender Search
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                        Every morning, the system checks all sites listed in Tender
                        Management › Site Directory for newly published tenders, and
                        automatically adds anything matching the criteria below to your
                        Potential list — flagged{" "}
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#f4ead6] px-2 py-0.5 text-[11px] font-semibold text-[#8a6a2b]">
                            🚩 Auto-discovered
                        </span>{" "}
                        so you know it wasn't entered manually.
                    </p>
                </section>

                {/* Sectors + Product Lines */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Sectors to Match
                        </h3>
                        <CheckGrid
                            options={allSectors}
                            value={settings.sectors}
                            onChange={(v) => patch("sectors", v)}
                            onAddCustom={() =>
                                addCustom(
                                    "New sector name:",
                                    settings.customSectors,
                                    settings.sectors,
                                    "customSectors",
                                    "sectors",
                                )
                            }
                            customLabel="Add Custom Sector"
                            disabled={saving}
                        />
                    </section>

                    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Product Lines to Match
                        </h3>
                        <CheckGrid
                            options={allProductLines}
                            value={settings.productLines}
                            onChange={(v) => patch("productLines", v)}
                            onAddCustom={() =>
                                addCustom(
                                    "New product line:",
                                    settings.customProductLines,
                                    settings.productLines,
                                    "customProductLines",
                                    "productLines",
                                )
                            }
                            customLabel="Add Custom Product Line"
                            disabled={saving}
                        />
                    </section>
                </div>

                {/* Ranges */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <RangeBox
                        label="Tender Value Range"
                        minValue={settings.valueMin}
                        maxValue={settings.valueMax}
                        onMinChange={(v) => patch("valueMin", v)}
                        onMaxChange={(v) => patch("valueMax", v)}
                        disabled={saving}
                    />
                    <RangeBox
                        label="Tender Security Range"
                        minValue={settings.securityMin}
                        maxValue={settings.securityMax}
                        onMinChange={(v) => patch("securityMin", v)}
                        onMaxChange={(v) => patch("securityMax", v)}
                        disabled={saving}
                    />
                    <RangeBox
                        label="Performance Security Range"
                        minValue={settings.performanceMin}
                        maxValue={settings.performanceMax}
                        onMinChange={(v) => patch("performanceMin", v)}
                        onMaxChange={(v) => patch("performanceMax", v)}
                        disabled={saving}
                    />
                </div>

                {/* Custom Range Criteria */}
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Custom Range Criteria
                    </h3>
                    <p className="mt-1 text-[12px] text-slate-500">
                        Optional notes the crawler should consider when matching — e.g.
                        "prefer BD Govt tenders over 1 crore".
                    </p>
                    <textarea
                        value={settings.customRangeNote ?? ""}
                        onChange={(e) => patch("customRangeNote", e.target.value)}
                        disabled={saving}
                        rows={3}
                        placeholder="e.g. Prefer tenders with a value above ৳1,00,00,000 in the Power sector."
                        className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                </section>

                {/* Notification Recipients */}
                <NotificationRecipients
                    users={users}
                    selectedIds={settings.notificationRecipientIds}
                    onChange={(ids) => patch("notificationRecipientIds", ids)}
                    disabled={saving}
                />

                {/* Tender Type */}
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Tender Type
                    </h3>
                    <CheckGrid
                        options={allTenderTypes}
                        value={settings.tenderTypes}
                        onChange={(v) => patch("tenderTypes", v)}
                        onAddCustom={() =>
                            addCustom(
                                "New tender type:",
                                settings.customTenderTypes,
                                settings.tenderTypes,
                                "customTenderTypes",
                                "tenderTypes",
                            )
                        }
                        customLabel="Add Custom Tender Type"
                        disabled={saving}
                    />
                </section>

                {/* Crawl Schedule */}
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Crawl Schedule
                            </h3>
                            <p className="mt-1 text-[12px] text-slate-500">
                                Site list is managed in{" "}
                                <a
                                    href="/tenders/tender-sites"
                                    className="font-semibold text-[#a97400] hover:underline"
                                >
                                    Tender Management › Site Directory
                                </a>{" "}
                                — every site listed there is checked automatically.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[12px] text-slate-500">Run daily at</span>
                            <input
                                type="time"
                                value={settings.crawlTime}
                                onChange={(e) => patch("crawlTime", e.target.value)}
                                disabled={saving}
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 font-mono text-[13px] text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50"
                            />
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Save className="h-3.5 w-3.5" />
                                )}
                                {saving ? "Saving…" : "Save Criteria"}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Last Automated Crawl — with results list */}
                <section className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Last Automated Crawl
                            </h3>
                            <p className="mt-1 text-[12px] text-slate-500">
                                {lastCrawl
                                    ? `${lastCrawl.at} · ${lastCrawl.sitesChecked} sites checked · ${lastCrawl.newFound} new tenders found · ${lastCrawl.matched} matched your criteria`
                                    : "No crawl has been run yet."}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            {hasResults && (
                                <button
                                    type="button"
                                    onClick={() => setResultsOpen((v) => !v)}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    {resultsOpen ? (
                                        <ChevronUp className="h-3.5 w-3.5" />
                                    ) : (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    )}
                                    {resultsOpen ? "Hide" : "View"} {crawlResults.length} match
                                    {crawlResults.length === 1 ? "" : "es"}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleCrawl}
                                disabled={crawling}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {crawling ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Play className="h-3.5 w-3.5" />
                                )}
                                {crawling ? "Running…" : "Run Crawl Now"}
                            </button>
                        </div>
                    </div>

                    {/* Expandable results */}
                    {resultsOpen && (
                        <div className="border-t border-slate-100 bg-slate-50/40 p-5">
                            {!hasResults ? (
                                <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center">
                                    <FileText className="mx-auto h-8 w-8 text-slate-300" />
                                    <p className="mt-3 text-[13px] font-semibold text-slate-700">
                                        No matching tenders found
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Either your DB has no tenders in the last 90 days, or your
                                        filters are too strict. Try loosening a range and running
                                        again.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                                            {crawlResults.length} matched tender
                                            {crawlResults.length === 1 ? "" : "s"}
                                        </p>
                                    </div>
                                    <div className="space-y-2.5">
                                        {crawlResults.map((r, i) => (
                                            <CrawlResultCard
                                                key={r.tenderId || `${r.title}-${i}`}
                                                result={r}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}